import { useState } from 'react';
import { EditorProvider, TimeProvider } from './features/editor/context';
import { LoadScreen, EditorScreen } from './features/editor/screens';
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
