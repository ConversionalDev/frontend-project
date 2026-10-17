import { useRef, useState } from 'react';
import { ErrorMessage } from '../../../shared/components';
import {
  parseLyrics,
  getAudioDuration,
  restoreCustomTrack,
  trackIdFor,
  CUSTOM_LS_KEY,
} from '../utils';
import type { StoredCustomTrack, TrackLoadedPayload } from '../types';

type Props = {
  onLoad: (payload: TrackLoadedPayload) => void;
};

export const CustomTrackForm = ({ onLoad }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedSession, setSavedSession] = useState<StoredCustomTrack | null>(
    null,
  );
  const [lyricsText, setLyricsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith('audio/')) {
      setError('Only audio files are supported (mp3, wav, ogg, flac…)');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setSavedSession(file ? restoreCustomTrack(trackIdFor(file)) : null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Select an audio file');
      return;
    }
    if (!savedSession && !lyricsText.trim()) {
      setError('Paste your lyrics');
      return;
    }

    setLoading(true);
    setError(null);

    const trackId = trackIdFor(selectedFile);
    let audioSrc: string | null = null;
    try {
      audioSrc = URL.createObjectURL(selectedFile);
      const durationMs = await getAudioDuration(audioSrc);
      const lines = savedSession?.lines ?? parseLyrics(lyricsText);
      const segments = Object.fromEntries(
        (savedSession?.alignment?.segments ?? []).map((s) => [s.line_id, s]),
      );

      if (!savedSession) {
        localStorage.setItem(
          CUSTOM_LS_KEY(trackId),
          JSON.stringify({ version: 0, lines, alignment: { segments: [] } }),
        );
      }

      onLoad({
        trackId,
        title: selectedFile.name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown',
        durationMs,
        audioSrc,
        lines,
        segments,
        version: savedSession?.version ?? 0,
        isCustomTrack: true,
      });
    } catch (err) {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
      setError(err instanceof Error ? err.message : 'Failed to load track');
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Audio file</label>
        <input
          ref={fileRef}
          id="audio-file"
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="audio-file"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-bg cursor-pointer hover:border-muted transition-colors text-sm"
        >
          <span className="text-base">♪</span>
          <span className={selectedFile ? 'text-text' : 'text-muted'}>
            {selectedFile ? selectedFile.name : 'Choose audio file…'}
          </span>
        </label>
      </div>

      {savedSession ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted bg-bg border border-border rounded-md px-3 py-2.5">
            Previous session found — {savedSession.lines.length} lines,{' '}
            {(savedSession.alignment?.segments ?? []).length} timed. Lyrics will
            be restored automatically.
          </p>
          <button
            type="button"
            onClick={() => setSavedSession(null)}
            className="self-start text-xs text-muted underline underline-offset-2 hover:text-text transition-colors"
          >
            Paste different lyrics instead
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Lyrics</label>
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            rows={9}
            placeholder={'Paste lyrics here\nOne line per row'}
            className="font-mono text-sm resize-none rounded-md border border-border bg-bg p-3 placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-md bg-accent text-accent-contrast font-medium text-sm border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Loading…' : savedSession ? 'Restore session' : 'Load track'}
      </button>
    </form>
  );
};
