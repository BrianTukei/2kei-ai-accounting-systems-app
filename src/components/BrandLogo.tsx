import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** Overall size — sm (28px), md (40px), lg (56px) */
  size?: 'sm' | 'md' | 'lg';
  /** Extra Tailwind classes on the outer wrapper */
  className?: string;
}

const dims = {
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
} as const;

/**
 * 2K AI Accounting Systems brand icon.
 *
 * A stylised monogram with a gradient background, layered
 * geometric shapes (ledger book + AI sparkle), and the "2K" letters.
 */
export default function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg',
        dims[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label="2K AI Accounting Systems"
        role="img"
      >
        {/* ── Background gradient ── */}
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.25" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sparkle" x1="44" y1="8" x2="58" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="64" height="64" rx="14" fill="url(#bg)" />

        {/* Light sheen overlay */}
        <rect width="64" height="64" rx="14" fill="url(#shine)" />

        {/* ── Decorative ledger lines (subtle) ── */}
        <line x1="12" y1="46" x2="36" y2="46" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="50" x2="30" y2="50" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="54" x2="24" y2="54" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── AI sparkle / star (top-right) ── */}
        <path
          d="M50 12 L52 18 L58 20 L52 22 L50 28 L48 22 L42 20 L48 18 Z"
          fill="url(#sparkle)"
        />
        {/* Small secondary dot */}
        <circle cx="56" cy="12" r="1.5" fill="#fbbf24" opacity="0.7" />

        {/* ── "2K" text ── */}
        <text
          x="24"
          y="38"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="26"
          fill="white"
          letterSpacing="-1"
        >
          2K
        </text>
      </svg>
    </div>
  );
}
