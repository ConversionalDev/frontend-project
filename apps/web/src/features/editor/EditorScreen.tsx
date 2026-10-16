import { useEditor } from './context';

// Stub — filled out in the next phase
export const EditorScreen = () => {
  const { state } = useEditor();
  return (
    <div className="p-8">
      <h1>{state.title}</h1>
      <p className="text-muted">{state.lines.length} lines</p>
    </div>
  );
};
