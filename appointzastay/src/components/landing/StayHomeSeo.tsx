import { useEffect } from "react";
import {
  STAY_SEO_TITLE,
  STAY_SEO_DESCRIPTION,
  STAY_SEO_KEYWORDS,
  getStayAppBaseUrl,
  buildStayFaqSchema,
  buildStayBreadcrumbSchema,
  buildStaySoftwareSchema,
  buildStayProductSchema,
  buildStayOrganizationSchema,
  buildStayWebSiteSchema,
} from "@/utils/staySeo";

const SCHEMA_IDS = [
  "stay-seo-software",
  "stay-seo-product",
  "stay-seo-faq",
  "stay-seo-breadcrumb",
  "stay-seo-organization",
  "stay-seo-website",
] as const;

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function injectJsonLd(id: string, data: object) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/** Sets homepage title, meta tags, and JSON-LD structured data for Appointza Stay marketing. */
export function StayHomeSeo() {
  useEffect(() => {
    const baseUrl = getStayAppBaseUrl();
    const pageUrl = `${baseUrl}/`;
    const faqUrl = `${baseUrl}/#faq`;
    const imageUrl = `${baseUrl}/favicon.ico`;

    document.title = STAY_SEO_TITLE;
    setMeta("name", "description", STAY_SEO_DESCRIPTION);
    setMeta("name", "keywords", STAY_SEO_KEYWORDS);
    setLink("canonical", pageUrl);

    setMeta("property", "og:title", STAY_SEO_TITLE);
    setMeta("property", "og:description", STAY_SEO_DESCRIPTION);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "Appointza Stay");
    setMeta("property", "og:locale", "en_IN");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", STAY_SEO_TITLE);
    setMeta("name", "twitter:description", STAY_SEO_DESCRIPTION);

    injectJsonLd("stay-seo-software", buildStaySoftwareSchema(baseUrl, imageUrl));
    injectJsonLd("stay-seo-product", buildStayProductSchema(baseUrl, imageUrl));
    injectJsonLd("stay-seo-faq", buildStayFaqSchema(faqUrl));
    injectJsonLd("stay-seo-breadcrumb", buildStayBreadcrumbSchema(baseUrl));
    injectJsonLd("stay-seo-organization", buildStayOrganizationSchema(baseUrl));
    injectJsonLd("stay-seo-website", buildStayWebSiteSchema(baseUrl));

    return () => {
      for (const id of SCHEMA_IDS) {
        document.getElementById(id)?.remove();
      }
    };
  }, []);

  return null;
}
