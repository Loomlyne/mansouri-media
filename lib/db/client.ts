import { drizzle } from "drizzle-orm/d1";
import { schema } from "@/db/schema";

export function getDb(env: Pick<CloudflareEnv, "DB">) {
  return drizzle(env.DB, { schema });
}
