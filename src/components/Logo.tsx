interface Props {
  /** Height of the mark in px; the wordmark scales with the surrounding font. */
  size?: number;
}

/**
 * Original FitPlan mark: an open progress ring with a pulse notch, paired with
 * a letterspaced wordmark.
 */
export function Logo({ size = 28 }: Props) {
  return (
    <span className="logo">
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.28" />
        <path
          d="M16 3a13 13 0 0 1 11.9 7.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9 17.5h3.4l2.2-4.6 2.6 8 2.1-3.4H23"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo-word">FitPlan</span>
    </span>
  );
}
