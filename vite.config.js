import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/MovieHub/",
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-toastify"],
  },
});
