import { useRef, useState } from 'react';
import { ErrorMessage } from '../../../shared/components';
import { parseLyrics, getAudioDuration } from '../utils';
import type { TrackLoadedPayload } from '../types';

type Props = {
  onLoad: (payload: TrackLoadedPayload) => void;
};

export const CustomTrackForm = ({ onLoad }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Select an audio file');
      return;
    }
    if (!lyricsText.trim()) {
      setError('Paste your lyrics');
      return;
    }

    setLoading(true);
    setError(null);

    let audioSrc: string | null = null;
    try {
      audioSrc = URL.createObjectURL(selectedFile);
      const durationMs = await getAudioDuration(audioSrc);
      const lines = parseLyrics(lyricsText);
      onLoad({
        trackId: `custom-${Date.now()}`,
        title: selectedFile.name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown',
        durationMs,
        audioSrc,
        lines,
        segments: {},
        version: 0,
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

      {error && <ErrorMessage message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-md bg-accent text-accent-contrast font-medium text-sm border-transparent hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Loading…' : 'Load track'}
      </button>
    </form>
  );
};
