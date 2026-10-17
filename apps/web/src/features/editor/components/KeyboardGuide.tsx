import { useState } from 'react';

const SHORTCUTS = [
  { keys: ['Space'], description: 'Play / Pause' },
  { keys: ['Enter'], description: 'Stamp focused line at current time' },
  { keys: ['↑', '↓'], description: 'Move focus up / down' },
  { keys: ['Shift', 'Click'], description: 'Select a range of lines' },
  { keys: ['⌘S', 'Ctrl+S'], description: 'Save' },
  { keys: ['Double-click'], description: 'Seek to line start time' },
] as const;

const Key = ({ label }: { label: string }) => (
  <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-bg border border-border text-text leading-none">
    {label}
  </kbd>
);

export const KeyboardGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-border text-xs text-muted hover:text-text transition-colors"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-text text-lg leading-none border-none bg-transparent p-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <ul className="flex flex-col gap-3">
              {SHORTCUTS.map(({ keys, description }) => (
                <li
                  key={description}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-muted">{description}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {keys.map((k) => (
                      <Key
                        key={k}
                        label={k}
                      />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
