import { useState } from 'react';
import { EditorProvider, TimeProvider } from './features/editor/context';
import { LoadScreen } from './features/editor/LoadScreen';
import { EditorScreen } from './features/editor/EditorScreen';
import type { EditorState } from './features/editor/types';

const App = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  if (!editorState) {
    return <LoadScreen onLoad={setEditorState} />;
  }

  return (
    <EditorProvider initialState={editorState}>
      <TimeProvider>
        <EditorScreen />
      </TimeProvider>
    </EditorProvider>
  );
};

export default App;
