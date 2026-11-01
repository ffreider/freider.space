import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { PRESETS, SHORT_LINKS, SLOTS, stillLive, type Overrides } from "@/lib/short-links";
import { fetchOverrides, signedIn, switchEnabled } from "@/lib/switch";
import { logIn, logOut, setSlot } from "./actions";
import styles from "./switch.module.css";

export const metadata: Metadata = {
  title: "Switch | freider.space",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export const dynamic = "force-dynamic";

const TIMERS = [
  { hours: 0, label: "Until changed" },
  { hours: 1, label: "1 h" },
  { hours: 3, label: "3 h" },
  { hours: 12, label: "12 h" },
];

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });

function nameOf(target: string) {
  return Object.values(PRESETS).find((p) => p.target === target)?.label ?? target;
}

// Where each printed code leads right now, and buttons to change it. Plain
// forms, so it works the moment the page loads, even on a bad connection.
export default async function Switch({ searchParams }: PageProps<"/switch">) {
  if (!switchEnabled()) notFound();
  const params = await searchParams;

  if (!(await signedIn())) {
    return (
      <main className={styles.page}>
        <form action={logIn} className={styles.col}>
          <input
            type="password"
            name="secret"
            autoComplete="current-password"
            aria-label="Secret"
            placeholder="Secret"
            className={styles.secret}
            autoFocus
          />
          {params.wrong && <p className={styles.note}>That wasn’t it.</p>}
        </form>
      </main>
    );
  }

  let overrides: Overrides = {};
  let error = "";
  try {
    overrides = stillLive(await fetchOverrides());
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const hours = Number(params.hours ?? 0);

  return (
    <main className={styles.page}>
      <form action={setSlot} className={styles.col}>
        <h1 className={styles.title}>Switch</h1>
        {error && <p className={styles.error}>{error}</p>}

        <fieldset className={styles.timers}>
          <legend className={styles.legend}>Next change lasts</legend>
          {TIMERS.map((t) => (
            <label key={t.hours} className={styles.timer}>
              <input type="radio" name="hours" value={t.hours} defaultChecked={t.hours === hours} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>

        {SLOTS.map((slot) => {
          const live = overrides[`${slot}`];
          const current = live ? PRESETS[live.preset].label : nameOf(SHORT_LINKS[slot] || "/");
          return (
            <section key={slot} className={styles.slot}>
              <div className={styles.head}>
                <span className={styles.badge}>{slot}</span>
                <div>
                  <div className={styles.current}>{current}</div>
                  <div className={styles.meta}>
                    {live
                      ? live.until
                        ? `until ${clock.format(live.until)}, then ${nameOf(SHORT_LINKS[slot] || "/")}`
                        : "until changed"
                      : "default"}
                  </div>
                </div>
              </div>
              <div className={styles.presets}>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    name="pick"
                    value={`${slot}:${key}`}
                    className={live?.preset === key ? styles.on : styles.preset}
                  >
                    {p.label}
                  </button>
                ))}
                {live && (
                  <button name="pick" value={`${slot}:default`} className={styles.reset}>
                    Back to default
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </form>
      <form action={logOut} className={styles.col}>
        <button className={styles.logout}>Log out</button>
      </form>
    </main>
  );
}
