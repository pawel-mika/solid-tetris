import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const { version } = require('./package.json');

const commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

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
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toUTCString()),
  },
});
