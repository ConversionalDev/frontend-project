const BARS = [
  4, 7, 5, 9, 6, 8, 4, 10, 7, 5, 8, 6, 9, 4, 7, 5, 6, 8, 4, 9, 6, 7, 5, 8,
];

export const WaveformDecor = () => (
  <div
    className="flex items-end gap-0.5 h-8 w-full"
    aria-hidden
  >
    {BARS.map((h, i) => (
      <div
        key={i}
        className="flex-1 bg-accent rounded-sm opacity-50"
        style={{ height: `${h * 10}%` }}
      />
    ))}
  </div>
);
