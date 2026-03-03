const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Path-based "2K" characters — no font dependency for reliable rendering
function makeSvg(size) {
  const s = size / 64; // scale factor
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="sparkle" x1="${44*s}" y1="${8*s}" x2="${58*s}" y2="${28*s}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${14*s}" fill="url(#bg)"/>
  <line x1="${12*s}" y1="${46*s}" x2="${36*s}" y2="${46*s}" stroke="white" stroke-opacity="0.15" stroke-width="${1.5*s}" stroke-linecap="round"/>
  <line x1="${12*s}" y1="${50*s}" x2="${30*s}" y2="${50*s}" stroke="white" stroke-opacity="0.1" stroke-width="${1.5*s}" stroke-linecap="round"/>
  <path d="M${50*s} ${12*s} L${52*s} ${18*s} L${58*s} ${20*s} L${52*s} ${22*s} L${50*s} ${28*s} L${48*s} ${22*s} L${42*s} ${20*s} L${48*s} ${18*s} Z" fill="url(#sparkle)"/>
  <circle cx="${56*s}" cy="${12*s}" r="${1.5*s}" fill="#fbbf24" opacity="0.7"/>
  <g fill="white" transform="scale(${s})">
    <path d="M8 24 Q8 18 14 18 L22 18 Q28 18 28 24 L28 26 L23 26 L23 24 Q23 22 22 22 L14 22 Q13 22 13 24 L13 26 L28 38 L28 42 L8 42 L8 38 L22 38 L8 26 Z"/>
    <path d="M32 18 L37 18 L37 27 L47 18 L53 18 L43 27 L54 42 L48 42 L40 30 L37 33 L37 42 L32 42 Z"/>
  </g>
</svg>`;
}

async function main() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const publicDir = path.join(__dirname, '..', 'public');

  // Write favicon SVG (64x64)
  fs.writeFileSync(path.join(publicDir, '2k-school-favicon.svg'), makeSvg(64));
  console.log('Written: 2k-school-favicon.svg');

  // Write all SVG icon sizes
  const svgSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of svgSizes) {
    const file = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(file, makeSvg(size));
    console.log(`Written: icon-${size}x${size}.svg`);
  }

  // Generate PNG icons from SVG
  const pngSizes = [192, 512];
  for (const size of pngSizes) {
    const svgBuffer = Buffer.from(makeSvg(size));
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Written: icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180)
  const svg180 = makeSvg(180);
  await sharp(Buffer.from(svg180)).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Written: apple-touch-icon.png');

  console.log('\nAll icons generated successfully!');
}

main().catch(console.error);
