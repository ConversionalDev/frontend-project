import { memo } from 'react';
import { formatTimecode } from '../utils';
import type { Line, Segment } from '../types';

type Props = {
  line: Line;
  segment: Segment | undefined;
  isFocused: boolean;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (lineId: string, e: React.MouseEvent) => void;
  onDoubleClick: (lineId: string) => void;
};

export const LyricLine = memo(({
  line,
  segment,
  isFocused,
  isSelected,
  isActive,
  onSelect,
  onDoubleClick,
}: Props) => {
  const bg = isActive
    ? 'bg-accent/10'
    : isSelected
      ? 'bg-surface'
      : 'hover:bg-surface';

  const leftBorder = isSelected && !isActive
    ? 'border-l-2 border-accent'
    : 'border-l-2 border-transparent';

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={(e) => onSelect(line.id, e)}
      onDoubleClick={() => onDoubleClick(line.id)}
      className={`flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer select-none transition-colors ${bg} ${leftBorder} ${isFocused ? 'ring-1 ring-accent ring-inset' : ''}`}
    >
      <span className="text-xs font-mono text-muted w-6 shrink-0 text-right">
        {line.index + 1}
      </span>

      <span className={`flex-1 text-sm truncate ${
        isActive ? 'text-accent font-medium' : !segment ? 'text-muted' : ''
      }`}>
        {line.text}
      </span>

      {segment ? (
        <span className="text-xs font-mono text-accent shrink-0">
          {formatTimecode(segment.start_ms)}
        </span>
      ) : (
        <span className="text-xs text-muted shrink-0 opacity-30">–</span>
      )}
    </div>
  );
});
