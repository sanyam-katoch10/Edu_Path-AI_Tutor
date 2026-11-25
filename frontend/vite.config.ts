import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-bundle';
          }
          if (id.includes('node_modules/katex') || id.includes('node_modules/rehype-katex') || id.includes('node_modules/remark-math')) {
            return 'katex-bundle';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'lucide-react',
      'motion/react',
      'katex',
      'react-markdown',
      'remark-math',
      'rehype-katex',
      'clsx',
      'tailwind-merge',
    ],
  },
})
