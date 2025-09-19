import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Increase the warning limit and split large vendor chunks to keep individual files smaller.
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor_react';
                if (id.includes('react-dom')) return 'vendor_reactdom';
                if (id.includes('three')) return 'vendor_three';
                if (id.includes('@google/genai')) return 'vendor_genai';
                if (id.includes('react-router-dom')) return 'vendor_react_router_dom';
                return 'vendor_misc';
              }
            }
          }
        }
      }
    };
});
