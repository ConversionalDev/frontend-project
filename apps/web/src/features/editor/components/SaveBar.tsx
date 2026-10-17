import { useEditor } from '../context';
import { useSave } from '../hooks';

const STATUS_LABEL: Partial<Record<string, string>> = {
  saving: 'Saving…',
  saved: 'Saved',
  conflict: 'Conflict — server version loaded. Review and save again.',
  error: 'Save failed',
};

export const SaveBar = () => {
  const { state } = useEditor();
  const { save } = useSave();

  const label = STATUS_LABEL[state.saveStatus];
  const isError = state.saveStatus === 'error' || state.saveStatus === 'conflict';

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface shrink-0">
      <span className="text-xs font-mono text-muted">v{state.version}</span>

      {label && (
        <span className={`text-xs ${isError ? 'text-danger' : 'text-muted'}`}>
          {label}
          {state.saveStatus === 'error' && state.saveError
            ? `: ${state.saveError}`
            : ''}
        </span>
      )}

      <button
        onClick={() => void save()}
        disabled={state.saveStatus === 'saving'}
        className="ml-auto py-1 px-3 text-xs border-border hover:border-muted disabled:opacity-40"
        title="Save (⌘S)"
      >
        Save
      </button>
    </div>
  );
};
