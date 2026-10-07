import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // (or whatever plugins you have)

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  }
})