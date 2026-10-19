import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://127.0.0.1:5000',
      '/api': 'http://127.0.0.1:5000',
      '/flights': 'http://127.0.0.1:5000',
      '/passengers': 'http://127.0.0.1:5000',
      '/bookings': 'http://127.0.0.1:5000'
    }
  }
});
