import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import { parseStamp } from "@/lib/postcard";
import { loadPostcard } from "../load";
import { Plate } from "../plate";
import styles from "../postcard.module.css";

// freider.space/postcard/20261014T0732Z: a print of the clearest radio pass
// of FramSat-1 near that moment. Contact cards link here for the minute they
// were saved; /hear links here for the pass you just heard.

const fraunces = Fraunces({ subsets: ["latin"], weight: "300", style: ["normal", "italic"], variable: "--font-fraunces" });

// Made on first visit and kept; a developing one is looked at again every
// 15 minutes until SatNOGS has processed the pass.
export const revalidate = 900;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ stamp: string }> };

const when = (d: Date) =>
  `${d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, ${d.toISOString().slice(11, 16)} UTC`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const moment = parseStamp((await params).stamp);
  if (!moment) return {};
  const title = `Postcard from FramSat-1 · ${when(moment)}`;
  return {
    title,
    description: "One pass of FramSat-1 over a radio ground station, drawn from its real signal.",
    robots: { index: false, follow: true },
    openGraph: { title, description: "One pass of a satellite, drawn from its real radio signal." },
    twitter: { card: "summary_large_image", title },
  };
}

export const viewport: Viewport = { themeColor: "#d9d3c7" };

export default async function PostcardPage({ params }: Props) {
  const { stamp } = await params;
  const card = await loadPostcard(stamp);
  if (!card) notFound();

  return (
    <main className={`${styles.page} ${fraunces.variable}`}>
      <div className={styles.frame}>
        {card.layout ? (
          <Plate layout={card.layout} label={card.label} />
        ) : (
          <div className={styles.blank}>
            <p className={styles.blankTitle}>{card.message?.[0]}</p>
            <p className={styles.blankText}>{card.message?.[1]}</p>
          </div>
        )}
      </div>
      <p className={styles.when}>{when(card.moment)}</p>
      <div className={styles.actions}>
        {card.layout && (
          <a href={`/postcard/${stamp}/print`} className={styles.primary} download={`framsat-1-postcard-${stamp}.png`}>
            Save for printing
          </a>
        )}
        <a href="/hear" className={styles.secondary}>
          Hear FramSat-1
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <p className={styles.more}><a href="/">freider.space</a></p>
    </main>
  );
}
