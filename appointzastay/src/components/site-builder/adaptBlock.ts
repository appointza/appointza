import type { BlockInstance } from "./blocks";
import { getBlockDef, TYPE_TO_KIND } from "./blocks";
import type { PageBlock } from "./types";

type Obj = Record<string, unknown>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function arr<T = Obj>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeLinks(links: unknown): string[] {
  const raw = arr(links);
  if (raw.length === 0) return [];
  if (typeof raw[0] === "string") return raw as string[];
  return arr<{ label?: string }>(links).map((l) => str(l.label)).filter(Boolean);
}

function adaptProps(kind: BlockInstance["kind"], props: Obj): Obj {
  switch (kind) {
    case "nav": {
      const live = props.useLiveProfile === true || props.useLiveProfile === "true";
      return {
        brand: live ? str(props.logo) || str(props.brand) : str(props.brand) || str(props.logo),
        links: normalizeLinks(props.links),
      };
    }

    case "hero":
      return {
        eyebrow: props.eyebrow,
        title: str(props.title) || str(props.hotelName),
        subtitle: str(props.subtitle) || str(props.tagline) || str(props.description),
        primaryCta: str(props.primaryLabel) || str(props.primaryCta) || str(props.ctaLabel),
        secondaryCta: str(props.secondaryLabel) || str(props.secondaryCta),
      };

    case "heroSplit":
      return {
        eyebrow: props.eyebrow,
        title: str(props.title),
        subtitle: str(props.subtitle),
        primaryCta: str(props.primaryLabel) || str(props.primaryCta),
        secondaryCta: str(props.secondaryLabel) || str(props.secondaryCta),
        imageLabel: str(props.imageLabel, "Property photo"),
      };

    case "heroShowcase":
    case "heroBackground":
    case "heroVideo":
    case "heroAnimated":
    case "heroMinimal":
    case "hero3d":
      return {
        eyebrow: props.eyebrow,
        title: str(props.title),
        subtitle: str(props.subtitle),
        primaryCta: str(props.primaryLabel) || str(props.primaryCta),
        secondaryCta: str(props.secondaryLabel) || str(props.secondaryCta),
        badge: props.badge,
        logos: props.logos,
        cards: props.cards,
      };

    case "heroCards":
      return {
        title: str(props.title),
        subtitle: str(props.subtitle),
        cards: arr<{ title: string; body: string }>(props.cards).length
          ? props.cards
          : arr<{ title?: string; body?: string; description?: string }>(props.cards).map((c) => ({
              title: str(c.title),
              body: str(c.body) || str(c.description),
            })),
      };

    case "heroSaas":
      return {
        badge: props.badge,
        title: str(props.title),
        subtitle: str(props.subtitle),
        primaryCta: str(props.primaryLabel) || str(props.primaryCta),
        secondaryCta: str(props.secondaryLabel) || str(props.secondaryCta),
        logos: arr<string>(props.logos),
      };

    case "features":
      return {
        eyebrow: props.eyebrow,
        title: str(props.title),
        items: arr<{ n?: string; icon?: string; title?: string; body?: string; description?: string }>(
          arr(props.items).length ? props.items : props.features,
        ).map((f, i) => ({
          n: str(f.n) || str(f.icon) || String(i + 1).padStart(2, "0"),
          title: str(f.title),
          body: str(f.body) || str(f.description),
        })),
      };

    case "services":
      return {
        title: str(props.title),
        items: arr<{ title?: string; body?: string; description?: string }>(
          arr(props.items).length ? props.items : props.services,
        ).map((s) => ({
          title: str(s.title),
          body: str(s.body) || str(s.description),
        })),
      };

    case "stats":
      return {
        items: arr<{ value?: string; label?: string }>(arr(props.items).length ? props.items : props.stats).map((s) => ({
          value: str(s.value),
          label: str(s.label),
        })),
      };

    case "pricing":
      return {
        title: str(props.title),
        tiers: arr<{
          name?: string;
          price?: string;
          per?: string;
          features?: string[];
          featured?: boolean;
          highlighted?: boolean;
        }>(props.tiers).map((t) => ({
          name: str(t.name),
          price: str(t.price),
          per: str(t.per, "/mo"),
          features: arr<string>(t.features),
          featured: Boolean(t.featured ?? t.highlighted),
        })),
      };

    case "testimonials":
      return {
        items: arr<{ quote?: string; author?: string; role?: string }>(
          arr(props.items).length ? props.items : props.testimonials,
        ).map((t) => ({
          quote: str(t.quote),
          author: str(t.author),
          role: str(t.role),
        })),
      };

    case "faq":
      return {
        title: str(props.title),
        items: arr<{ q?: string; a?: string; question?: string; answer?: string }>(props.items).map((it) => ({
          q: str(it.q) || str(it.question),
          a: str(it.a) || str(it.answer),
        })),
      };

    case "contact":
      return {
        title: str(props.title),
        subtitle: str(props.subtitle),
      };

    case "cta":
      return {
        title: str(props.title),
        cta: str(props.cta) || str(props.buttonLabel),
      };

    case "footer": {
      const groups = arr<{ title?: string; links?: { label?: string }[] }>(
        arr(props.columns).length ? props.columns : props.linkGroups,
      );
      const live = props.useLiveProfile === true || props.useLiveProfile === "true";
      return {
        brand: live ? str(props.logo) || str(props.brand) : str(props.brand) || str(props.logo),
        tagline: str(props.tagline),
        columns: groups.map((g) => ({
          title: str(g.title),
          links: arr<{ label?: string }>(g.links).map((l) => str(l.label)),
        })),
      };
    }

    case "hotelHero": {
      const live = props.useLiveProfile === true || props.useLiveProfile === "true";
      return {
        brand: str(props.brand) || str(props.hotelName),
        title: live
          ? str(props.hotelName) || str(props.title)
          : str(props.title) || str(props.hotelName),
        subtitle: live
          ? str(props.tagline) || str(props.subtitle) || str(props.description)
          : str(props.subtitle) || str(props.tagline) || str(props.description),
        primaryCta: str(props.primaryCta) || str(props.ctaLabel, "Check availability"),
        heroImageUrl: str(props.heroImageUrl) || str(props.imageUrl) || str(props.logoImageUrl),
      };
    }

    case "hotelAbout": {
      const highlights = [
        ...arr<string>(props.highlights),
        ...arr<string>(props.locationHighlights),
        ...arr<string>(props.amenitiesOverview),
      ];
      return {
        title: str(props.title),
        description: str(props.description),
        highlights: highlights.length ? highlights : arr<string>(props.highlights),
      };
    }

    case "hotelRooms":
    case "hotelAllRooms":
      return {
        title: str(props.title),
        subtitle: str(props.subtitle),
        showStatus: props.showStatus !== false,
        rooms: arr<{
          id?: string;
          name?: string;
          roomNumber?: string;
          roomType?: string;
          photo?: string;
          capacity?: string;
          price?: string;
          per?: string;
          features?: string[];
          amenities?: string[];
          status?: string;
          statusLabel?: string;
          bookUrl?: string;
          available?: boolean;
          description?: string;
        }>(arr(props.rooms).length ? props.rooms : props.roomTypes).map((r) => ({
          id: str(r.id),
          name: str(r.name),
          roomNumber: str(r.roomNumber),
          roomType: str(r.roomType),
          photo: str(r.photo),
          capacity: str(r.capacity),
          price: str(r.price),
          per: str(r.per, "/night"),
          status: str(r.status),
          statusLabel: str(r.statusLabel),
          bookUrl: str(r.bookUrl),
          available: r.available !== false,
          features: arr<string>(r.features).length
            ? r.features
            : arr<string>(r.amenities).length
              ? r.amenities
              : r.description
                ? [str(r.description)]
                : [],
        })),
      };

    case "hotelAmenities":
      return {
        title: str(props.title),
        items: arr<string>(props.items).length
          ? props.items
          : arr<{ name?: string; title?: string }>(props.amenities).map((a) => str(a.name) || str(a.title)),
      };

    case "hotelGallery": {
      const fromItems = arr<{ category?: string; imageUrl?: string; url?: string; label?: string }>(
        arr(props.galleryItems).length ? props.galleryItems : props.items,
      );
      const unique = [...new Set(fromItems.map((g) => str(g.category)).filter(Boolean))];
      const images = fromItems
        .map((g) => ({
          url: str(g.imageUrl) || str(g.url),
          label: str(g.label),
          category: str(g.category),
        }))
        .filter((g) => g.url);
      return {
        title: str(props.title),
        categories: arr<string>(props.categories).length
          ? props.categories
          : unique.length
            ? unique
            : ["All", "Rooms", "Views"],
        images,
      };
    }

    case "hotelBooking":
      return {
        cta: str(props.cta) || str(props.ctaLabel, "Check availability"),
      };

    case "hotelPackages":
      return {
        title: str(props.title),
        packages: arr<{ name?: string; desc?: string; description?: string; price?: string }>(
          props.packages,
        ).map((p) => ({
          name: str(p.name),
          desc: str(p.desc) || str(p.description),
          price: str(p.price),
        })),
      };

    case "hotelReviews":
      return {
        title: str(props.title),
        rating: String(props.rating ?? props.averageRating ?? "4.8"),
        count: str(props.count) || `${props.totalReviews ?? 0} reviews`,
        reviews: arr<{ name?: string; author?: string; stars?: number; rating?: number; text?: string; quote?: string }>(
          props.reviews,
        ).map((r) => ({
          name: str(r.name) || str(r.author),
          stars: Number(r.stars ?? r.rating ?? 5),
          text: str(r.text) || str(r.quote),
        })),
      };

    case "hotelNearby":
      return {
        title: str(props.title),
        items: arr<{ name?: string; distance?: string; imageUrl?: string; mapUrl?: string }>(
          arr(props.items).length ? props.items : props.attractions,
        ).map((it) => ({
          name: str(it.name),
          distance: str(it.distance),
          imageUrl: str(it.imageUrl),
          mapUrl: str(it.mapUrl),
        })),
      };

    case "hotelContact":
      return {
        title: str(props.title),
        address: str(props.address),
        phone: str(props.phone),
        email: str(props.email),
        whatsapp: str(props.whatsapp),
      };

    case "hotelPolicies": {
      const items: { label: string; value: string }[] = arr<{ label?: string; value?: string }>(props.items).map(
        (it) => ({ label: str(it.label), value: str(it.value) }),
      );
      if (!items.length) {
        if (props.checkIn) items.push({ label: "Check-in", value: str(props.checkIn) });
        if (props.checkOut) items.push({ label: "Check-out", value: str(props.checkOut) });
        if (props.cancellation) items.push({ label: "Cancellation", value: str(props.cancellation) });
        if (props.refund) items.push({ label: "Refund", value: str(props.refund) });
        for (const rule of arr<string>(props.houseRules)) {
          items.push({ label: "House rule", value: rule });
        }
      }
      return { title: str(props.title), items };
    }

    case "hotelPayment": {
      const options: string[] = arr<string>(props.options);
      if (!options.length) {
        if (props.enableAdvance !== false) options.push("Pay advance (30%)");
        if (props.enableFull !== false) options.push("Pay full amount");
      }
      return {
        title: str(props.title),
        subtitle: str(props.subtitle),
        options,
        cta: str(props.cta) || str(props.ctaLabel, "Pay securely"),
      };
    }

    default:
      return props;
  }
}

export function adaptBlock(block: PageBlock): BlockInstance | null {
  const kind = TYPE_TO_KIND[block.type];
  if (!kind) return null;

  let defaults: Record<string, unknown> = {};
  try {
    defaults = structuredClone(getBlockDef(kind).defaults);
  } catch {
    defaults = { ...getBlockDef(kind).defaults };
  }

  const merged = { ...defaults, ...(block.props ?? {}) };

  return {
    id: block.id,
    kind,
    props: adaptProps(kind, merged),
  };
}

export function adaptBlocks(blocks: PageBlock[]): BlockInstance[] {
  return blocks.map(adaptBlock).filter((b): b is BlockInstance => b !== null);
}
