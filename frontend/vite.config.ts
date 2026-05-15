
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Read backend URL from environment variable, fallback to localhost
const backendUrl = process.env.VITE_API_URL || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': backendUrl,
      '/tasks': backendUrl,
      '/users': backendUrl,
      '/socket.io': {
        target: backendUrl,
        ws: true,
      },
    },
  },
});
