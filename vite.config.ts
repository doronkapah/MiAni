import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages מגיש את האתר תחת /<repo>/, ולכן צריך base.
// מקומית ובשרת המקומי ה-base הוא "/" ושום דבר לא משתנה.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  root: "web",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5174",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist-web",
    emptyOutDir: true,
  },
});
