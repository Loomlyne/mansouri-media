import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  // The pool package is ESM only; load it dynamically so this config also works when loaded as CommonJS.
  const { cloudflareTest, readD1Migrations } = await import("@cloudflare/vitest-pool-workers");
  const migrations = await readD1Migrations(path.join(__dirname, "migrations"));
  return {
    test: {
      projects: [
        {
          test: {
            name: "node",
            environment: "node",
            include: ["tests/*.test.ts"],
          },
        },
        {
          resolve: { alias: { "@": __dirname } },
          plugins: [
            cloudflareTest({
              wrangler: { configPath: "./wrangler.test.jsonc" },
              miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
            }),
          ],
          test: {
            name: "workers",
            include: ["tests/workers/*.test.ts"],
            setupFiles: ["./tests/workers/apply-migrations.ts"],
          },
        },
      ],
    },
  };
});
