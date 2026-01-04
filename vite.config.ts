import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Critical: Tell Vite NOT to try and pre-bundle these missing dependencies
    exclude: [
      'react',
      'react-dom', 
      '@supabase/supabase-js',
      'recharts',
      'lucide-react',
      'react-router-dom'
    ]
  },
  build: {
    rollupOptions: {
      // Critical: Tell Rollup these are external (CDN loaded)
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        '@supabase/supabase-js',
        'recharts',
        'lucide-react',
        'react-router-dom'
      ],
      output: {
        format: 'es',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
