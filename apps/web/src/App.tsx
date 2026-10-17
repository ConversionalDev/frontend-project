import { useState, useEffect } from 'react';
import { api } from './api';
import { EditorProvider, TimeProvider } from './features/editor/context';
import { LoadScreen, EditorScreen } from './features/editor/screens';
import {
  apiTrackToPayload,
  payloadToInitialState,
  saveSession,
  clearSession,
  readSession,
} from './features/editor/utils';
import type { ApiTrack, EditorState } from './features/editor/types';

const App = () => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [restoring, setRestoring] = useState(
    () => readSession()?.type === 'seeded',
  );

  useEffect(() => {
    if (readSession()?.type !== 'seeded') return;
    const restore = async () => {
      try {
        const data = await api<ApiTrack>('/api/v1/track');
        setEditorState(payloadToInitialState(apiTrackToPayload(data)));
      } catch {
        clearSession();
      } finally {
        setRestoring(false);
      }
    };
    void restore();
  }, []);

  const handleLoad = (state: EditorState) => {
    saveSession(state);
    setEditorState(state);
  };

  const handleBack = () => {
    clearSession();
    setEditorState(null);
  };

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
        Restoring session…
      </div>
    );
  }

  if (!editorState) {
    return <LoadScreen onLoad={handleLoad} />;
  }

  return (
    <EditorProvider initialState={editorState}>
      <TimeProvider>
        <EditorScreen onBack={handleBack} />
      </TimeProvider>
    </EditorProvider>
  );
};

export default App;
