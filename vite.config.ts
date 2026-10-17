import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative Asset-Pfade: funktioniert auf der Custom-Domain (draft.namophoenix.com)
  // genauso wie unter <user>.github.io/RoleBravery/.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
