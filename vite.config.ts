import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Build the sidepanel app as a static bundle for the extension
    root: 'sidepanel',
    build: {
      outDir: path.resolve(__dirname, 'dist', 'sidepanel'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'sidepanel', 'index.html'),
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router')) return 'vendor_react_router';
              if (id.includes('react-dom')) return 'vendor_react_dom';
              if (id.includes(path.sep + 'react' + path.sep) || id.includes('/react/')) return 'vendor_react';
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
