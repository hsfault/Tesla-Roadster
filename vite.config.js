import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // three / R3F stay in the lazily imported Scene chunk (no manual chunk: it would pull shared React
        // deps such as `scheduler` into it and force a preload from the entry).
        manualChunks: {
          gsap: ['gsap', '@gsap/react', 'lenis'],
        },
      },
    },
  },
});
