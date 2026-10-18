import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { parseStamp } from "@/lib/postcard";
import { loadPostcard } from "../load";
import { CARD } from "../sky";
import styles from "../postcard.module.css";

// freider.space/postcard/20261014T0732Z: the sky over the radio station that
// heard FramSat-1 most clearly near that moment, with the pass drawn as
// dashes of light. Contact cards link here for the minute they were saved;
// /hear links here for the pass you just heard.

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
  const title = `Postcard from FramSat-1, ${when(moment)}`;
  return {
    title,
    description: "The sky over a radio ground station as FramSat-1 passed, with every packet it heard drawn as a dash of light.",
    robots: { index: false, follow: true },
    openGraph: { title, description: "One pass of a satellite across a real night sky, drawn from its radio signal." },
    twitter: { card: "summary_large_image", title },
  };
}

export const viewport: Viewport = { themeColor: "#04060b" };

export default async function PostcardPage({ params }: Props) {
  const { stamp } = await params;
  const card = await loadPostcard(stamp);
  if (!card) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        {card.card ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/postcard/${stamp}/card.png?v=2`} width={CARD.width} height={CARD.height} alt={card.label} className={styles.card} />
        ) : (
          <div className={styles.blank}>
            <p className={styles.blankTitle}>{card.message?.[0]}</p>
            <p className={styles.blankText}>{card.message?.[1]}</p>
          </div>
        )}
      </div>
      <p className={styles.when}>{when(card.moment)}</p>
      <div className={styles.actions}>
        {card.card && (
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
      <p className={styles.privacy}>Privacy: no cookies. Visits are counted anonymously with Vercel Web Analytics.</p>
    </main>
  );
}
