import { test, expect } from "@playwright/test";

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "root smoke runs on desktop only");
});

const cases: Array<[string, string | undefined, string]> = [
  ["arabic", "ar-AE,ar;q=0.9", "/ar"],
  ["french over english", "fr-FR,fr;q=0.9,en;q=0.5", "/fr"],
  ["unsupported language", "de-DE", "/en"],
  ["no header", undefined, "/en"],
  ["q=0 excluded", "en;q=0.1, ar;q=0", "/en"],
];

for (const [name, header, expected] of cases) {
  test(`/ redirects ${name} to ${expected}`, async ({ request }) => {
    const res = await request.get("/", {
      maxRedirects: 0,
      headers: header === undefined ? { "Accept-Language": "" } : { "Accept-Language": header },
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toBe(expected);
    expect(res.headers()["cache-control"]).toBe("no-store");
    expect(res.headers()["vary"]).toContain("Accept-Language");
  });
}

test("unknown path under a locale is 404 with security headers", async ({ request }) => {
  const res = await request.get("/en/does-not-exist");
  expect(res.status()).toBe(404);
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("Arabic 404 renders lang=ar dir=rtl", async ({ page }) => {
  await page.goto("/ar/does-not-exist");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("French 404 renders lang=fr dir=ltr", async ({ page }) => {
  await page.goto("/fr/x");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("unsupported locale is 404, not 500", async ({ request }) => {
  const res = await request.get("/de/x");
  expect(res.status()).toBe(404);
});
