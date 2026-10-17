import { useMemo } from 'react';
import { useEditor } from '../context';
import { SingleLinePanel } from './SingleLinePanel';
import { MultiLinePanel } from './MultiLinePanel';

const InspectorShell = ({ children }: { children: React.ReactNode }) => (
  <aside className="w-64 shrink-0 border-l border-border bg-surface overflow-y-auto p-4 flex flex-col gap-4">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
      Inspector
    </h2>
    {children}
  </aside>
);

export const Inspector = () => {
  const { state, dispatch } = useEditor();

  const selectedIds = useMemo(
    () => [...state.selectedLineIds],
    [state.selectedLineIds],
  );

  const count = selectedIds.length;
  const lineId = count === 1 ? selectedIds[0] : null;

  const line = useMemo(
    () => (lineId ? state.lines.find((l) => l.id === lineId) : undefined),
    [lineId, state.lines],
  );

  const segment = lineId ? state.segments[lineId] : undefined;

  return (
    <InspectorShell>
      {count === 0 && (
        <p className="text-xs text-muted text-center py-4">No line selected</p>
      )}

      {count === 1 && !segment && (
        <p className="text-xs text-muted leading-relaxed">
          No timing yet.
          <br />
          Press <kbd>Enter</kbd> while playing to stamp.
        </p>
      )}

      {count === 1 && segment && lineId && (
        <SingleLinePanel
          lineId={lineId}
          line={line}
          segment={segment}
          durationMs={state.durationMs}
          dispatch={dispatch}
        />
      )}

      {count > 1 && (
        <MultiLinePanel
          count={count}
          selectedIds={selectedIds}
          dispatch={dispatch}
        />
      )}
    </InspectorShell>
  );
};
