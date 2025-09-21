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
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            sidepanel: path.resolve(__dirname, 'sidepanel/index.html'),
          },
          output: {
            manualChunks: {
              'three': ['three'],
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ai-vendor': ['@google/genai'],
            },
          },
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
      },
      publicDir: 'public',
    };
});
