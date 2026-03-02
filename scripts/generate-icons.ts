/**
 * Generate PWA icons from a programmatic SVG.
 * Run: npx ts-node scripts/generate-icons.ts
 * (or include as a build step)
 *
 * We inline the SVG so there are no external dependencies.
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate an SVG icon matching the 2K brand (indigo gradient, "2K" text)
function makeSVG(size: number): string {
  const half = size / 2;
  const fontSize = Math.round(size * 0.38);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)"/>
  <text x="${half}" y="${half}" dominant-baseline="central" text-anchor="middle"
        font-family="Arial,Helvetica,sans-serif" font-weight="bold"
        font-size="${fontSize}" fill="white">2K</text>
</svg>`;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const s of SIZES) {
  const svgContent = makeSVG(s);
  const svgPath = path.join(outDir, `icon-${s}x${s}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`  ✓ Generated ${svgPath}`);
}

console.log('\nSVG icons created. For PNG conversion, use a tool like sharp or an online converter.');
console.log('For development, you can also reference the SVG files directly in manifest.json.');
