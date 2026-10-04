import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Signed copy, read from the messages files which hold the sketch T object verbatim.
const T: Record<string, Record<string, string>> = {};
for (const l of ["en", "ar", "fr"]) {
  T[l] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "messages", `${l}.json`), "utf8"),
  ).Holding;
}

// One named constant per signed screenshot (Koss-approved values go here only).
const MAX_DIFF_C_EN_DESKTOP = 0.03;
const MAX_DIFF_C_AR_DESKTOP = 0.03;
const MAX_DIFF_C_FR_PHONE = 0.03;

for (const locale of ["en", "ar", "fr"]) {
  test.describe(`holding /${locale}`, () => {
    test("markup, links, fonts, no Google Fonts", async ({ page }) => {
      const t = T[locale];
      const requests: string[] = [];
      const errors: string[] = [];
      page.on("request", (r) => requests.push(r.url()));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(String(e)));

      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      await expect(page.getByTestId("slogan")).toHaveText(t.slogan);

      const wa = page.locator("a[data-testid=wa]");
      await expect(wa).toHaveAttribute(
        "href",
        "https://wa.me/971505085753?text=" + encodeURIComponent(t.waText),
      );
      await expect(wa).toHaveAttribute("target", "_blank");
      expect(await wa.getAttribute("rel")).toContain("noopener");

      await expect(page.locator("a[data-testid=mail]")).toHaveAttribute(
        "href",
        "mailto:houssemansouri96@gmail.com?subject=" +
          encodeURIComponent(t.subject),
      );
      await expect(page.locator("footer")).toHaveText(t.place);

      const logo = page.locator('img[alt="Mansouri Media"]');
      await expect(logo).toBeVisible();
      expect(
        await logo.evaluate((i) => (i as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);

      const nav = page.locator("nav.lang");
      for (const l of ["en", "ar", "fr"]) {
        await expect(nav.locator(`a[href="/${l}"]`)).toHaveCount(1);
      }
      await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute(
        "href",
        `/${locale}`,
      );

      const fontsOk = await page.evaluate(
        async ({ locale }) => {
          await document.fonts.ready;
          return locale === "ar"
            ? document.fonts.check('16px "IBM Plex Sans Arabic"', "مرحبا")
            : document.fonts.check('16px "Host Grotesk"');
        },
        { locale },
      );
      expect(fontsOk).toBe(true);

      await page.waitForLoadState("networkidle");
      expect(
        requests.filter(
          (u) => u.includes("fonts.googleapis.com") || u.includes("fonts.gstatic.com"),
        ),
      ).toEqual([]);
      expect(requests.some((u) => /\/fonts\/.*\.woff2/.test(u))).toBe(true);
      expect(errors).toEqual([]);
    });

    test("ring stops under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}`);
      const name = await page
        .locator(".ring")
        .evaluate((e) => getComputedStyle(e).animationName);
      expect(name).toBe("none");
    });
  });
}

// Visual match against Koss's signed screenshots (desktop project only).
// Never run with --update-snapshots: the baselines in e2e/__signed__ are signed.
test.describe("signed visual match", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "signed shots are desktop-project only");
  });

  test("C-en-desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("C-en-desktop.png", {
      animations: "disabled",
      maxDiffPixelRatio: MAX_DIFF_C_EN_DESKTOP,
    });
  });

  test("C-ar-desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ar");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("C-ar-desktop.png", {
      animations: "disabled",
      maxDiffPixelRatio: MAX_DIFF_C_AR_DESKTOP,
    });
  });

  test.describe("phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("C-fr-phone", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/fr");
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot("C-fr-phone.png", {
        animations: "disabled",
        maxDiffPixelRatio: MAX_DIFF_C_FR_PHONE,
      });
    });
  });
});
