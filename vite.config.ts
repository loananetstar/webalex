import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      fs: {
        // Allow serving files from the external data directory
        allow: [
          'C:/Users/ASUS/Downloads/genai/data',
          '.'
        ]
      }
    },
    plugins: [
      react(),
      {
        name: 'serve-external-data',
        configureServer(server) {
          server.middlewares.use('/data', (req, res, next) => {
            // Custom middleware to serve files from local Windows path
            // This effectively maps http://localhost:3000/data/... to C:/Users/ASUS/Downloads/genai/data/...
            const fs = require('fs');
            const path = require('path');
            const url = req.url; // e.g., /notes/session_xxx/flashcards.json
            if (!url) return next();

            const filePath = path.join('C:/Users/ASUS/Downloads/genai/data', url);

            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              if (stat.isFile()) {
                res.setHeader('Content-Type', 'application/json'); // Default to JSON, browsers handle others
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
