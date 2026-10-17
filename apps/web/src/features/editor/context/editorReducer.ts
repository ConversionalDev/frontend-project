import type { EditorAction, EditorState } from '../types';

const STAMP_DEFAULT_DURATION_MS = 5_000;

const linesByIndex = (state: EditorState) =>
  [...state.lines].sort((a, b) => a.index - b.index);

const indicesForIds = (
  state: EditorState,
  fromId: string,
  toId: string,
): string[] => {
  const sorted = linesByIndex(state);
  const from = sorted.findIndex((l) => l.id === fromId);
  const to = sorted.findIndex((l) => l.id === toId);
  if (from === -1 || to === -1) return [];
  const [start, end] = from <= to ? [from, to] : [to, from];
  return sorted.slice(start, end + 1).map((l) => l.id);
};

export const reducer = (
  state: EditorState,
  action: EditorAction,
): EditorState => {
  switch (action.type) {
    case 'TRACK_LOADED': {
      const { payload } = action;
      const firstLine = linesByIndex({ ...state, lines: payload.lines })[0];
      return {
        ...payload,
        saveStatus: 'idle',
        saveError: null,
        selectedLineIds: new Set(firstLine ? [firstLine.id] : []),
        focusedLineId: firstLine?.id ?? null,
      };
    }

    case 'LINE_STAMPED': {
      const { lineId, startMs } = action.payload;
      const sorted = linesByIndex(state);
      const stampedIdx = sorted.findIndex((l) => l.id === lineId);
      if (stampedIdx === -1) return state;

      const newSegments = { ...state.segments };

      // Close the previous line at this stamp point
      const prevLine = sorted[stampedIdx - 1];
      if (prevLine && newSegments[prevLine.id]) {
        newSegments[prevLine.id] = {
          ...newSegments[prevLine.id],
          end_ms: startMs,
        };
      }

      // Look ahead for the next timed line to use as end boundary
      const nextTimed = sorted
        .slice(stampedIdx + 1)
        .find((l) => newSegments[l.id]);
      const endMs = nextTimed
        ? newSegments[nextTimed.id].start_ms
        : Math.min(startMs + STAMP_DEFAULT_DURATION_MS, state.durationMs);

      newSegments[lineId] = {
        line_id: lineId,
        start_ms: startMs,
        end_ms: endMs,
      };

      // Advance focus to the next untimed line, or just the next line
      const remaining = sorted.slice(stampedIdx + 1);
      const nextUntimed = remaining.find((l) => !newSegments[l.id]);
      const nextFocus = nextUntimed ?? remaining[0] ?? null;

      return {
        ...state,
        saveStatus: 'idle',
        segments: newSegments,
        focusedLineId: nextFocus?.id ?? null,
        selectedLineIds: new Set(nextFocus ? [nextFocus.id] : []),
      };
    }

    case 'SEGMENT_UPDATED': {
      const { lineId, startMs, endMs } = action.payload;
      if (!state.segments[lineId]) return state;
      return {
        ...state,
        saveStatus: 'idle',
        segments: {
          ...state.segments,
          [lineId]: { line_id: lineId, start_ms: startMs, end_ms: endMs },
        },
      };
    }

    case 'SEGMENTS_NUDGED': {
      const { lineIds, deltaMs } = action.payload;
      const newSegments = { ...state.segments };

      for (const lineId of lineIds) {
        const seg = newSegments[lineId];
        if (!seg) continue;
        const newStart = Math.max(0, seg.start_ms + deltaMs);
        const newEnd = Math.min(state.durationMs, seg.end_ms + deltaMs);
        if (newEnd <= newStart) continue;
        newSegments[lineId] = { ...seg, start_ms: newStart, end_ms: newEnd };
      }

      return { ...state, saveStatus: 'idle', segments: newSegments };
    }

    case 'SEGMENT_DELETED': {
      const { lineId } = action.payload;
      const newSegments = { ...state.segments };
      delete newSegments[lineId];
      return { ...state, saveStatus: 'idle', segments: newSegments };
    }

    case 'LINE_FOCUSED':
      return { ...state, focusedLineId: action.payload.lineId };

    case 'LINE_SELECTED': {
      const { lineId, additive } = action.payload;
      if (additive) {
        const next = new Set(state.selectedLineIds);
        next.has(lineId) ? next.delete(lineId) : next.add(lineId);
        return { ...state, selectedLineIds: next, focusedLineId: lineId };
      }
      return {
        ...state,
        selectedLineIds: new Set([lineId]),
        focusedLineId: lineId,
      };
    }

    case 'RANGE_SELECTED': {
      const ids = indicesForIds(
        state,
        action.payload.fromId,
        action.payload.toId,
      );
      return { ...state, selectedLineIds: new Set(ids) };
    }

    case 'SELECTION_CLEARED':
      return { ...state, selectedLineIds: new Set() };

    case 'SAVE_STARTED':
      return { ...state, saveStatus: 'saving', saveError: null };

    case 'SAVE_SUCCEEDED':
      return { ...state, saveStatus: 'saved', version: action.payload.version };

    case 'SAVE_CONFLICTED': {
      const { lines, segments, version } = action.payload;
      return {
        ...state,
        lines,
        segments,
        version,
        saveStatus: 'conflict',
        saveError: null,
        selectedLineIds: new Set(),
        focusedLineId: null,
      };
    }

    case 'SAVE_FAILED':
      return { ...state, saveStatus: 'error', saveError: action.payload.error };

    default:
      return state;
  }
};
