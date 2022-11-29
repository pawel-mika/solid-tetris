import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const commitHash = require('child_process')
    .execSync('git rev-parse --short HEAD')
    .toString();

export default defineConfig({
  plugins: [solidPlugin()],
  base: '/solid-tetris/',
  server: {
    port: 5000,
  },
  build: {
    target: 'esnext',
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toUTCString())
  }
});
