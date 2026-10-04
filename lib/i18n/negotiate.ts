export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "en";
  const parsed = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/i);
        if (m) {
          const n = Number(m[1]);
          q = Number.isFinite(n) ? n : 0;
        }
      }
      const primary = tag.trim().toLowerCase().split("-")[0];
      return { primary, q, index };
    })
    .filter((e) => e.primary && e.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const e of parsed) {
    const hit = LOCALES.find((l) => l === e.primary);
    if (hit) return hit;
  }
  return "en";
}
