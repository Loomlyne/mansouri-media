// Account guard: every wrangler command and every Workers Builds deploy must target Houssem's account only.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const EXPECTED_ACCOUNT_ID = "1c850e50f5cbd5777f020315ccc72718";
export const EXPECTED_ACCOUNT_NAME = "Houssam Portfolio";
export const EXPECTED_HOME = "/Users/koss/.mansouri-cloudflare";

const fail = (message) => ({ ok: false, message: `cf-guard FAILED: ${message}` });

export function evaluateGuard({ configTexts, home, inCI, ciAccountId, whoami }) {
  for (const text of configTexts) {
    const ids = [...text.matchAll(/"account_id"\s*:\s*"([0-9a-f]{32})"/g)].map((m) => m[1]);
    if (ids.length === 0 || ids.some((id) => id !== EXPECTED_ACCOUNT_ID)) {
      return fail(`account_id is not ${EXPECTED_ACCOUNT_ID} in every wrangler config`);
    }
  }
  if (!inCI && home !== EXPECTED_HOME) {
    return fail(`HOME must be ${EXPECTED_HOME}`);
  }
  const ci = inCI ? " [Workers Builds]" : "";
  const label = `${EXPECTED_ACCOUNT_NAME} (${EXPECTED_ACCOUNT_ID})`;

  if (whoami === null || whoami === undefined) {
    if (!inCI) return fail("whoami failed");
    if (!ciAccountId) return fail("whoami unavailable and CLOUDFLARE_ACCOUNT_ID not set");
    if (ciAccountId !== EXPECTED_ACCOUNT_ID) return fail(`CLOUDFLARE_ACCOUNT_ID is not ${EXPECTED_ACCOUNT_ID}`);
    return { ok: true, message: `cf-guard OK: ${label} [account from CLOUDFLARE_ACCOUNT_ID; whoami unavailable]${ci}` };
  }
  const accounts = whoami.accounts ?? [];
  if (!whoami.loggedIn && !(inCI && accounts.length === 0)) {
    return fail("whoami says not logged in");
  }
  if (accounts.length === 0) {
    if (!inCI) return fail("whoami lists no accounts");
    if (!ciAccountId) return fail("whoami lists no accounts and CLOUDFLARE_ACCOUNT_ID not set");
    if (ciAccountId !== EXPECTED_ACCOUNT_ID) return fail(`CLOUDFLARE_ACCOUNT_ID is not ${EXPECTED_ACCOUNT_ID}`);
    return { ok: true, message: `cf-guard OK: ${label} (account from CLOUDFLARE_ACCOUNT_ID)${ci}` };
  }
  if (!accounts.some((a) => a.id === EXPECTED_ACCOUNT_ID)) {
    return fail(`whoami does not list ${EXPECTED_ACCOUNT_ID}`);
  }
  if (!inCI && accounts.some((a) => a.id !== EXPECTED_ACCOUNT_ID)) {
    return fail("local login sees other accounts");
  }
  const via = whoami.authType ? ` via ${whoami.authType}` : "";
  return { ok: true, message: `cf-guard OK: ${label}${via}${ci}` };
}

function readWhoami() {
  try {
    const out = execFileSync("./node_modules/.bin/wrangler", ["whoami", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const i = out.indexOf("{");
    if (i < 0) return null;
    return JSON.parse(out.slice(i));
  } catch {
    return null;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));
  const configTexts = [readFileSync("wrangler.jsonc", "utf8")];
  if (existsSync("wrangler.preview-migrations.jsonc")) {
    configTexts.push(readFileSync("wrangler.preview-migrations.jsonc", "utf8"));
  }
  const result = evaluateGuard({
    configTexts,
    home: process.env.HOME,
    inCI: process.env.WORKERS_CI === "1",
    ciAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    whoami: readWhoami(),
  });
  console.log(result.message);
  if (!result.ok) process.exit(1);
}
