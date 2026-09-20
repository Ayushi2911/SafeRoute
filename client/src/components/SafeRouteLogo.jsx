export default function SafeRouteLogo({ size = 32, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label="SafeRoute Logo"
    >
      <defs>
        <linearGradient id="logoShieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-teal)" />
          <stop offset="50%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
        <linearGradient id="logoShieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-background)" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="logoRouteLine" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-teal)" />
          <stop offset="100%" stopColor="var(--color-teal)" />
        </linearGradient>
        <filter id="logoAccentGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Shield Base */}
      <path
        d="M24 3.5 C13.5 3.5 7 8.5 7 18 C7 30.5 15.5 39.5 24 44.5 C32.5 39.5 41 30.5 41 18 C41 8.5 34.5 3.5 24 3.5 Z"
        fill="url(#logoShieldBg)"
        stroke="url(#logoShieldBorder)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Subtle Inner Ring */}
      <path
        d="M24 7 C16 7 11 11 11 19 C11 28.5 18 36 24 40 C30 36 37 28.5 37 19 C37 11 32 7 24 7 Z"
        stroke="var(--color-accent-soft)"
        strokeOpacity="0.22"
        strokeWidth="1"
        fill="none"
      />

      {/* Dynamic Curved Route Line */}
      <path
        d="M17 34 C16 28, 30 29, 21 21 C17 17.5, 21 14, 24 13.5"
        stroke="url(#logoRouteLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoAccentGlow)"
      />

      {/* Origin Waypoint */}
      <circle cx="17" cy="34" r="2.5" fill="var(--color-teal)" stroke="var(--color-background)" strokeWidth="1.2" />

      {/* Mid-route Waypoint */}
      <circle cx="21" cy="21" r="2" fill="var(--color-accent)" stroke="var(--color-background)" strokeWidth="1.2" />

      {/* Destination Beacon / Location Pin */}
      <g filter="url(#logoAccentGlow)">
        <path
          d="M24 10 C21.79 10 20 11.79 20 14 C20 17 24 21.5 24 21.5 C24 21.5 28 17 28 14 C28 11.79 26.21 10 24 10 Z"
          fill="var(--color-teal)"
        />
        <circle cx="24" cy="14" r="1.5" fill="var(--color-background)" />
      </g>
    </svg>
  )
}
