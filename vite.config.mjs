import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {
  handleAdminActivity,
  handleAdminAuth,
  handleAdminSignup
} from "./lib/adminRuntime.ts";

const adminApiPlugin = {
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const path = request.url?.split("?")[0];
      if (path === "/api/admin/auth") {
        void handleAdminAuth(request, response);
      } else if (path === "/api/admin/activity") {
        void handleAdminActivity(request, response);
      } else if (path === "/api/admin/signup") {
        void handleAdminSignup(request, response);
      } else {
        next();
      }
    });
  },
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const path = request.url?.split("?")[0];
      if (path === "/api/admin/auth") {
        void handleAdminAuth(request, response);
      } else if (path === "/api/admin/activity") {
        void handleAdminActivity(request, response);
      } else if (path === "/api/admin/signup") {
        void handleAdminSignup(request, response);
      } else {
        next();
      }
    });
  },
  name: "admin-api"
};

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/components/Shared/UI/")) {
            return "shared-ui";
          }
        }
      }
    }
  },
  plugins: [adminApiPlugin, tsconfigPaths(), react(), tailwindcss()],
  preview: { allowedHosts: true }
});
