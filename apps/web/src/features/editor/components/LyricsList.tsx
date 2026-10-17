import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useEditor, useTime } from '../context';
import { LyricLine } from './LyricLine';

type Props = {
  seekTo: (ms: number) => void;
};

export const LyricsList = ({ seekTo }: Props) => {
  const { state, dispatch } = useEditor();
  const { currentTimeMs } = useTime();
  const focusedRowRef = useRef<HTMLDivElement>(null);

  // Refs keep handler callbacks stable without stale closure issues
  const focusedLineIdRef = useRef(state.focusedLineId);
  focusedLineIdRef.current = state.focusedLineId;

  const segmentsRef = useRef(state.segments);
  segmentsRef.current = state.segments;

  const seekToRef = useRef(seekTo);
  seekToRef.current = seekTo;

  const sorted = useMemo(
    () => [...state.lines].sort((a, b) => a.index - b.index),
    [state.lines],
  );

  const activeLineId = useMemo(
    () =>
      Object.values(state.segments).find(
        (seg) => currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms,
      )?.line_id ?? null,
    [currentTimeMs, state.segments],
  );

  useEffect(() => {
    focusedRowRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [state.focusedLineId]);

  const handleSelect = useCallback(
    (lineId: string, e: React.MouseEvent) => {
      if (e.shiftKey && focusedLineIdRef.current) {
        dispatch({
          type: 'RANGE_SELECTED',
          payload: { fromId: focusedLineIdRef.current, toId: lineId },
        });
      } else {
        dispatch({
          type: 'LINE_SELECTED',
          payload: { lineId, additive: e.metaKey || e.ctrlKey },
        });
      }
    },
    [dispatch],
  );

  const handleDoubleClick = useCallback((lineId: string) => {
    const seg = segmentsRef.current[lineId];
    if (seg) seekToRef.current(seg.start_ms);
  }, []);

  return (
    <div
      role="listbox"
      aria-label="Lyrics"
      aria-multiselectable="true"
      tabIndex={0}
      className="flex-1 overflow-y-auto py-2 px-2 outline-none"
    >
      {sorted.map((line) => (
        <div
          key={line.id}
          ref={state.focusedLineId === line.id ? focusedRowRef : undefined}
        >
          <LyricLine
            line={line}
            segment={state.segments[line.id]}
            isFocused={state.focusedLineId === line.id}
            isSelected={state.selectedLineIds.has(line.id)}
            isActive={activeLineId === line.id}
            onSelect={handleSelect}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      ))}
    </div>
  );
};
