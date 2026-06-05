import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
        "/api.php": {
            target: "http://glpi.local:8080",
            changeOrigin: true,
            configure: (proxy) => {
                proxy.on('proxyRes', (proxyRes) => {
                    // s'assurer que Content-Range passe au client
                    proxyRes.headers['access-control-expose-headers'] = 'Content-Range'
                })
            }
        },
        "/apirest.php": {
            target: "http://glpi.local:8080",
            changeOrigin: true,
        }
    }
  }
});