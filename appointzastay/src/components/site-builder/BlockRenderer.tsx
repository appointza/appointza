import type { BlockInstance } from "./blocks";
import { resolveMediaUrl } from "@/utils/environment";
import { bookUrl } from "@/utils/bookingLinks";
import { LiveWeatherStats } from "./LiveWeatherStats";
import "./stay-elegant.css";

type Props = Record<string, unknown>;

const getStr = (p: Props, k: string, fallback = ""): string =>
  typeof p[k] === "string" ? (p[k] as string) : fallback;

const getArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function isTruthyProp(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export function BlockRenderer({ block }: { block: BlockInstance }) {
  const p = block.props as Props;
  switch (block.kind) {
    case "nav":
      return (
        <div className="stay-elegant-nav">
          <span className="stay-elegant-nav__brand">{getStr(p, "brand")}</span>
          <div className="stay-elegant-nav__links">
            {getArr<string>(p.links).map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
          <a href={bookUrl()} className="stay-elegant-cta stay-elegant-cta--dark">
            Book
          </a>
        </div>
      );

    case "hero":
      return (
        <section className="px-10 py-24 flex flex-col items-center text-center">
          {p.eyebrow ? (
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 border border-border rounded-full text-[10px] font-mono uppercase tracking-widest text-muted">
              <span className="size-1.5 rounded-full bg-primary" /> {p.eyebrow as string}
            </div>
          ) : null}
          <h1 className="font-display text-6xl font-extrabold tracking-tight text-balance mb-6 max-w-[18ch]">
            {getStr(p, "title")}
          </h1>
          <p className="text-muted max-w-[52ch] text-lg text-pretty leading-relaxed">
            {getStr(p, "subtitle")}
          </p>
          <div className="mt-10 flex gap-3">
            <div className="px-8 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-[0.15em]">
              {getStr(p, "primaryCta")}
            </div>
            <div className="px-8 py-3 border border-border font-bold text-xs uppercase tracking-[0.15em]">
              {getStr(p, "secondaryCta")}
            </div>
          </div>
        </section>
      );

    case "heroSplit":
      return (
        <section className="px-10 py-20 grid grid-cols-2 gap-12 items-center">
          <div>
            {p.eyebrow ? (
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary mb-4">
                {p.eyebrow as string}
              </div>
            ) : null}
            <h1 className="font-display text-5xl font-extrabold tracking-tight mb-5 leading-[1.05]">
              {getStr(p, "title")}
            </h1>
            <p className="text-muted text-base leading-relaxed mb-8 max-w-[44ch]">
              {getStr(p, "subtitle")}
            </p>
            <div className="flex gap-3">
              <div className="px-6 py-3 bg-primary text-white font-bold text-xs uppercase tracking-[0.15em]">
                {getStr(p, "primaryCta")}
              </div>
              <div className="px-6 py-3 border border-border font-bold text-xs uppercase tracking-[0.15em]">
                {getStr(p, "secondaryCta")}
              </div>
            </div>
          </div>
          <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-200 border border-border relative overflow-hidden">
            <div className="absolute top-3 left-3 text-[10px] font-mono text-muted">{getStr(p, "imageLabel")}</div>
            <div className="absolute inset-0 grid place-items-center">
              <div className="size-24 rounded-full bg-primary/15 border border-primary/30" />
            </div>
          </div>
        </section>
      );

    case "heroShowcase":
      return (
        <section className="px-10 pt-20 pb-0 flex flex-col items-center text-center overflow-hidden">
          <h1 className="font-display text-5xl font-extrabold tracking-tight mb-5 max-w-[20ch]">
            {getStr(p, "title")}
          </h1>
          <p className="text-muted max-w-[48ch] text-base leading-relaxed mb-8">
            {getStr(p, "subtitle")}
          </p>
          <div className="flex gap-3 mb-12">
            <div className="px-7 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-[0.15em]">
              {getStr(p, "primaryCta")}
            </div>
            <div className="px-7 py-3 border border-border font-bold text-xs uppercase tracking-[0.15em]">
              {getStr(p, "secondaryCta")}
            </div>
          </div>
          <div className="w-[88%] aspect-[16/9] rounded-t-xl border border-b-0 border-border bg-white shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="h-8 border-b border-border flex items-center px-3 gap-1.5 bg-stone-50">
              <span className="size-2 rounded-full bg-stone-300" />
              <span className="size-2 rounded-full bg-stone-300" />
              <span className="size-2 rounded-full bg-stone-300" />
            </div>
            <div className="grid grid-cols-[160px_1fr] h-[calc(100%-2rem)]">
              <div className="border-r border-border bg-stone-50/50 p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-3 bg-stone-200 rounded" style={{ width: `${60 + i * 7}%` }} />
                ))}
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-stone-50 border border-border rounded p-3 space-y-2">
                    <div className="h-2 w-1/2 bg-stone-200 rounded" />
                    <div className="h-6 w-3/4 bg-primary/20 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );

    case "heroBackground":
      return (
        <section
          className="relative px-10 py-32 flex flex-col items-center text-center text-white overflow-hidden"
          style={{ backgroundImage: "linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1e3a8a 100%)" }}
        >
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <h1 className="font-display text-6xl font-extrabold tracking-tight mb-6 max-w-[16ch]">
              {getStr(p, "title")}
            </h1>
            <p className="text-white/80 max-w-[48ch] text-lg leading-relaxed mb-10 mx-auto">
              {getStr(p, "subtitle")}
            </p>
            <div className="inline-block px-8 py-3 bg-white text-foreground font-bold text-xs uppercase tracking-[0.15em]">
              {getStr(p, "primaryCta")}
            </div>
          </div>
        </section>
      );

    case "heroVideo":
      return (
        <section className="relative px-10 py-28 flex flex-col items-center text-center text-white overflow-hidden bg-black">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-black to-blue-900 animate-pulse" />
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)" }} />
          </div>
          <div className="absolute top-4 right-4 text-[10px] font-mono text-white/60 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE · BG VIDEO
          </div>
          <div className="relative">
            <h1 className="font-display text-6xl font-extrabold tracking-tight mb-6 max-w-[16ch]">
              {getStr(p, "title")}
            </h1>
            <p className="text-white/80 max-w-[48ch] text-lg leading-relaxed mb-10 mx-auto">
              {getStr(p, "subtitle")}
            </p>
            <div className="inline-flex items-center gap-3 px-7 py-3 bg-white text-foreground font-bold text-xs uppercase tracking-[0.15em]">
              ▶ {getStr(p, "primaryCta")}
            </div>
          </div>
        </section>
      );

    case "heroAnimated":
      return (
        <section
          className="relative px-10 py-28 flex flex-col items-center text-center overflow-hidden"
          style={{ background: "conic-gradient(from 180deg at 50% 50%, #dbeafe 0deg, #ede9fe 90deg, #fce7f3 180deg, #dbeafe 360deg)" }}
        >
          <div className="absolute -top-20 -left-20 size-80 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-purple-400/30 blur-3xl" />
          <div className="relative">
            {p.eyebrow ? (
              <div className="inline-block px-3 py-1 mb-6 rounded-full bg-white/70 backdrop-blur border border-white text-[10px] font-mono uppercase tracking-widest">
                {p.eyebrow as string}
              </div>
            ) : null}
            <h1 className="font-display text-6xl font-extrabold tracking-tight mb-6 max-w-[18ch] bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
              {getStr(p, "title")}
            </h1>
            <p className="text-foreground/70 max-w-[48ch] text-lg leading-relaxed mb-10 mx-auto">
              {getStr(p, "subtitle")}
            </p>
            <div className="flex gap-3 justify-center">
              <div className="px-7 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-[0.15em] rounded-full">
                {getStr(p, "primaryCta")}
              </div>
              <div className="px-7 py-3 border border-foreground/20 bg-white/50 backdrop-blur font-bold text-xs uppercase tracking-[0.15em] rounded-full">
                {getStr(p, "secondaryCta")}
              </div>
            </div>
          </div>
        </section>
      );

    case "heroMinimal":
      return (
        <section className="px-10 py-32 max-w-3xl">
          <h1 className="font-display text-5xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            {getStr(p, "title")}
          </h1>
          <p className="text-muted text-lg leading-relaxed mb-8 max-w-[44ch]">
            {getStr(p, "subtitle")}
          </p>
          <div className="text-sm font-bold underline underline-offset-4">
            {getStr(p, "primaryCta")}
          </div>
        </section>
      );

    case "heroCards": {
      const cards = (p.cards as Array<{ title: string; body: string }>) || [];
      return (
        <section className="px-10 py-20 text-center">
          <h1 className="font-display text-5xl font-extrabold tracking-tight mb-4 max-w-[20ch] mx-auto">
            {getStr(p, "title")}
          </h1>
          <p className="text-muted max-w-[46ch] mx-auto text-base leading-relaxed mb-12">
            {getStr(p, "subtitle")}
          </p>
          <div className="grid grid-cols-3 gap-4 text-left">
            {cards.map((c, i) => (
              <div key={i} className="p-6 border border-border bg-stone-50/50 hover:bg-stone-50 transition-colors">
                <div className="text-[10px] font-mono text-primary mb-3">0{i + 1}</div>
                <h3 className="font-display font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "heroSaas": {
      const logos = (p.logos as string[]) || [];
      return (
        <section className="px-10 pt-20 pb-12 flex flex-col items-center text-center bg-gradient-to-b from-white to-stone-50">
          {p.badge ? (
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-medium text-primary">
              ★ {p.badge as string}
            </div>
          ) : null}
          <h1 className="font-display text-5xl font-extrabold tracking-tight mb-5 max-w-[20ch]">
            {getStr(p, "title")}
          </h1>
          <p className="text-muted max-w-[50ch] text-base leading-relaxed mb-8">
            {getStr(p, "subtitle")}
          </p>
          <div className="flex gap-3 mb-10">
            <div className="px-7 py-3 bg-primary text-white font-bold text-xs uppercase tracking-[0.15em] rounded-md">
              {getStr(p, "primaryCta")}
            </div>
            <div className="px-7 py-3 border border-border font-bold text-xs uppercase tracking-[0.15em] rounded-md">
              {getStr(p, "secondaryCta")}
            </div>
          </div>
          <div className="w-[85%] aspect-[16/8] rounded-xl border border-border bg-white shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="grid grid-cols-4 h-full">
              <div className="border-r border-border p-4 space-y-3 bg-stone-50/50">
                <div className="h-3 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/2 bg-stone-200 rounded" />
                <div className="h-3 w-2/3 bg-primary/30 rounded" />
              </div>
              <div className="col-span-3 p-5 grid grid-cols-2 gap-3">
                <div className="rounded bg-gradient-to-br from-primary/20 to-purple-200" />
                <div className="rounded bg-stone-100 grid place-items-center">
                  <div className="font-mono text-2xl font-bold text-primary">+42%</div>
                </div>
                <div className="col-span-2 rounded bg-stone-100 p-3 flex items-end gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-t" style={{ height: `${30 + Math.sin(i) * 25 + i * 4}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {logos.length > 0 && (
            <div className="mt-12 w-full">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">Trusted by teams at</div>
              <div className="flex justify-center gap-8 flex-wrap opacity-60">
                {logos.map((l, i) => (
                  <span key={i} className="font-display font-bold text-lg tracking-tight">{l}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      );
    }

    case "hero3d":
      return (
        <section className="px-10 py-20 grid grid-cols-[1.1fr_1fr] gap-10 items-center bg-gradient-to-br from-stone-50 to-white">
          <div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight mb-5 leading-[1.05]">
              {getStr(p, "title")}
            </h1>
            <p className="text-muted text-base leading-relaxed mb-8 max-w-[40ch]">
              {getStr(p, "subtitle")}
            </p>
            <div className="flex gap-3">
              <div className="px-7 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-[0.15em]">
                {getStr(p, "primaryCta")}
              </div>
              <div className="px-7 py-3 border border-border font-bold text-xs uppercase tracking-[0.15em]">
                {getStr(p, "secondaryCta")}
              </div>
            </div>
          </div>
          <div className="relative aspect-square grid place-items-center" style={{ perspective: "1000px" }}>
            <div
              className="size-56 rounded-3xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #4c1d95 100%)",
                transform: "rotateX(25deg) rotateY(-25deg) rotateZ(8deg)",
                boxShadow: "30px 40px 80px -20px rgba(37,99,235,0.45), inset -10px -20px 40px rgba(0,0,0,0.25), inset 10px 10px 30px rgba(255,255,255,0.25)",
              }}
            />
            <div
              className="absolute size-20 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, #fde68a, #f59e0b 60%, #b45309)",
                top: "20%",
                right: "18%",
                boxShadow: "10px 20px 40px -5px rgba(180,83,9,0.5)",
              }}
            />
          </div>
        </section>
      );

    case "features": {
      const items = (p.items as Array<{ n: string; title: string; body: string }>) || [];
      return (
        <section className="px-10 py-20">
          {p.eyebrow ? (
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted mb-3">
              {p.eyebrow as string}
            </div>
          ) : null}
          {p.title ? (
            <h2 className="font-display text-3xl font-extrabold tracking-tight mb-12 max-w-[20ch]">
              {p.title as string}
            </h2>
          ) : null}
          <div className="grid grid-cols-3 gap-10">
            {items.map((it, i) => (
              <div key={i} className="space-y-3">
                <div className="size-10 bg-stone-50 border border-border grid place-items-center text-primary font-mono text-xs">
                  {it.n}
                </div>
                <h3 className="font-display font-bold text-lg">{it.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "services": {
      const items = (p.items as Array<{ title: string; body: string }>) || [];
      return (
        <section className="px-10 py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight mb-10">
            {getStr(p, "title")}
          </h2>
          <div className="divide-y divide-stone-100 border-y border-stone-100">
            {items.map((it, i) => (
              <div key={i} className="py-6 grid grid-cols-[1fr_2fr] gap-10 items-baseline">
                <h3 className="font-display font-bold text-xl">{it.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "stats": {
      if (isTruthyProp(p.hidden)) return null;
      if (isTruthyProp(p.liveFromLocation)) {
        return (
          <LiveWeatherStats
            title={getStr(p, "title", "Weather")}
            latitude={p.latitude as number | string | null | undefined}
            longitude={p.longitude as number | string | null | undefined}
            locationLabel={getStr(p, "locationLabel")}
          />
        );
      }
      const items = (p.items as Array<{ value: string; label: string }>) || [];
      const statsFallback =
        items.length > 0
          ? items
          : getArr<{ value?: string; label?: string }>(p.stats).map((s) => ({
              value: String(s.value ?? ""),
              label: String(s.label ?? ""),
            }));
      return (
        <section className="px-10 py-16">
          <div className="grid grid-cols-4 gap-6">
            {statsFallback.map((it, i) => (
              <div key={i} className="space-y-2">
                <div className="font-display text-4xl font-extrabold tracking-tight">{it.value}</div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted">{it.label}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "pricing": {
      const tiers = (p.tiers as Array<{ name: string; price: string; per: string; features: string[]; featured?: boolean }>) || [];
      return (
        <section className="px-10 py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight mb-10 text-center">
            {getStr(p, "title")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {tiers.map((t, i) => (
              <div
                key={i}
                className={
                  "p-6 border " +
                  (t.featured
                    ? "border-foreground bg-foreground text-background"
                    : "border-border")
                }
              >
                <div className="text-[10px] font-mono uppercase tracking-widest mb-4 opacity-70">
                  {t.name}
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-extrabold">{t.price}</span>
                  <span className={"text-xs " + (t.featured ? "opacity-70" : "text-muted")}>{t.per}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {getArr<string>(t.features).map((f, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="opacity-50">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "testimonials": {
      const items = (p.items as Array<{ quote: string; author: string; role: string }>) || [];
      return (
        <section className="px-10 py-20">
          <div className="grid grid-cols-2 gap-8">
            {items.map((it, i) => (
              <figure key={i} className="border border-border p-8">
                <blockquote className="font-display text-xl font-bold tracking-tight leading-snug mb-6">
                  &ldquo;{it.quote}&rdquo;
                </blockquote>
                <figcaption className="text-xs font-mono uppercase tracking-widest text-muted">
                  {it.author} — {it.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    }

    case "faq": {
      const items = (p.items as Array<{ q: string; a: string }>) || [];
      return (
        <section className="px-10 py-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight mb-10">
            {getStr(p, "title")}
          </h2>
          <div className="divide-y divide-stone-100 border-y border-stone-100">
            {items.map((it, i) => (
              <details key={i} className="py-5 group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <span className="font-display font-bold text-base">{it.q}</span>
                  <span className="font-mono text-primary text-xs">[+]</span>
                </summary>
                <p className="text-sm text-muted leading-relaxed mt-3 max-w-[60ch]">{it.a}</p>
              </details>
            ))}
          </div>
        </section>
      );
    }

    case "contact":
      return (
        <section className="px-10 py-20 grid grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight mb-4">{getStr(p, "title")}</h2>
            <p className="text-muted text-sm leading-relaxed max-w-[40ch]">{getStr(p, "subtitle")}</p>
          </div>
          <form className="space-y-4">
            <input className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground" placeholder="Your name" />
            <input className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground" placeholder="Email" />
            <textarea className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground resize-none" rows={3} placeholder="Project brief" />
            <button type="button" className="px-8 py-3 bg-foreground text-background font-bold text-xs uppercase tracking-[0.15em]">Send</button>
          </form>
        </section>
      );

    case "cta":
      return (
        <section className="px-10 py-20 bg-foreground text-background flex flex-col items-center text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight mb-8 max-w-[20ch]">
            {getStr(p, "title")}
          </h2>
          <div className="px-8 py-3 bg-primary text-white font-bold text-xs uppercase tracking-[0.15em]">
            {getStr(p, "cta")}
          </div>
        </section>
      );

    case "footer": {
      const columns = (p.columns as Array<{ title: string; links: string[] }>) || [];
      return (
        <footer className="stay-elegant-footer">
          <div className="stay-elegant-footer__grid">
            <div>
              <div className="stay-elegant-footer__brand">{getStr(p, "brand")}</div>
              <p className="stay-elegant-footer__tagline">{getStr(p, "tagline")}</p>
            </div>
            <div className="stay-elegant-footer__cols">
              {columns.map((c, i) => (
                <div key={i}>
                  <div className="stay-elegant-footer__col-title">{c.title}</div>
                  <ul className="stay-elegant-footer__links">
                    {getArr<string>(c.links).map((l, j) => (
                      <li key={j}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </footer>
      );
    }

    case "hotelHero": {
      const heroImg = getStr(p, "heroImageUrl");
      return (
        <section className="stay-elegant-hero">
          <div className="stay-elegant-hero__media">
            {heroImg ? (
              <img src={resolveMediaUrl(heroImg)} alt="" />
            ) : (
              <div className="stay-elegant-hero__fallback" aria-hidden />
            )}
            <div className="stay-elegant-hero__veil" aria-hidden />
          </div>
          <div className="stay-elegant-hero__content">
            {getStr(p, "brand") ? (
              <p className="stay-elegant-hero__brand">{getStr(p, "brand")}</p>
            ) : null}
            <h1 className="stay-elegant-hero__title">{getStr(p, "title")}</h1>
            {getStr(p, "subtitle") ? (
              <p className="stay-elegant-hero__subtitle">{getStr(p, "subtitle")}</p>
            ) : null}
            <a href={bookUrl()} className="stay-elegant-cta">
              {getStr(p, "primaryCta", "Book your stay")}
            </a>
          </div>
        </section>
      );
    }

    case "hotelAbout": {
      const highlights = (p.highlights as string[]) || [];
      return (
        <section className="stay-elegant-section stay-elegant-section--alt">
          <div className="stay-elegant-grid-2">
            <div>
              <p className="stay-elegant-kicker">About</p>
              <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
              <p className="stay-elegant-lead">{getStr(p, "description")}</p>
            </div>
            {highlights.length ? (
              <ul className="stay-elegant-list">
                {highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      );
    }

    case "hotelRooms":
    case "hotelAllRooms": {
      const rooms =
        (p.rooms as Array<{
          id?: string;
          name: string;
          roomNumber?: string;
          roomType?: string;
          photo?: string;
          capacity: string;
          price: string;
          per: string;
          features: string[];
          statusLabel?: string;
          bookUrl?: string;
          available?: boolean;
        }>) || [];
      const showStatus = block.kind === "hotelAllRooms" || p.showStatus !== false;
      return (
        <section className="stay-elegant-section">
          <div className="stay-elegant-section__head">
            <p className="stay-elegant-kicker">Stay</p>
            <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
            {getStr(p, "subtitle") ? (
              <p className="stay-elegant-lead">{getStr(p, "subtitle")}</p>
            ) : null}
          </div>
          {rooms.length === 0 ? (
            <p className="stay-elegant-empty">
              No rooms yet. Add rooms under Staff → Rooms, then refresh this preview.
            </p>
          ) : (
            <div className="stay-elegant-rooms">
              {rooms.map((r, i) => (
                <article key={r.id || i} className="stay-elegant-room">
                  <div className="stay-elegant-room__photo">
                    {r.photo ? (
                      <img src={resolveMediaUrl(r.photo)} alt={r.name} loading="lazy" />
                    ) : null}
                  </div>
                  <div className="stay-elegant-room__body">
                    <div className="stay-elegant-room__top">
                      <div className="min-w-0">
                        <h3 className="stay-elegant-room__name">{r.name}</h3>
                        {(r.roomNumber || r.roomType) && (
                          <p className="stay-elegant-meta">
                            {[r.roomNumber && `#${r.roomNumber}`, r.roomType].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="stay-elegant-room__price">
                        <span>{r.price}</span>
                        <small>{r.per}</small>
                      </div>
                    </div>
                    <div className="stay-elegant-room__meta-row">
                      <span className="stay-elegant-meta">{r.capacity}</span>
                      {showStatus && r.statusLabel ? (
                        <span className="stay-elegant-pill">{r.statusLabel}</span>
                      ) : null}
                    </div>
                    {r.features?.length ? (
                      <ul className="stay-elegant-room__features">
                        {r.features.map((f, j) => (
                          <li key={j}>{f}</li>
                        ))}
                      </ul>
                    ) : null}
                    {r.available !== false && r.bookUrl && r.bookUrl !== "#" ? (
                      <a href={r.bookUrl} className="stay-elegant-link">
                        Book this room
                      </a>
                    ) : (
                      <span className="stay-elegant-meta opacity-60">Not available</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      );
    }

    case "hotelAmenities": {
      const items = (p.items as string[]) || [];
      return (
        <section className="stay-elegant-section stay-elegant-section--alt">
          <p className="stay-elegant-kicker">Comfort</p>
          <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
          <div className="stay-elegant-amenities">
            {items.map((it, i) => (
              <div key={i} className="stay-elegant-amenity">
                <span className="stay-elegant-amenity__n">{String(i + 1).padStart(2, "0")}</span>
                <span>{it}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "hotelGallery": {
      const images =
        (p.images as Array<{ url: string; label?: string; category?: string }>) || [];
      const categories = (p.categories as string[]) || [];
      const shown = images.slice(0, 5);
      return (
        <section className="stay-elegant-section">
          <div className="stay-elegant-section__head stay-elegant-section__head--row">
            <div>
              <p className="stay-elegant-kicker">Gallery</p>
              <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
            </div>
            {categories.length ? (
              <div className="stay-elegant-chips">
                {categories.slice(0, 4).map((c, i) => (
                  <span key={i} className={i === 0 ? "is-active" : undefined}>
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="stay-elegant-gallery">
            {(shown.length ? shown : [null, null, null, null, null]).map((img, i) => (
              <div key={i} className="stay-elegant-gallery__item">
                {img?.url ? (
                  <img src={resolveMediaUrl(img.url)} alt={img.label || ""} loading="lazy" />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "hotelBooking":
      return (
        <section className="stay-elegant-booking">
          <a href={bookUrl()} className="stay-elegant-booking__bar">
            {[
              { l: "Check-in", v: "Select dates" },
              { l: "Check-out", v: "Select dates" },
              { l: "Guests", v: "2 guests" },
              { l: "Room / package", v: "Your choice" },
            ].map((f, i) => (
              <div key={i} className="stay-elegant-booking__field">
                <div className="stay-elegant-meta">{f.l}</div>
                <div className="stay-elegant-booking__value">{f.v}</div>
              </div>
            ))}
            <span className="stay-elegant-cta stay-elegant-cta--dark">
              {getStr(p, "cta", "Book now")}
            </span>
          </a>
        </section>
      );

    case "hotelPackages": {
      const packages =
        (p.packages as Array<{
          id?: string;
          name: string;
          desc?: string;
          description?: string;
          price: string;
        }>) || [];
      return (
        <section className="stay-elegant-section stay-elegant-section--alt">
          <p className="stay-elegant-kicker">Offers</p>
          <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
          <div className="stay-elegant-packages">
            {packages.map((pk, i) => {
              const pkgId = pk.id || `name:${pk.name.trim().toLowerCase()}`;
              const desc = pk.desc || pk.description || "";
              return (
                <div key={pkgId || i} className="stay-elegant-package">
                  <div>
                    <h3 className="stay-elegant-package__name">{pk.name}</h3>
                    <p className="stay-elegant-lead">{desc}</p>
                  </div>
                  <div className="stay-elegant-package__aside">
                    <div className="stay-elegant-package__price">{pk.price}</div>
                    <a
                      href={bookUrl({ packageId: pkgId.startsWith("offer:") ? undefined : pkgId })}
                      className="stay-elegant-link"
                    >
                      Book
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "hotelReviews": {
      const reviews = (p.reviews as Array<{ name: string; stars: number; text: string }>) || [];
      return (
        <section className="stay-elegant-section">
          <div className="stay-elegant-section__head stay-elegant-section__head--row">
            <div>
              <p className="stay-elegant-kicker">Guests</p>
              <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
            </div>
            <div className="stay-elegant-rating">
              <div className="stay-elegant-rating__score">
                {getStr(p, "rating")}
                <span> / 5</span>
              </div>
              <div className="stay-elegant-meta">{getStr(p, "count")}</div>
            </div>
          </div>
          <div className="stay-elegant-reviews">
            {reviews.map((r, i) => (
              <figure key={i} className="stay-elegant-review">
                <div className="stay-elegant-stars">
                  {"★".repeat(r.stars)}
                  {"☆".repeat(5 - r.stars)}
                </div>
                <blockquote>&ldquo;{r.text}&rdquo;</blockquote>
                <figcaption className="stay-elegant-meta">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    }

    case "hotelNearby": {
      const items =
        (p.items as Array<{ name: string; distance: string; imageUrl?: string; mapUrl?: string }>) ||
        [];
      return (
        <section className="stay-elegant-section stay-elegant-section--alt">
          <p className="stay-elegant-kicker">Explore</p>
          <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
          <div className="stay-elegant-nearby">
            {items.map((it, i) => (
              <div key={i} className="stay-elegant-nearby__row">
                {it.imageUrl ? (
                  <img
                    src={resolveMediaUrl(it.imageUrl)}
                    alt={it.name}
                    className="stay-elegant-nearby__thumb"
                  />
                ) : (
                  <span className="stay-elegant-meta">{String(i + 1).padStart(2, "0")}</span>
                )}
                <div className="min-w-0">
                  <h3 className="stay-elegant-nearby__name">{it.name}</h3>
                  {it.mapUrl ? (
                    <a
                      href={it.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="stay-elegant-link"
                    >
                      View on map
                    </a>
                  ) : null}
                </div>
                <span className="stay-elegant-meta">{it.distance}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "hotelContact": {
      const phone = getStr(p, "phone");
      const whatsapp = getStr(p, "whatsapp");
      const mapsUrl = getStr(p, "mapsUrl") || getStr(p, "mapUrl") || getStr(p, "googleMapsUrl");
      return (
        <section className="stay-elegant-section">
          <div className="stay-elegant-grid-2">
            <div className="stay-elegant-map" aria-hidden={!mapsUrl}>
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="stay-elegant-map__link">
                  Open in Google Maps
                </a>
              ) : (
                <span className="stay-elegant-meta">Location</span>
              )}
            </div>
            <div>
              <p className="stay-elegant-kicker">Visit</p>
              <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
              <dl className="stay-elegant-dl">
                <div>
                  <dt>Address</dt>
                  <dd>{getStr(p, "address")}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{phone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{getStr(p, "email")}</dd>
                </div>
              </dl>
              <div className="stay-elegant-contact-actions">
                {whatsapp ? (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stay-elegant-cta stay-elegant-cta--dark"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {phone ? (
                  <a href={`tel:${phone}`} className="stay-elegant-cta stay-elegant-cta--outline">
                    Call
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "hotelPolicies": {
      const items = (p.items as Array<{ label: string; value: string }>) || [];
      return (
        <section className="stay-elegant-section stay-elegant-section--alt">
          <p className="stay-elegant-kicker">House rules</p>
          <h2 className="stay-elegant-title">{getStr(p, "title")}</h2>
          <div className="stay-elegant-policies">
            {items.map((it, i) => (
              <div key={i} className="stay-elegant-policy">
                <dt>{it.label}</dt>
                <dd>{it.value}</dd>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "hotelPayment": {
      const options = (p.options as string[]) || [];
      return (
        <section className="px-10 py-20 bg-stone-50">
          <div className="max-w-2xl mx-auto bg-white border border-border p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">{getStr(p, "title")}</h2>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 flex items-center gap-1">🔒 Razorpay</span>
            </div>
            <p className="text-sm text-muted mb-6">{getStr(p, "subtitle")}</p>
            <div className="space-y-2 mb-6">
              {options.map((o, i) => (
                <label key={i} className={"flex items-center gap-3 border p-4 cursor-pointer " + (i === 0 ? "border-foreground bg-stone-50" : "border-border")}>
                  <span className={"size-4 rounded-full border-2 " + (i === 0 ? "border-foreground bg-foreground" : "border-border")} />
                  <span className="text-sm font-medium">{o}</span>
                </label>
              ))}
            </div>
            <a
              href={bookUrl()}
              className="w-full py-3 bg-primary text-white font-bold text-xs uppercase tracking-[0.15em] text-center inline-block no-underline"
            >
              {getStr(p, "cta", "Confirm & Pay")}
            </a>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
