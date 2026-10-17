import { useCallback, useRef } from 'react';
import { api, ApiError } from '../../../api';
import { useEditor } from '../context';
import type { Line, Segment } from '../types';

const CUSTOM_LS_KEY = (trackId: string) => `lyric-align-custom-${trackId}`;

type ApiSegment = { line_id: string; start_ms: number; end_ms: number };
type AlignmentResponse = {
  version: number;
  lines: Line[];
  alignment: { segments: ApiSegment[] } | null;
};

const toSegmentsMap = (
  alignment: AlignmentResponse['alignment'],
): Record<string, Segment> =>
  Object.fromEntries((alignment?.segments ?? []).map((s) => [s.line_id, s]));

export const useSave = () => {
  const { state, dispatch } = useEditor();
  const stateRef = useRef(state);
  stateRef.current = state;

  const save = useCallback(async () => {
    const s = stateRef.current;
    if (s.saveStatus === 'saving') return;

    dispatch({ type: 'SAVE_STARTED' });

    if (s.isCustomTrack) {
      localStorage.setItem(
        CUSTOM_LS_KEY(s.trackId),
        JSON.stringify({
          version: s.version,
          lines: s.lines,
          alignment: { segments: Object.values(s.segments) },
        }),
      );
      dispatch({ type: 'SAVE_SUCCEEDED', payload: { version: s.version } });
      return;
    }

    try {
      const result = await api<AlignmentResponse>('/api/v1/track/alignment', {
        method: 'PUT',
        body: JSON.stringify({
          version: s.version,
          lines: s.lines,
          segments: Object.values(s.segments),
        }),
      });
      dispatch({
        type: 'SAVE_SUCCEEDED',
        payload: { version: result.version },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.body as AlignmentResponse;
        dispatch({
          type: 'SAVE_CONFLICTED',
          payload: {
            lines: data.lines,
            segments: toSegmentsMap(data.alignment),
            version: data.version,
          },
        });
      } else {
        dispatch({
          type: 'SAVE_FAILED',
          payload: {
            error: err instanceof Error ? err.message : 'Save failed',
          },
        });
      }
    }
  }, [dispatch]);

  return { save };
};
