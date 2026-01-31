import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Read the SVG icon
const svgPath = join(publicDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Icon sizes to generate
const iconSizes = [16, 32, 192, 512];

async function generateIcons() {
  console.log('Generating PNG icons from icon.svg...');
  
  for (const size of iconSizes) {
    const outputPath = join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Generated icon-${size}.png`);
  }
}

async function generateOgImage() {
  console.log('Generating OG image...');
  
  // Create a 1200x630 OG image with gradient background and centered icon
  const width = 1200;
  const height = 630;
  const iconSize = 200;
  
  // Resize the icon for the OG image
  const iconBuffer = await sharp(svgBuffer)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();
  
  // Create the background with gradient
  const background = Buffer.from(`
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <text x="${width/2}" y="${height - 120}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="72" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle">EyeCheck</text>
      <text x="${width/2}" y="${height - 60}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="32" 
            fill="rgba(255,255,255,0.9)" 
            text-anchor="middle">Eye Health Assessment</text>
    </svg>
  `);
  
  const outputPath = join(publicDir, 'og-image.png');
  
  await sharp(background)
    .composite([{
      input: iconBuffer,
      top: Math.floor((height - iconSize) / 2) - 60,
      left: Math.floor((width - iconSize) / 2)
    }])
    .png()
    .toFile(outputPath);
  
  console.log('  ✓ Generated og-image.png (1200x630)');
}

async function main() {
  try {
    await generateIcons();
    await generateOgImage();
    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
