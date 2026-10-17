import type { Dispatch } from 'react';
import { formatTimecode } from '../utils';
import { NudgeRow } from './NudgeRow';
import { Section } from './Section';
import type { EditorAction, Line, Segment } from '../types';

type Props = {
  lineId: string;
  line: Line | undefined;
  segment: Segment;
  durationMs: number;
  dispatch: Dispatch<EditorAction>;
};

export const SingleLinePanel = ({
  lineId,
  line,
  segment,
  durationMs,
  dispatch,
}: Props) => {
  const nudgeStart = (deltaMs: number) => {
    const newStart = Math.max(
      0,
      Math.min(segment.start_ms + deltaMs, segment.end_ms - 100),
    );
    dispatch({
      type: 'SEGMENT_UPDATED',
      payload: { lineId, startMs: newStart, endMs: segment.end_ms },
    });
  };

  const nudgeEnd = (deltaMs: number) => {
    const newEnd = Math.max(
      segment.start_ms + 100,
      Math.min(segment.end_ms + deltaMs, durationMs),
    );
    dispatch({
      type: 'SEGMENT_UPDATED',
      payload: { lineId, startMs: segment.start_ms, endMs: newEnd },
    });
  };

  return (
    <>
      {line && (
        <p
          className="text-sm font-medium truncate"
          title={line.text}
        >
          {line.text}
        </p>
      )}

      <Section label="Start">
        <p className="text-sm font-mono text-accent mb-1.5">
          {formatTimecode(segment.start_ms)}
        </p>
        <NudgeRow onNudge={nudgeStart} />
      </Section>

      <Section label="End">
        <p className="text-sm font-mono text-accent mb-1.5">
          {formatTimecode(segment.end_ms)}
        </p>
        <NudgeRow onNudge={nudgeEnd} />
      </Section>

      <Section label="Duration">
        <p className="text-sm font-mono text-muted">
          {((segment.end_ms - segment.start_ms) / 1000).toFixed(2)}s
        </p>
      </Section>

      <button
        onClick={() =>
          dispatch({ type: 'SEGMENT_DELETED', payload: { lineId } })
        }
        className="w-full mt-2 py-1.5 text-xs text-danger border-danger hover:opacity-80"
      >
        Delete timing
      </button>
    </>
  );
};
