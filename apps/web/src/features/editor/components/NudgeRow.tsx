import { NUDGE_AMOUNTS, nudgeLabel } from '../utils';

type Props = { onNudge: (deltaMs: number) => void };

export const NudgeRow = ({ onNudge }: Props) => (
  <div className="flex gap-1">
    {NUDGE_AMOUNTS.map((ms) => (
      <button
        key={ms}
        onClick={() => onNudge(ms)}
        className="flex-1 py-1 px-0 text-xs font-mono border-border hover:border-muted"
      >
        {nudgeLabel(ms)}
      </button>
    ))}
  </div>
);
