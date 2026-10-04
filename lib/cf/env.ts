// The only module in Next code that touches Cloudflare bindings.
import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  // OpenNext's global env type, filled from the Wrangler-generated Cloudflare.Env (cloudflare-env.d.ts).
  interface CloudflareEnv extends Cloudflare.Env {}
}

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
