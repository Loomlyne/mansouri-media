import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const EXPECTED = "1c850e50f5cbd5777f020315ccc72718";

function load(file: string): any {
  const r = ts.parseConfigFileTextToJson(file, readFileSync(file, "utf8"));
  if (r.error) throw new Error(`cannot parse ${file}`);
  return r.config;
}

const main = load("wrangler.jsonc");
const mig = load("wrangler.preview-migrations.jsonc");
const test = load("wrangler.test.jsonc");

describe("wrangler.jsonc isolation (D-10)", () => {
  it("is the mansourimedia Worker on Houssem's account", () => {
    expect(main.name).toBe("mansourimedia");
    expect(main.account_id).toBe(EXPECTED);
    expect(mig.account_id).toBe(EXPECTED);
  });
  it("keeps workers.dev and preview URLs on", () => {
    expect(main.workers_dev).toBe(true);
    expect(main.preview_urls).toBe(true);
  });
  it("has no env block and no service bindings", () => {
    expect(main.env).toBeUndefined();
    expect(main.services).toBeUndefined();
    expect(main.previews.services).toBeUndefined();
  });
  it("previews use a different D1 database and R2 bucket", () => {
    expect(main.previews.d1_databases[0].database_id).not.toBe(main.d1_databases[0].database_id);
    expect(main.previews.d1_databases[0].database_name).not.toBe(main.d1_databases[0].database_name);
    expect(main.previews.r2_buckets[0].bucket_name).not.toBe(main.r2_buckets[0].bucket_name);
  });
  it("preview-migrations targets the previews database", () => {
    expect(mig.d1_databases).toHaveLength(1);
    expect(mig.d1_databases[0].database_id).toBe(main.previews.d1_databases[0].database_id);
    expect(mig.d1_databases[0].database_id).not.toBe(main.d1_databases[0].database_id);
  });
  it("every top-level binding exists in previews", () => {
    const top = [...main.d1_databases.map((d: any) => d.binding), ...main.r2_buckets.map((r: any) => r.binding)];
    const prev = [
      ...main.previews.d1_databases.map((d: any) => d.binding),
      ...main.previews.r2_buckets.map((r: any) => r.binding),
    ];
    expect(top.sort()).toEqual(["DB", "MEDIA"]);
    for (const b of top) expect(prev).toContain(b);
  });
  it("every top-level var exists in previews.vars", () => {
    for (const k of Object.keys(main.vars)) expect(main.previews.vars).toHaveProperty(k);
  });
  it("wrangler.test.jsonc mirrors binding names and migrations_dir, with no account", () => {
    expect(test.account_id).toBeUndefined();
    expect(test.d1_databases[0].binding).toBe("DB");
    expect(test.r2_buckets[0].binding).toBe("MEDIA");
    expect(test.d1_databases[0].migrations_dir).toBe(main.d1_databases[0].migrations_dir);
  });
});
