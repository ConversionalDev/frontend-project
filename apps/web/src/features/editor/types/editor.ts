export type Line = {
  id: string;
  index: number;
  text: string;
};

export type Segment = {
  line_id: string;
  start_ms: number;
  end_ms: number;
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

export type EditorState = {
  trackId: string;
  title: string;
  artist: string;
  durationMs: number;
  audioSrc: string;
  lines: Line[];
  segments: Record<string, Segment>;
  version: number;
  isCustomTrack: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  selectedLineIds: Set<string>;
  focusedLineId: string | null;
};

export type TrackLoadedPayload = {
  trackId: string;
  title: string;
  artist: string;
  durationMs: number;
  audioSrc: string;
  lines: Line[];
  segments: Record<string, Segment>;
  version: number;
  isCustomTrack: boolean;
};

type ApiSegment = { line_id: string; start_ms: number; end_ms: number };

export type ApiTrack = {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  audio_url: string;
  lines: Line[];
  version: number;
  alignment: { segments: ApiSegment[] } | null;
};

export type EditorAction =
  | { type: 'TRACK_LOADED'; payload: TrackLoadedPayload }
  | { type: 'LINE_STAMPED'; payload: { lineId: string; startMs: number } }
  | {
      type: 'SEGMENT_UPDATED';
      payload: { lineId: string; startMs: number; endMs: number };
    }
  | { type: 'SEGMENTS_NUDGED'; payload: { lineIds: string[]; deltaMs: number } }
  | { type: 'SEGMENT_DELETED'; payload: { lineId: string } }
  | { type: 'LINE_FOCUSED'; payload: { lineId: string | null } }
  | { type: 'LINE_SELECTED'; payload: { lineId: string; additive: boolean } }
  | { type: 'RANGE_SELECTED'; payload: { fromId: string; toId: string } }
  | { type: 'SELECTION_CLEARED' }
  | { type: 'SAVE_STARTED' }
  | { type: 'SAVE_SUCCEEDED'; payload: { version: number } }
  | {
      type: 'SAVE_CONFLICTED';
      payload: {
        lines: Line[];
        segments: Record<string, Segment>;
        version: number;
      };
    }
  | { type: 'SAVE_FAILED'; payload: { error: string } };
