import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for plain logic only (zod schemas, the API client's error parsing, unit
 * conversions), so this runs in Node without jsdom/React Testing Library. Add those, per
 * node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md, if component tests are
 * ever needed.
 */
export default defineConfig({
  resolve: {
    // Mirrors tsconfig.json's "@/*": ["./src/*"].
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // src/lib/config.ts throws at import time without this, and api-client imports it.
    env: { NEXT_PUBLIC_API_BASE_URL: "http://api.test" },
  },
});
