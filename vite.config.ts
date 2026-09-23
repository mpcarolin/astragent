import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
