import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  base: '/solid-tetris/',
  server: {
    port: 5000,
  },
  build: {
    target: 'esnext',
  },
});
