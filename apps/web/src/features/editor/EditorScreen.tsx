import { useMemo } from 'react';
import { useEditor } from './context';
import { useAudio } from './hooks';
import { AudioPlayer, Inspector, LyricsList } from './components';
import { useKeyboard } from '../../shared/hooks';
import { toMs } from './utils';

export const EditorScreen = () => {
  const { state, dispatch } = useEditor();
  const { audioRef, isPlaying, toggle, seekTo } = useAudio();

  const sorted = useMemo(
    () => [...state.lines].sort((a, b) => a.index - b.index),
    [state.lines],
  );

  const moveFocus = (direction: 1 | -1) => {
    const idx = sorted.findIndex((l) => l.id === state.focusedLineId);
    const next = sorted[idx + direction];
    if (next)
      dispatch({ type: 'LINE_SELECTED', payload: { lineId: next.id, additive: false } });
  };

  useKeyboard({
    Space: (e) => {
      e.preventDefault();
      toggle();
    },
    Enter: () => {
      if (!state.focusedLineId || !audioRef.current) return;
      dispatch({
        type: 'LINE_STAMPED',
        payload: { lineId: state.focusedLineId, startMs: toMs(audioRef.current.currentTime) },
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
  });

  return (
    <div className="flex flex-col h-screen bg-bg">
      <AudioPlayer
        audioRef={audioRef}
        isPlaying={isPlaying}
        toggle={toggle}
        seekTo={seekTo}
      />

      <div className="flex-1 flex overflow-hidden">
        <LyricsList seekTo={seekTo} />
        <Inspector />
      </div>
    </div>
  );
};
