import { toMs } from './time';
import type {
  ApiTrack,
  EditorState,
  Segment,
  StoredCustomTrack,
  TrackLoadedPayload,
} from '../types';

export const CUSTOM_LS_KEY = (trackId: string) =>
  `lyric-align-custom-${trackId}`;

export const trackIdFor = (file: File) => `custom-${file.name}-${file.size}`;

export const restoreCustomTrack = (
  trackId: string,
): StoredCustomTrack | null => {
  try {
    const raw = localStorage.getItem(CUSTOM_LS_KEY(trackId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredCustomTrack;
  } catch {
    return null;
  }
};

export const toSegmentsMap = (
  alignment: { segments: Segment[] } | null | undefined,
): Record<string, Segment> =>
  Object.fromEntries((alignment?.segments ?? []).map((s) => [s.line_id, s]));

export const apiTrackToPayload = (data: ApiTrack): TrackLoadedPayload => ({
  trackId: data.id,
  title: data.title,
  artist: data.artist,
  durationMs: toMs(data.duration_seconds),
  audioSrc: data.audio_url,
  lines: data.lines,
  segments: toSegmentsMap(data.alignment),
  version: data.version,
  isCustomTrack: false,
});

export const payloadToInitialState = (
  payload: TrackLoadedPayload,
): EditorState => {
  const firstLine = [...payload.lines].sort((a, b) => a.index - b.index)[0];
  const hasExistingSegments = Object.keys(payload.segments).length > 0;
  return {
    ...payload,
    saveStatus: hasExistingSegments ? 'saved' : 'idle',
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
