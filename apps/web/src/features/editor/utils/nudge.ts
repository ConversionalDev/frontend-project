export const NUDGE_AMOUNTS = [-1000, -500, -100, 100, 500, 1000] as const;

export const nudgeLabel = (ms: number): string => {
  const sign = ms > 0 ? '+' : '−';
  const abs = Math.abs(ms);
  return abs >= 1000 ? `${sign}${abs / 1000}s` : `${sign}${abs}`;
};
