interface GolfBallProps {
  className?: string;
  size?: number;
}

export function GolfBall({ className, size = 24 }: GolfBallProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main ball circle */}
      <circle cx="12" cy="12" r="10" fill="currentColor" />

      {/* Dimples - arranged in a pattern */}
      <circle cx="8" cy="8" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="12" cy="6" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="16" cy="8" r="1.5" fill="#002418" opacity="0.3" />

      <circle cx="6" cy="12" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="10" cy="11" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="14" cy="11" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="18" cy="12" r="1.5" fill="#002418" opacity="0.3" />

      <circle cx="8" cy="15" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="12" cy="15" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="16" cy="15" r="1.5" fill="#002418" opacity="0.3" />

      <circle cx="10" cy="18" r="1.5" fill="#002418" opacity="0.3" />
      <circle cx="14" cy="18" r="1.5" fill="#002418" opacity="0.3" />

      {/* Highlight for 3D effect */}
      <ellipse cx="9" cy="7" rx="3" ry="2" fill="white" opacity="0.3" />
    </svg>
  );
}
