import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const iconDir = path.join(root, 'src-tauri', 'icons');
const iconPath = path.join(iconDir, 'icon.ico');

async function main() {
  await fs.mkdir(iconDir, { recursive: true });

  // Build a minimal valid ICO containing a 1x1 32bpp BMP/DIB (no PNG).
  // ICO file = ICONDIR (6) + ICONDIRENTRY (16) + DIB data
  //
  // DIB for ICO: BITMAPINFOHEADER (40) + XOR bitmap + AND mask
  // Height in BITMAPINFOHEADER is (imageHeight * 2) to include mask.
  const width = 1;
  const height = 1;

  // BITMAPINFOHEADER (40 bytes)
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4); // biWidth
  bih.writeInt32LE(height * 2, 8); // biHeight (XOR + AND)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(0, 20); // biSizeImage (can be 0 for BI_RGB)
  bih.writeInt32LE(0, 24); // biXPelsPerMeter
  bih.writeInt32LE(0, 28); // biYPelsPerMeter
  bih.writeUInt32LE(0, 32); // biClrUsed
  bih.writeUInt32LE(0, 36); // biClrImportant

  // XOR bitmap: BGRA for 1 pixel (blue, green, red, alpha). Use transparent.
  const xor = Buffer.from([0x00, 0x00, 0x00, 0x00]);

  // AND mask: 1bpp mask rows are padded to 32 bits (4 bytes).
  // 0 bit => opaque, 1 bit => transparent. Keep opaque (all zeros).
  const andMask = Buffer.alloc(4, 0x00);

  const dib = Buffer.concat([bih, xor, andMask]);

  // ICONDIR
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count

  // ICONDIRENTRY
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width, 0); // width (0 means 256; we use 1)
  entry.writeUInt8(height, 1); // height
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bit count
  entry.writeUInt32LE(dib.length, 8); // bytes in resource
  entry.writeUInt32LE(6 + 16, 12); // image offset

  const ico = Buffer.concat([header, entry, dib]);
  await fs.writeFile(iconPath, ico);

  console.log(`Generated ${path.relative(root, iconPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
