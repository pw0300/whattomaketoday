/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
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

            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const { prompt, contents, schema, modelName } = JSON.parse(data);

            // Access environment using loadEnv logic above or process.env directly if cached
            // Prioritize GEMINI_API_KEY (non-public)
            const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Missing API Key' }));
              return;
            }

            try {
              // Dynamic import to avoid build-time issues if not needed
              const { GoogleGenerativeAI } = await import('@google/generative-ai');
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
            } catch (e) {
              console.error("API Proxy Error:", e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
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
      }
    }
  };
});
