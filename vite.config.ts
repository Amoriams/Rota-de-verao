import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Plugin de defesa ativa contra bugs de MIME types no Windows Registry
function fixWindowsMimeTypesPlugin(): Plugin {
  return {
    name: 'fix-windows-mime-types',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];

        if (pathname.endsWith('.js') || pathname.endsWith('.mjs') || pathname.endsWith('.ts') || pathname.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        } else if (pathname.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];

        if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        } else if (pathname.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fixWindowsMimeTypesPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Permite acesso via localhost e IP da rede local
    strictPort: false,
    open: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
