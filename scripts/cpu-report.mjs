#!/usr/bin/env node
// Usage: node scripts/cpu-report.mjs <tail.jsonl>
// p50/p99/max cpuTime and wallTime per route from `wrangler tail --format json`.
// Exit 1 if any p99 cpuTime >= 10 ms or an exceeded-CPU outcome appears; exit 3 if events carry no cpuTime.
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: cpu-report.mjs <jsonl>");
  process.exit(2);
}
// wrangler tail --format json prints pretty-printed objects back to back (closing brace alone in column 0),
// so split on that lone brace and put it back.
const events = readFileSync(file, "utf8")
  .split(/^\}\s*$/m)
  .map((chunk) => chunk.trim())
  .filter(Boolean)
  .flatMap((chunk) => {
    try {
      return [JSON.parse(chunk + "\n}")];
    } catch {
      return [];
    }
  });

const group = (p) => {
  if (p === "/") return "/";
  if (p === "/en" || p === "/ar" || p === "/fr") return p;
  if (p.startsWith("/media/")) return "/media/*";
  if (p.startsWith("/api/admin")) return "/api/admin*";
  if (p.startsWith("/admin")) return "/admin*";
  return "other";
};
const pct = (a, q) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
};
const rows = new Map();
let withCpu = 0;
for (const e of events) {
  const url = e.event?.request?.url;
  if (!url) continue;
  const g = group(new URL(url).pathname);
  const r = rows.get(g) ?? { n: 0, cpu: [], wall: [], bad: [], status: {} };
  r.n++;
  if (typeof e.cpuTime === "number") {
    r.cpu.push(e.cpuTime);
    withCpu++;
  }
  if (typeof e.wallTime === "number") r.wall.push(e.wallTime);
  const st = e.event?.response?.status;
  r.status[st] = (r.status[st] ?? 0) + 1;
  if (e.outcome && e.outcome !== "ok") r.bad.push(e.outcome);
  rows.set(g, r);
}
if (rows.size === 0) {
  console.log("NO EVENTS");
  process.exit(1);
}
if (withCpu === 0) {
  console.log("NO cpuTime FIELD in tail events: read CPU p50/p99 from Workers & Pages -> mansourimedia -> Metrics.");
  process.exit(3);
}
let fail = false;
console.log("route        n    cpu p50/p99/max (ms)   wall p50/p99/max (ms)   status");
for (const [g, r] of [...rows].sort()) {
  const f = (a) => (a.length ? `${pct(a, 0.5)}/${pct(a, 0.99)}/${Math.max(...a)}` : "n/a");
  const p99 = r.cpu.length ? pct(r.cpu, 0.99) : 0;
  if (p99 >= 10) fail = true;
  if (r.bad.some((o) => /exceeded/i.test(o))) fail = true;
  console.log(
    `${g.padEnd(12)} ${String(r.n).padEnd(4)} ${f(r.cpu).padEnd(22)} ${f(r.wall).padEnd(23)} ${JSON.stringify(r.status)}${r.bad.length ? " non-ok=" + JSON.stringify(r.bad) : ""}${p99 >= 10 ? " FAIL(p99>=10)" : ""}`,
  );
}
process.exit(fail ? 1 : 0);
