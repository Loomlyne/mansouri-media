import { describe, expect, it } from "vitest";
import { evaluateGuard, EXPECTED_ACCOUNT_ID, EXPECTED_HOME } from "../scripts/cf-guard.mjs";

const OK_CFG = `{ "account_id": "${EXPECTED_ACCOUNT_ID}" }`;
const OTHER = "e64b47de0000000000000000000000aa";
const me = { id: EXPECTED_ACCOUNT_ID, name: "Houssam Portfolio" };
const other = { id: OTHER, name: "Vamos" };
const base = { configTexts: [OK_CFG], home: EXPECTED_HOME, inCI: false, ciAccountId: undefined as string | undefined };
const who = (accounts: unknown[], loggedIn = true) => ({ loggedIn, authType: "OAuth Token", accounts });

describe("evaluateGuard", () => {
  it("passes for the pinned account with the Mansouri HOME", () => {
    const r = evaluateGuard({ ...base, whoami: who([me]) });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(`cf-guard OK: Houssam Portfolio (${EXPECTED_ACCOUNT_ID}) via OAuth Token`);
  });
  it("fails with no account_id", () => {
    const r = evaluateGuard({ ...base, configTexts: ["{}"], whoami: who([me]) });
    expect(r.ok).toBe(false);
    expect(r.message).toContain(`account_id is not ${EXPECTED_ACCOUNT_ID}`);
  });
  it("fails with another pinned id", () => {
    expect(evaluateGuard({ ...base, configTexts: [`{ "account_id": "${OTHER}" }`], whoami: who([me]) }).ok).toBe(false);
  });
  it("fails when the preview-migrations config pins another id", () => {
    expect(evaluateGuard({ ...base, configTexts: [OK_CFG, `{ "account_id": "${OTHER}" }`], whoami: who([me]) }).ok).toBe(false);
  });
  it("fails when HOME is not the Mansouri HOME", () => {
    const r = evaluateGuard({ ...base, home: "/Users/koss", whoami: who([me]) });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("HOME must be /Users/koss/.mansouri-cloudflare");
  });
  it("fails when not logged in", () => {
    expect(evaluateGuard({ ...base, whoami: who([], false) }).ok).toBe(false);
  });
  it("fails locally when other accounts are visible", () => {
    const r = evaluateGuard({ ...base, whoami: who([me, other]) });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("local login sees other accounts");
  });
  it("passes in CI with other accounts, with the Workers Builds suffix", () => {
    const r = evaluateGuard({ ...base, home: "/root", inCI: true, whoami: who([me, other]) });
    expect(r.ok).toBe(true);
    expect(r.message.endsWith(" [Workers Builds]")).toBe(true);
  });
  it("passes in CI with no accounts when CLOUDFLARE_ACCOUNT_ID matches", () => {
    const r = evaluateGuard({ ...base, inCI: true, ciAccountId: EXPECTED_ACCOUNT_ID, whoami: who([]) });
    expect(r.ok).toBe(true);
    expect(r.message).toContain("(account from CLOUDFLARE_ACCOUNT_ID)");
  });
  it("fails in CI with no accounts when CLOUDFLARE_ACCOUNT_ID is another id", () => {
    expect(evaluateGuard({ ...base, inCI: true, ciAccountId: OTHER, whoami: who([]) }).ok).toBe(false);
  });
  it("fails in CI when whoami lists only another account", () => {
    expect(evaluateGuard({ ...base, inCI: true, whoami: who([other]) }).ok).toBe(false);
  });
  it("whoami null in CI with matching CLOUDFLARE_ACCOUNT_ID passes and still prints name and id", () => {
    const r = evaluateGuard({ ...base, inCI: true, ciAccountId: EXPECTED_ACCOUNT_ID, whoami: null });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(
      `cf-guard OK: Houssam Portfolio (${EXPECTED_ACCOUNT_ID}) [account from CLOUDFLARE_ACCOUNT_ID; whoami unavailable] [Workers Builds]`,
    );
  });
  it("whoami null in CI without CLOUDFLARE_ACCOUNT_ID fails", () => {
    const r = evaluateGuard({ ...base, inCI: true, whoami: null });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("whoami unavailable and CLOUDFLARE_ACCOUNT_ID not set");
  });
  it("whoami null in CI with another CLOUDFLARE_ACCOUNT_ID fails", () => {
    expect(evaluateGuard({ ...base, inCI: true, ciAccountId: OTHER, whoami: null }).ok).toBe(false);
  });
  it("whoami null on the Mac fails with no fallback", () => {
    const r = evaluateGuard({ ...base, ciAccountId: EXPECTED_ACCOUNT_ID, whoami: null });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("whoami failed");
  });
});
