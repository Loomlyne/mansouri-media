import { getLocale } from "next-intl/server";

const LABELS: Record<string, string> = { en: "EN", ar: "العربية", fr: "FR" };

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", gap: "1.5rem", padding: "2rem" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-plum.png" alt="Mansouri Media" style={{ maxWidth: "12rem", height: "auto" }} />
      <a href={`/${locale}`}>{LABELS[locale] ?? "EN"}</a>
    </main>
  );
}
