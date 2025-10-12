/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import {
  existsSync, mkdirSync, copyFileSync,
} from 'fs';

const particleWasmPlugin = {
  name: 'particle-wasm',
  // @ts-ignore
  apply: (_, env) => env.mode === 'development',
  buildStart: () => {
    const copiedPath = path.join(
      __dirname,
      'node_modules/@particle-network/thresh-sig/wasm/thresh_sig_wasm_bg.wasm'
    );
    const dir = path.join(__dirname, 'node_modules/.vite/wasm');
    const resultPath = path.join(dir, 'thresh_sig_wasm_bg.wasm');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    copyFileSync(copiedPath, resultPath);
  },
};

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    react(),
    particleWasmPlugin,
    nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
  ],
})
