import { useMemo, useEffect, useRef } from 'react';
import { useEditor } from '../context';
import { useAudio, useSave } from '../hooks';
import {
  AudioPlayer,
  Inspector,
  KaraokeBar,
  LyricsList,
  SaveBar,
} from '../components';
import { useKeyboard } from '../../../shared/hooks';
import { toMs } from '../utils';

type Props = { onBack: () => void };

export const EditorScreen = ({ onBack }: Props) => {
  const { state, dispatch } = useEditor();
  const { audioRef, isPlaying, toggle, seekTo } = useAudio();
  const { save } = useSave();

  const hasUnsaved = useMemo(
    () =>
      Object.keys(state.segments).length > 0 && state.saveStatus !== 'saved',
    [state.segments, state.saveStatus],
  );
  const hasUnsavedRef = useRef(hasUnsaved);
  hasUnsavedRef.current = hasUnsaved;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const handleBack = () => {
    if (
      hasUnsaved &&
      !window.confirm('You have unsaved changes. Leave anyway?')
    )
      return;
    onBack();
  };

  const sorted = useMemo(
    () => [...state.lines].sort((a, b) => a.index - b.index),
    [state.lines],
  );

  const moveFocus = (direction: 1 | -1) => {
    const idx = sorted.findIndex((l) => l.id === state.focusedLineId);
    const next = sorted[idx + direction];
    if (next)
      dispatch({
        type: 'LINE_SELECTED',
        payload: { lineId: next.id, additive: false },
      });
  };

  useKeyboard(
    {
      Space: (e) => {
        e.preventDefault();
        toggle();
      },
      Enter: () => {
        if (!state.focusedLineId || !audioRef.current) return;
        if (audioRef.current.readyState < 1) return;
        dispatch({
          type: 'LINE_STAMPED',
          payload: {
            lineId: state.focusedLineId,
            startMs: toMs(audioRef.current.currentTime),
          },
        });
      },
      ArrowDown: (e) => {
        e.preventDefault();
        moveFocus(1);
      },
      ArrowUp: (e) => {
        e.preventDefault();
        moveFocus(-1);
      },
      KeyS: (e) => {
        if (!e.metaKey && !e.ctrlKey) return;
        e.preventDefault();
        void save();
      },
    },
    { ignoreElements: ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'] },
  );

  return (
    <div className="flex flex-col h-screen bg-bg">
      <AudioPlayer
        audioRef={audioRef}
        isPlaying={isPlaying}
        toggle={toggle}
        seekTo={seekTo}
        onBack={handleBack}
      />
      <SaveBar />

      <div className="flex-1 flex overflow-hidden">
        <LyricsList seekTo={seekTo} />
        <Inspector />
      </div>

      <KaraokeBar />
    </div>
  );
};
