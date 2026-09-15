import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Paths to the mkcert-generated certificates (placed at /certs/)
const certDir = path.resolve(import.meta.dirname, "certs");
const certFile = path.join(certDir, "localhost.pem");
const keyFile = path.join(certDir, "localhost-key.pem");

// Only enable HTTPS if both cert files exist
const certsExist = fs.existsSync(certFile) && fs.existsSync(keyFile);

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // HTTPS: use pre-generated mkcert certificates when available
    https: certsExist
      ? {
          cert: fs.readFileSync(certFile),
          key: fs.readFileSync(keyFile),
        }
      : false,
  },
});