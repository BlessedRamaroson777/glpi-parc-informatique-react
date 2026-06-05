import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api.php": {
        target: "http://glpi.local:8080",
        changeOrigin: true,
      },
    },
  },
});