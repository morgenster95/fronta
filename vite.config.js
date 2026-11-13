import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  build: { outDir: '../dist', emptyOutDir: true, assetsInlineLimit: 0 },
  // REEL=1 (natáčení reelu): žádné HMR ani sledování výstupů natáčení, stránka se během nahrávání nesmí znovu načíst
  server: {
    fs: { allow: ['..'] },
    host: true,
    ...(process.env.REEL ? { hmr: false, watch: { ignored: ['**/marketing/**', '**/data/**', '**/dist/**'] } } : {}),
  },
});
