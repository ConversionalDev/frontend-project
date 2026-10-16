import { useEditor } from './context';
import { useAudio } from './hooks';
import { AudioPlayer } from './components';
import { useKeyboard } from '../../shared/hooks';

export const EditorScreen = () => {
  const { state } = useEditor();
  const { audioRef, isPlaying, toggle, seekTo } = useAudio();

  useKeyboard({
    Space: (e) => {
      e.preventDefault();
      toggle();
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

      {/* Body — Phase 3 fills this in */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          {state.lines.length} lines · lyrics list coming in phase 3
        </div>
      </div>
    </div>
  );
};
