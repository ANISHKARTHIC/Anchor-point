import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default  ({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react(), svgr()],
    server: {
      watch: {
        usePolling: true,
      },
      host: true,
      strictPort: true,
      port: 5173,
    },
    preview: {
      port: 3000,
    },
    define: {
      'process.env.BASE_SERVER_URL': JSON.stringify(env.BASE_SERVER_URL),
      'process.env.SERVER_PORT': env.SERVER_PORT,
      'process.env.GOOGLE_MAP_API_KEY': JSON.stringify(env.GOOGLE_MAP_API_KEY),
    },
  })
};
