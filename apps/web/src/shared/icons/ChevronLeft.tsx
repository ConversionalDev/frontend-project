type Props = { className?: string };

export const ChevronLeft = ({ className }: Props) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M11 13L7 9l4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
