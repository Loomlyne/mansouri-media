import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

const NAMES: Record<string, string> = { en: "EN", ar: "العربية", fr: "FR" };

export default async function HoldingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Holding");

  const waHref =
    "https://wa.me/971505085753?text=" + encodeURIComponent(t("waText"));
  const mailHref =
    "mailto:houssemansouri96@gmail.com?subject=" +
    encodeURIComponent(t("subject"));

  return (
    <div className="holding">
      <header>
        <nav className="lang" aria-label="Language">
          {routing.locales.map((l) => (
            <a
              key={l}
              href={`/${l}`}
              hrefLang={l}
              lang={l}
              className={l === locale ? "on" : undefined}
              aria-current={l === locale ? "page" : undefined}
            >
              {NAMES[l]}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <div className="stage">
          <div className="glow" aria-hidden="true" />
          <div className="rim" aria-hidden="true" />
          <div className="ring" aria-hidden="true" />
          <div className="inner">
            <img
              className="logo"
              src="/logo-plum.png"
              alt="Mansouri Media"
              width="1200"
              height="373"
            />
            <p className="slogan slogan-en" data-testid="slogan">
              {t("slogan")}
            </p>
          </div>
        </div>
        <div className="ctas">
          <a
            className="btn btn-gold"
            data-testid="wa"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("wa")}
          </a>
          <a className="btn btn-line" data-testid="mail" href={mailHref}>
            {t("mail")}
          </a>
        </div>
      </main>
      <footer data-testid="place">{t("place")}</footer>
    </div>
  );
}
