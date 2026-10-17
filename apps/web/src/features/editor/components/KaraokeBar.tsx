import { useMemo } from 'react';
import { useEditor, useTime } from '../context';
import type { Line } from '../types';

export const KaraokeBar = () => {
  const { state } = useEditor();
  const { currentTimeMs } = useTime();

  const sorted = useMemo(
    () => [...state.lines].sort((a, b) => a.index - b.index),
    [state.lines],
  );

  const { prevLine, currentLine, nextLine, isActive } = useMemo(() => {
    const segs = Object.values(state.segments);

    // Find the segment whose window contains currentTimeMs
    const activeSeg = segs.find(
      (s) => currentTimeMs >= s.start_ms && currentTimeMs < s.end_ms,
    );

    if (activeSeg) {
      const idx = sorted.findIndex((l) => l.id === activeSeg.line_id);
      return {
        prevLine: sorted[idx - 1] ?? null,
        currentLine: sorted[idx] ?? null,
        nextLine: sorted[idx + 1] ?? null,
        isActive: true,
      };
    }

    // In a gap: find the last line that finished playing and the next one to start
    const lastPlayed = segs
      .filter((s) => s.end_ms <= currentTimeMs)
      .sort((a, b) => b.end_ms - a.end_ms)[0];

    const nextTimed = segs
      .filter((s) => s.start_ms > currentTimeMs)
      .sort((a, b) => a.start_ms - b.start_ms)[0];

    const lastLine: Line | null = lastPlayed
      ? (sorted.find((l) => l.id === lastPlayed.line_id) ?? null)
      : null;
    const upcomingLine: Line | null = nextTimed
      ? (sorted.find((l) => l.id === nextTimed.line_id) ?? null)
      : null;

    return {
      prevLine: null,
      currentLine: lastLine,
      nextLine: upcomingLine,
      isActive: false,
    };
  }, [currentTimeMs, state.segments, sorted]);

  return (
    <div className="shrink-0 border-t border-border bg-surface px-6 py-3 flex flex-col items-center gap-1">
      <p className="text-xs text-muted truncate w-full text-center h-4">
        {prevLine?.text ?? ''}
      </p>
      <p
        className={`text-sm font-semibold truncate w-full text-center h-5 ${
          isActive ? 'text-accent' : 'text-muted'
        }`}
      >
        {currentLine?.text ?? ''}
      </p>
      <p className="text-xs text-muted truncate w-full text-center h-4">
        {nextLine?.text ?? ''}
      </p>
    </div>
  );
};
