import { useState } from 'react';
import type { RefObject } from 'react';
import { useEditor, useTime } from '../context';
import { formatTimecode, formatDisplay } from '../utils';
import { ChevronLeft } from '../../../shared/icons';
import { KeyboardGuide } from './KeyboardGuide';

type Props = {
  audioRef: RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  toggle: () => void;
  seekTo: (ms: number) => void;
  onBack: () => void;
};

export const AudioPlayer = ({
  audioRef,
  isPlaying,
  toggle,
  seekTo,
  onBack,
}: Props) => {
  const { state } = useEditor();
  const { currentTimeMs } = useTime();
  const [seekValue, setSeekValue] = useState<number | null>(null);

  const displayMs = seekValue ?? currentTimeMs;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setSeekValue(ms);
    seekTo(ms);
  };

  const handleSeekStart = () => setSeekValue(currentTimeMs);
  const handleSeekEnd = () => setSeekValue(null);

  return (
    <div className="bg-surface border-b border-border px-5 py-3 flex items-center gap-4 shrink-0">
      <audio
        ref={audioRef}
        src={state.audioSrc}
        preload="auto"
        className="hidden"
      />

      {/* Back button */}
      <button
        onClick={onBack}
        className="shrink-0 text-muted hover:text-text transition-colors p-0 border-none bg-transparent"
        aria-label="Change track"
        title="Change track"
      >
        <ChevronLeft />
      </button>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Track info */}
      <div className="shrink-0 min-w-0 w-36">
        <p className="text-sm font-medium truncate leading-tight">
          {state.title}
        </p>
        <p className="text-xs text-muted truncate leading-tight">
          {state.artist}
        </p>
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Play / pause */}
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full bg-accent text-accent-contrast border-transparent hover:opacity-90 shrink-0 text-sm"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Current time */}
      <span className="text-xs font-mono text-muted shrink-0 w-16">
        {formatTimecode(displayMs)}
      </span>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={state.durationMs}
        step={1}
        value={displayMs}
        onChange={handleSeekChange}
        onMouseDown={handleSeekStart}
        onMouseUp={handleSeekEnd}
        onTouchStart={handleSeekStart}
        onTouchEnd={handleSeekEnd}
        className="flex-1 p-0 border-none bg-transparent h-1 cursor-pointer accent-accent"
        aria-label="Seek"
      />

      {/* Total duration */}
      <span className="text-xs font-mono text-muted shrink-0 w-10 text-right">
        {formatDisplay(state.durationMs)}
      </span>

      <div className="w-px h-6 bg-border shrink-0" />

      <KeyboardGuide />
    </div>
  );
};
