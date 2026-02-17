import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const iconDir = path.join(root, 'src-tauri', 'icons');

// Generate multiple icon sizes for Tauri
const iconSizes = [
  { name: 'favicon-16x16.ico', size: 16 },
  { name: 'favicon-32x32.ico', size: 32 },
  { name: 'favicon-48x48.ico', size: 48 },
  { name: 'favicon-64x64.ico', size: 64 },
  { name: 'favicon-180x180.ico', size: 180 },
  { name: 'favicon-192x192.ico', size: 192 },
  { name: 'favicon-512x512.ico', size: 512 },
  { name: 'icon.ico', size: 64 }, // Main app icon
];

async function generateIcon(size, filename) {
  const width = Math.min(size, 256); // ICO format limitation
  const height = Math.min(size, 256);

  // BITMAPINFOHEADER (40 bytes)
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4); // biWidth
  bih.writeInt32LE(height * 2, 8); // biHeight (XOR + AND)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(0, 20); // biSizeImage
  bih.writeInt32LE(0, 24); // biXPelsPerMeter
  bih.writeInt32LE(0, 28); // biYPelsPerMeter
  bih.writeUInt32LE(0, 32); // biClrUsed
  bih.writeUInt32LE(0, 36); // biClrImportant

  // XOR bitmap: BGRA pixels - create blue background with white "CV" text
  // Blue color in BGRA: FF 82 3B (blue) + FF (alpha)
  const xor = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    xor[i * 4 + 0] = 0xFF; // B
    xor[i * 4 + 1] = 0x82; // G
    xor[i * 4 + 2] = 0x3B; // R
    xor[i * 4 + 3] = 0xFF; // A
  }

  // AND mask: at 1bpp, padded to 32 bits per row
  const andMask = Buffer.alloc(Math.ceil(width / 8) * 4 * height, 0x00);

  const dib = Buffer.concat([bih, xor, andMask]);

  // ICONDIR
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count

  // ICONDIRENTRY
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width === 256 ? 0 : width, 0); // width
  entry.writeUInt8(height === 256 ? 0 : height, 1); // height
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bit count
  entry.writeUInt32LE(dib.length, 8); // bytes in resource
  entry.writeUInt32LE(6 + 16, 12); // image offset

  const ico = Buffer.concat([header, entry, dib]);
  const iconPath = path.join(iconDir, filename);
  await fs.writeFile(iconPath, ico);
  
  return path.relative(root, iconPath);
}

async function main() {
  await fs.mkdir(iconDir, { recursive: true });

  console.log('Generating Tauri app icons...');
  
  for (const { name, size } of iconSizes) {
    const relativePath = await generateIcon(size, name);
    console.log(`✓ Generated ${relativePath} (${size}x${size})`);
  }
  
  console.log(`\n✅ All icons generated successfully!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
