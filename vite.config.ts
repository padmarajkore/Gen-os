import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: Number(env.VITE_DEV_PORT ?? 3000),
        host: '0.0.0.0',
        proxy: {
          '/api/nvidia-proxy': {
            target: 'https://integrate.api.nvidia.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/nvidia-proxy/, '/v1/chat/completions'),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (env.VITE_NVIDIA_API_KEY) {
                  proxyReq.setHeader('Authorization', `Bearer ${env.VITE_NVIDIA_API_KEY}`);
                }
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Accept', 'application/json');
              });
            },
          },
        },
      },
      plugins: [react()],
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
