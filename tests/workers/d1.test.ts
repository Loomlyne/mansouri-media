import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { checks } from "@/db/schema";
import { getDb } from "@/lib/db/client";

describe("D1 with drizzle", () => {
  it("has the checks table after migrations", async () => {
    const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{ name: string }>();
    expect(results.map((r) => r.name)).toContain("checks");
  });

  it("inserts and reads a row back", async () => {
    const db = getDb(env);
    const [row] = await db.insert(checks).values({ at: 1000, email: "a@x.com", result: "ok" }).returning({ id: checks.id });
    expect(row.id).toBeGreaterThan(0);
    const [got] = await db.select().from(checks).where(eq(checks.id, row.id));
    expect(got).toMatchObject({ at: 1000, email: "a@x.com", result: "ok" });
  });

  it("returns the last five rows, newest first", async () => {
    const db = getDb(env);
    await db.delete(checks);
    for (let at = 1; at <= 7; at++) await db.insert(checks).values({ at, email: "a@x.com", result: "ok" });
    const last = await db.select().from(checks).orderBy(desc(checks.id)).limit(5);
    expect(last.map((r) => r.at)).toEqual([7, 6, 5, 4, 3]);
  });
});
