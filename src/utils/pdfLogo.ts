/**
 * 2K AI Accounting Systems logo as a base64 PNG data URL for use in jsPDF.
 *
 * We embed the SVG in a tiny canvas at build-time-compatible resolution
 * so jsPDF can add it to every generated PDF without any async fetching.
 */

// The SVG markup (matches BrandLogo.tsx)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="sparkle" x1="44" y1="8" x2="58" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <line x1="12" y1="46" x2="36" y2="46" stroke="white" stroke-opacity="0.15" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="50" x2="30" y2="50" stroke="white" stroke-opacity="0.1" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="54" x2="24" y2="54" stroke="white" stroke-opacity="0.08" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M50 12 L52 18 L58 20 L52 22 L50 28 L48 22 L42 20 L48 18 Z" fill="url(#sparkle)"/>
  <circle cx="56" cy="12" r="1.5" fill="#fbbf24" opacity="0.7"/>
  <text x="24" y="38" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="26" fill="white" letter-spacing="-1">2K</text>
</svg>`;

let _cachedDataUrl: string | null = null;

/**
 * Returns a base64 PNG data URL of the 2K logo (128×128).
 * Uses an off-screen canvas; result is cached after the first call.
 */
export function getLogo128(): Promise<string> {
  if (_cachedDataUrl) return Promise.resolve(_cachedDataUrl);

  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 128, 128);
      _cachedDataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(_cachedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(''); // graceful fallback — no logo
    };

    img.src = url;
  });
}
