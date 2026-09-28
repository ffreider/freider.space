const FEED_URL = "https://media.rss.com/spacepodden/feed.xml";

export type Episode = {
  title: string;
  number?: number;
  url: string;
  image?: string;
  published: Date;
  minutes?: number;
};

// Pull one tag's text out of an RSS <item>, unwrapping CDATA.
function tag(xml: string, name: string) {
  // The name must end at a space or ">", so "itunes:episode" doesn't also
  // match "itunes:episodeType".
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match?.[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

// The newest Spacepodden episode, refreshed at most once an hour. Returns
// null if the feed can't be read, so the page still renders without it.
export async function latestEpisode(): Promise<Episode | null> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const xml = await res.text();
    const item = xml.match(/<item>([\s\S]*?)<\/item>/)?.[1];
    if (!item) return null;

    const title = tag(item, "title");
    const url = tag(item, "link");
    const published = new Date(tag(item, "pubDate") ?? "");
    if (!title || !url || Number.isNaN(published.getTime())) return null;

    const number = Number(tag(item, "itunes:episode"));
    const seconds = Number(tag(item, "itunes:duration"));
    return {
      title,
      url,
      published,
      number: Number.isFinite(number) && number > 0 ? number : undefined,
      minutes: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds / 60) : undefined,
      image: item.match(/<itunes:image href="([^"]+)"/)?.[1],
    };
  } catch {
    return null;
  }
}
