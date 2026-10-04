import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// One row per admin system check (written by the ping API, read back by /admin).
export const checks = sqliteTable("checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  at: integer("at").notNull(), // Unix ms
  email: text("email").notNull(),
  result: text("result").notNull(), // "ok"
});

export const schema = { checks };
