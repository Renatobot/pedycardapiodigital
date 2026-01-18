import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";
import { componentTagger } from "lovable-tagger";

const require = createRequire(import.meta.url);
const reactPath = require.resolve("react");
const reactDomPath = require.resolve("react-dom");
const reactJsxRuntimePath = require.resolve("react/jsx-runtime");
const reactJsxDevRuntimePath = require.resolve("react/jsx-dev-runtime");
const reactDomClientPath = require.resolve("react-dom/client");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: reactPath,
      "react-dom": reactDomPath,
      "react/jsx-runtime": reactJsxRuntimePath,
      "react/jsx-dev-runtime": reactJsxDevRuntimePath,
      "react-dom/client": reactDomClientPath,
    },
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@radix-ui/react-tooltip",
    ],
    force: true,
  },
}));
