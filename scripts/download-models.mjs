import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS = [
  {
    name: 'Universal Sentence Encoder',
    url: 'https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/latest/universal_sentence_encoder.tflite',
    dest: 'public/models/universal_sentence_encoder.tflite',
  },
];

const projectRoot = path.resolve(__dirname, '..');

async function downloadFile(url, destPath) {
  const fullPath = path.join(projectRoot, destPath);
  const dir = path.dirname(fullPath);

  // Create directory if not exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  // Skip if already exists
  if (fs.existsSync(fullPath)) {
    console.log(`Already exists: ${destPath}`);
    return;
  }

  console.log(`Downloading: ${url}`);
  console.log(`To: ${destPath}`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fullPath);

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          const total = parseInt(res.headers['content-length'], 10);
          let downloaded = 0;

          res.on('data', (chunk) => {
            downloaded += chunk.length;
            const percent = ((downloaded / total) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${percent}%`);
          });

          res.pipe(file);
          file.on('finish', () => {
            console.log('\nDownload complete!');
            file.close(resolve);
          });
        }).on('error', reject);
      } else {
        const total = parseInt(response.headers['content-length'], 10);
        let downloaded = 0;

        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = ((downloaded / total) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}%`);
        });

        response.pipe(file);
        file.on('finish', () => {
          console.log('\nDownload complete!');
          file.close(resolve);
        });
      }
    }).on('error', (err) => {
      fs.unlink(fullPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('=== MediaPipe Model Downloader ===\n');

  for (const model of MODELS) {
    console.log(`\n📦 ${model.name}`);
    try {
      await downloadFile(model.url, model.dest);
    } catch (error) {
      console.error(`Failed to download ${model.name}:`, error.message);
    }
  }

  console.log('\n✅ Done!');
}

main();
