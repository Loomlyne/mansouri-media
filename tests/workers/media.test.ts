import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { serveMedia } from "@/lib/media/serve";

const SIZE = 1_000_000;
const KEY = "_probe/t.bin";
let etag = "";

function bytes(): Uint8Array {
  const b = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i++) b[i] = i % 251;
  return b;
}

const get = (key: string, headers: Record<string, string> = {}, method = "GET") =>
  serveMedia(new Request(`https://x.test/media/${key}`, { method, headers }), env.MEDIA, key);

beforeAll(async () => {
  const put = await env.MEDIA.put(KEY, bytes(), { httpMetadata: { contentType: "application/octet-stream" } });
  etag = put.httpEtag;
});

describe("serveMedia", () => {
  it("200 full object with the standard headers", async () => {
    const res = await get(KEY);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("etag")).toBe(etag);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect((await res.arrayBuffer()).byteLength).toBe(SIZE);
  });

  it("206 bytes=0-1 with exact bytes", async () => {
    const res = await get(KEY, { Range: "bytes=0-1" });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(`bytes 0-1/${SIZE}`);
    expect(res.headers.get("content-length")).toBe("2");
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([0, 1]);
  });

  it("206 open-ended range", async () => {
    const res = await get(KEY, { Range: "bytes=999990-" });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 999990-999999/1000000");
    expect((await res.arrayBuffer()).byteLength).toBe(10);
  });

  it("206 suffix range", async () => {
    const res = await get(KEY, { Range: "bytes=-500" });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 999500-999999/1000000");
    expect((await res.arrayBuffer()).byteLength).toBe(500);
  });

  it("416 unsatisfiable range", async () => {
    const res = await get(KEY, { Range: "bytes=2000000-" });
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe("bytes */1000000");
  });

  it("304 on matching If-None-Match", async () => {
    const res = await get(KEY, { "If-None-Match": etag });
    expect(res.status).toBe(304);
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });

  it("If-Range ignores Range and returns the full 200", async () => {
    const res = await get(KEY, { Range: "bytes=0-1", "If-Range": etag });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    await res.arrayBuffer();
  });

  it("HEAD has length and no body", async () => {
    const res = await get(KEY, {}, "HEAD");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });

  it("405 on POST", async () => {
    const res = await get(KEY, {}, "POST");
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });

  it.each(["../x", "%2e%2e/x", "a/../../b", "", "a".repeat(201), "x\u0000", "%zz", "missing/none.bin"])(
    "404 for key %j",
    async (key) => {
      const res = await get(key);
      expect(res.status).toBe(404);
    },
  );
});
