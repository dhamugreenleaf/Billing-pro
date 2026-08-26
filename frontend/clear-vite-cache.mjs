import fs from 'fs';
import path from 'path';

const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');

if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('Cleared Vite cache');
} else {
  console.log('No Vite cache found');
}
