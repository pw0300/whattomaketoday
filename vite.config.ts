/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    appType: 'spa', // Fallback to index.html for SPA routing
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    // Define globals for browser compatibility.
    // Standard Vite config handles process.env.NODE_ENV automatically.
    // We rely on standard Vite behavior which does NOT expose non-VITE_ env vars.
    define: {
      'global': 'window',
    },

    plugins: [
      react(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/generate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const { prompt, contents, schema, modelName } = JSON.parse(data);

            // Prioritize GEMINI_API_KEY (non-public), fall back to VITE_ prefixed
            const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
              console.error('[API Proxy] Missing API Key in environment');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Missing API Key' }));
              return;
            }

            try {
              console.log(`[API Proxy] Generating content with model: ${modelName || 'gemini-2.0-flash'}`);
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({
                model: modelName || "gemini-2.0-flash",
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: schema
                }
              });

              const input = contents ? { contents } : prompt;
              const result = await model.generateContent(input);
              const response = await result.response;
              let text = response.text();
              text = text.replace(/```json/g, '').replace(/```/g, '').trim();

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(text);
              console.log('[API Proxy] Success - content generated');
            } catch (e: any) {
              console.error("[API Proxy] Error:", e.message || e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message || 'Unknown error' }));
            }
          });

          server.middlewares.use('/api/embed', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const { text, modelName } = JSON.parse(data);

            const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Missing API Key' }));
              return;
            }

            try {
              console.log(`[API Proxy] Generating embedding for: ${text.slice(0, 30)}...`);
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: modelName || "text-embedding-004" });
              const result = await model.embedContent(text);
              const embedding = result.embedding.values;

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(embedding));
            } catch (e: any) {
              console.error("[API Proxy] Embedding Error:", e.message || e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message || 'Unknown error' }));
            }
          });
        }
      }
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      exclude: ['**/node_modules/**', '**/e2e/**'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Polyfill Node modules for browser
        '@pinecone-database/pinecone': path.resolve(__dirname, './utils/mockPinecone.ts'),
        'path': 'path-browserify',
        'os': 'os-browserify',
        'crypto': 'crypto-browserify',
        'stream': 'stream-browserify',
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-ai': ['@google/generative-ai', 'framer-motion'],
            'vendor-db': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          }
        }
      }
    }
  };
});
