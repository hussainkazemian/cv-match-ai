import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

// optional, used by Tauri for external device testing (set TAURI_DEV_HOST)
const host: string | undefined = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
	// Ensure Vite uses the project root that contains index.html.
	root: projectRoot,

	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(projectRoot, './src'),
		},
	},
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host ?? false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
	build: {
		outDir: path.resolve(projectRoot, 'dist'),
		target: 'esnext',
		minify: 'esbuild',
	},
	optimizeDeps: {
		include: ['pdfjs-dist'],
	},
});
