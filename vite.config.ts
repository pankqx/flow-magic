import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set to /flow-magic/ by the GitHub Pages workflow.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
} as never);
