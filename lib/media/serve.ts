// Serves films and posters from the R2 binding with Range and conditional GET (D-04).
// Bytes are never read or sliced in JS: obj.body streams straight into the Response (PLAT-04).

const KEY_RE = /^[a-z0-9_][a-z0-9._/-]{0,199}$/i;

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function baseHeaders(obj: R2Object): Headers {
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set("ETag", obj.httpEtag);
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", "public, max-age=31536000, immutable");
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  h.set("X-Content-Type-Options", "nosniff");
  return h;
}

export async function serveMedia(request: Request, bucket: R2Bucket, rawKey: string): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  let key: string;
  try {
    key = decodeURIComponent(rawKey);
  } catch {
    return notFound();
  }
  if (!KEY_RE.test(key) || key.split("/").some((seg) => seg === ".." || seg === "." || seg === "")) {
    return notFound();
  }

  if (request.method === "HEAD") {
    const head = await bucket.head(key);
    if (!head) return notFound();
    const h = baseHeaders(head);
    h.set("Content-Length", String(head.size));
    return new Response(null, { status: 200, headers: h });
  }

  // If-Range is not supported by R2: send the full object instead of a partial one.
  const headers = new Headers(request.headers);
  if (headers.has("if-range")) headers.delete("range");

  let obj: R2Object | R2ObjectBody | null;
  try {
    obj = await bucket.get(key, { range: headers, onlyIf: headers });
  } catch {
    const head = await bucket.head(key);
    if (!head) return notFound();
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
  }
  if (!obj) return notFound();
  if (!("body" in obj)) return new Response(null, { status: 304, headers: baseHeaders(obj) });

  const out = baseHeaders(obj);
  // Miniflare (and possibly R2) answer an offset past the end with the whole object, so check the header too.
  const asked = /^bytes=(\d+)-/.exec(headers.get("range") ?? "");
  if (asked && Number(asked[1]) >= obj.size) {
    await obj.body.cancel();
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${obj.size}` } });
  }
  const r = obj.range as { offset?: number; length?: number; suffix?: number } | undefined;
  if (headers.has("range") && r) {
    const size = obj.size;
    const start = r.suffix !== undefined ? Math.max(0, size - r.suffix) : (r.offset ?? 0);
    const end = r.suffix !== undefined ? size - 1 : r.length !== undefined ? start + r.length - 1 : size - 1;
    if (start >= size) {
      // The runtime may clamp an offset past the end instead of throwing.
      await obj.body.cancel();
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    out.set("Content-Range", `bytes ${start}-${end}/${size}`);
    out.set("Content-Length", String(end - start + 1));
    return new Response(obj.body, { status: 206, headers: out });
  }
  out.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers: out });
}
