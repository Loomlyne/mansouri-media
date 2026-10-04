import { test, expect } from "@playwright/test";

// Runs against the local Worker and the local bucket (desktop project only).
const FILM = "/media/_probe/test-9x16.mp4";
const POSTER = "/media/_probe/poster.webp";

test.describe("media from R2 through the Worker", () => {
  test.skip(({}, testInfo) => testInfo.project.name !== "desktop", "desktop only");

  test("Range 206 on the first and on the repeat request", async ({ request }) => {
    const head = await request.head(FILM);
    expect(head.status()).toBe(200);
    const size = Number(head.headers()["content-length"]);
    expect(size).toBeGreaterThan(1_000_000);
    for (const attempt of ["first", "repeat"]) {
      const res = await request.get(FILM, { headers: { Range: "bytes=0-1" } });
      expect(res.status(), attempt).toBe(206);
      expect(res.headers()["content-range"], attempt).toBe(`bytes 0-1/${size}`);
      expect(res.headers()["accept-ranges"], attempt).toBe("bytes");
      expect((await res.body()).length, attempt).toBe(2);
    }
  });

  test("unsatisfiable range 416, conditional 304", async ({ request }) => {
    const bad = await request.get(FILM, { headers: { Range: "bytes=999999999-" } });
    expect(bad.status()).toBe(416);
    const head = await request.head(FILM);
    const etag = head.headers()["etag"];
    expect(etag).toBeTruthy();
    const cond = await request.get(FILM, { headers: { "If-None-Match": etag } });
    expect(cond.status()).toBe(304);
  });

  test("poster, env marker, traversal", async ({ request }) => {
    const poster = await request.get(POSTER);
    expect(poster.status()).toBe(200);
    expect(poster.headers()["content-type"]).toBe("image/webp");
    const env = await request.get("/media/_probe/env.txt");
    expect((await env.text()).trim()).toBe("local");
    const trav = await request.get("/media/..%2Fwrangler.jsonc");
    expect(trav.status()).toBe(404);
  });

  test("poster loads into a WebGL texture with crossOrigin=anonymous", async ({ page }) => {
    await page.goto(POSTER);
    const result = await page.evaluate(
      (src) =>
        new Promise<{ ok: boolean; glError: number; message: string }>((resolve) => {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl");
          if (!gl) return resolve({ ok: false, glError: -1, message: "no webgl" });
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
              resolve({ ok: true, glError: gl.getError(), message: "" });
            } catch (e) {
              resolve({ ok: false, glError: gl.getError(), message: String(e) });
            }
          };
          img.onerror = () => resolve({ ok: false, glError: -2, message: "image error" });
          img.src = src;
        }),
      POSTER,
    );
    expect(result.message).not.toContain("SecurityError");
    expect(result).toEqual({ ok: true, glError: 0, message: "" });
  });
});
