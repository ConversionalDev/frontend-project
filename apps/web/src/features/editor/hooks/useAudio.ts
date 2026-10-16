import { useRef, useState, useEffect } from 'react';
import { useTime } from '../context';
import { toMs, toSeconds } from '../utils';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { setCurrentTimeMs } = useTime();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTimeMs(toMs(audio.currentTime));
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [setCurrentTimeMs]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? void audio.play() : audio.pause();
  };

  const seekTo = (ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = toSeconds(ms);
  };

  return { audioRef, isPlaying, toggle, seekTo };
};
