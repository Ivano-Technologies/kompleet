export default function AuthPanelArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 960 1200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Geometric ledger stack"
      overflow="hidden"
    >
      <rect width="960" height="1200" fill="#0A2F4E" />
      <rect width="960" height="1200" fill="url(#authWash)" />
      <defs>
        <linearGradient id="authWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A2F4E" />
          <stop offset="1" stopColor="#0F4C75" />
        </linearGradient>
      </defs>

      <rect x="80" y="140" width="800" height="1.5" fill="#1B6CA8" opacity="0.35" />
      <rect x="80" y="1060" width="800" height="1.5" fill="#1B6CA8" opacity="0.35" />

      <rect
        x="286"
        y="220"
        width="420"
        height="540"
        rx="16"
        fill="#0A2F4E"
        stroke="#1B6CA8"
        strokeWidth="1.75"
      />
      <rect
        x="246"
        y="260"
        width="420"
        height="540"
        rx="16"
        fill="#0F1E2E"
        stroke="#1B6CA8"
        strokeWidth="1.75"
      />
      <rect
        x="206"
        y="300"
        width="420"
        height="540"
        rx="16"
        fill="#F4F1EB"
        stroke="#DDD5C8"
        strokeWidth="1.75"
      />
      <rect x="238" y="340" width="148" height="12" rx="6" fill="#0F4C75" />
      <rect x="238" y="380" width="356" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="408" width="300" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="436" width="328" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="476" width="356" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="504" width="268" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="532" width="312" height="8" rx="4" fill="#EBE6DC" />
      <rect x="238" y="572" width="120" height="8" rx="4" fill="#0F4C75" opacity="0.45" />
      <rect x="370" y="568" width="88" height="16" rx="8" fill="#0F4C75" />

      <circle cx="720" cy="380" r="54" fill="#0A2F4E" />
      <path
        d="M702 358h36M702 402h36M714 352v56M728 352v56M710 370l28 20"
        stroke="#F4F1EB"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <circle cx="596" cy="788" r="22" fill="#C8F000" />
      <path
        d="M586 788.5l7 7 14-16"
        stroke="#38464B"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
