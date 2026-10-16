import { toMs } from './time';
import type { ApiTrack, EditorState, TrackLoadedPayload } from '../types';

export const apiTrackToPayload = (data: ApiTrack): TrackLoadedPayload => ({
  trackId: data.id,
  title: data.title,
  artist: data.artist,
  durationMs: toMs(data.duration_seconds),
  audioSrc: data.audio_url,
  lines: data.lines,
  segments: Object.fromEntries(
    (data.alignment?.segments ?? []).map((s) => [s.line_id, s]),
  ),
  version: data.version,
  isCustomTrack: false,
});

export const payloadToInitialState = (
  payload: TrackLoadedPayload,
): EditorState => {
  const firstLine = [...payload.lines].sort((a, b) => a.index - b.index)[0];
  return {
    ...payload,
    saveStatus: 'idle',
    saveError: null,
    selectedLineIds: new Set(firstLine ? [firstLine.id] : []),
    focusedLineId: firstLine?.id ?? null,
  };
};

export const getAudioDuration = (objectUrl: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(Math.round(audio.duration * 1000));
    audio.onerror = () => reject(new Error('Could not read audio file'));
    audio.src = objectUrl;
  });
