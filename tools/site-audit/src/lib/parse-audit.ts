import type { AuditResult, AuditField, AuditCategory, HeadingItem, LinkItem } from "@is-pinoy-dev/schemas";

function getMeta(doc: Document, name: string): string | null {
  return (
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null
  );
}

function getOg(doc: Document, property: string): string | null {
  return (
    doc
      .querySelector(`meta[property="${property}"]`)
      ?.getAttribute("content") ?? null
  );
}

function scoreCategory(fields: AuditField[]): AuditCategory {
  const passed = fields.filter((f) => f.status === "pass").length;
  return {
    score: Math.round((passed / fields.length) * 100),
    fields,
  };
}

export function parseAudit(html: string, url: string, xRobotsTag: string | null = null): AuditResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const titleText = doc.querySelector("title")?.textContent ?? null;
  const description = getMeta(doc, "description");
  const canonical =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const robots = getMeta(doc, "robots");
  const htmlLang = doc.documentElement.getAttribute("lang");
  const viewportMeta = getMeta(doc, "viewport");
  const charsetMeta =
    doc.querySelector("meta[charset]")?.getAttribute("charset") ??
    getMeta(doc, "charset");
  const hasJsonLd = doc.querySelector('script[type="application/ld+json"]') !== null;
  const favicon =
    doc.querySelector('link[rel="icon"]')?.getAttribute("href") ??
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ??
    null;
  const author = getMeta(doc, "author");

  const themeColor = getMeta(doc, "theme-color");
  const appleTouchIcon =
    doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ?? null;
  const manifest =
    doc.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null;
  const hreflang =
    doc.querySelector('link[rel="alternate"][hreflang]')?.getAttribute("hreflang") ?? null;
  const preloadHints = doc.querySelectorAll('link[rel="preload"]');
  const preloadHint = preloadHints.length > 0
    ? preloadHints.length === 1
      ? (preloadHints[0]?.getAttribute("href") ?? "1 preload hint found")
      : `${preloadHints.length} preload hints found`
    : null;

  const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
  const jsonLdText = jsonLdScript?.textContent ?? null;
  let jsonLdType: string | null = null;
  let jsonLdIsValid = false;
  if (jsonLdText) {
    try {
      const parsed = JSON.parse(jsonLdText) as Record<string, unknown> | unknown[];
      jsonLdIsValid = true;
      const first = Array.isArray(parsed) ? (parsed[0] as Record<string, unknown>) : parsed;
      jsonLdType = typeof first["@type"] === "string" ? first["@type"] : null;
    } catch {
      jsonLdIsValid = false;
    }
  }

  const keywords = getMeta(doc, "keywords");
  const publisher = getMeta(doc, "publisher");
  const wordCount = (() => {
    const bodyText = doc.body?.textContent ?? "";
    const words = bodyText.trim().split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  })();

  const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
  const headings: HeadingItem[] = [];
  const headingCounts: Record<string, number> = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (const tag of headingTags) {
    const els = doc.querySelectorAll(tag);
    headingCounts[tag] = els.length;
    for (const el of Array.from(els)) {
      headings.push({ tag, text: (el.textContent ?? "").trim() });
    }
  }

  const pageOrigin = (() => { try { return new URL(url).origin; } catch { return null; } })();
  const internalLinks: LinkItem[] = [];
  const externalLinks: LinkItem[] = [];
  const seenHrefs = new Set<string>();
  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const href = a.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const resolved = new URL(href, url);
      const normalizedHref = resolved.href;
      const item = { href: normalizedHref, text: (a.textContent ?? "").trim().slice(0, 120), rel: a.getAttribute("rel") };
      if (pageOrigin && resolved.origin === pageOrigin) { internalLinks.push(item); } else { externalLinks.push(item); }
      seenHrefs.add(normalizedHref);
    } catch {
      internalLinks.push({ href, text: (a.textContent ?? "").trim().slice(0, 120), rel: a.getAttribute("rel") });
      seenHrefs.add(href);
    }
  }
  const links = { total: internalLinks.length + externalLinks.length, unique: seenHrefs.size, internal: internalLinks.length, external: externalLinks.length, internalLinks, externalLinks };

  const imageList = Array.from(doc.querySelectorAll("img")).map((img) => ({
    src: img.getAttribute("src") ?? "",
    alt: img.getAttribute("alt"),
    title: img.getAttribute("title"),
  }));
  const imagesData = {
    total: imageList.length,
    withoutAlt: imageList.filter((i) => i.alt === null).length,
    withoutTitle: imageList.filter((i) => i.title === null).length,
    list: imageList,
  };

  const jsonLdSchemas = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map((script) => {
    const raw = script.textContent ?? "";
    try {
      const parsed = JSON.parse(raw) as unknown;
      const first = Array.isArray(parsed) ? (parsed[0] as Record<string, unknown>) : (parsed as Record<string, unknown>);
      const type = typeof first?.["@type"] === "string" ? first["@type"] : null;
      return { raw, type, isValid: true, parsed };
    } catch {
      return { raw, type: null, isValid: false, parsed: null };
    }
  });

  const hreflangLinks = Array.from(doc.querySelectorAll('link[rel="alternate"][hreflang]')).map((link) => ({
    lang: link.getAttribute("hreflang") ?? "",
    href: link.getAttribute("href") ?? "",
  }));

  const seoFields: AuditField[] = [
    { label: "URL", value: url, status: "pass" },
    ((): AuditField => {
      if (!titleText)
        return {
          label: "Title",
          value: null,
          status: "fail",
          message: "Missing <title> tag",
        };
      if (titleText.length < 10 || titleText.length > 60)
        return {
          label: "Title",
          value: titleText,
          status: "warn",
          message: `Length ${titleText.length} chars (expected 10–60)`,
        };
      return { label: "Title", value: titleText, status: "pass" };
    })(),
    ((): AuditField => {
      if (!description)
        return {
          label: "Meta Description",
          value: null,
          status: "fail",
          message: "Missing meta description",
        };
      if (description.length < 50 || description.length > 160)
        return {
          label: "Meta Description",
          value: description,
          status: "warn",
          message: `Length ${description.length} chars (expected 50–160)`,
        };
      return { label: "Meta Description", value: description, status: "pass" };
    })(),
    canonical
      ? { label: "Canonical URL", value: canonical, status: "pass" }
      : {
          label: "Canonical URL",
          value: null,
          status: "fail",
          message: "Missing canonical link",
        },
    robots
      ? { label: "Robots", value: robots, status: "pass" }
      : {
          label: "Robots",
          value: null,
          status: "warn",
          message: "No robots meta — search engines will use defaults",
        },
    xRobotsTag
      ? { label: "X-Robots-Tag", value: xRobotsTag, status: "pass" }
      : { label: "X-Robots-Tag", value: null, status: "warn", message: "No X-Robots-Tag header found" },
    keywords
      ? { label: "Keywords", value: keywords, status: "pass" }
      : { label: "Keywords", value: null, status: "warn", message: "No keywords meta tag" },
    publisher
      ? { label: "Publisher", value: publisher, status: "pass" }
      : { label: "Publisher", value: null, status: "warn", message: "No publisher meta tag" },
    ((): AuditField => {
      return {
        label: "Word Count",
        value: String(wordCount),
        status: wordCount > 300 ? "pass" : wordCount > 0 ? "warn" : "fail",
        message: wordCount <= 300 ? "Low word count — aim for 300+ words" : undefined,
      };
    })(),
    ((): AuditField => {
      const count = headingCounts.h1 ?? 0;
      if (count === 0)
        return { label: "H1 Count", value: "0", status: "fail", message: "No H1 found" };
      if (count > 1)
        return { label: "H1 Count", value: String(count), status: "warn", message: `${count} H1 tags found (expected 1)` };
      return { label: "H1 Count", value: String(count), status: "pass" };
    })(),
    { label: "H2 Count", value: String(headingCounts.h2 ?? 0), status: "pass" },
    { label: "H3 Count", value: String(headingCounts.h3 ?? 0), status: "pass" },
    { label: "H4 Count", value: String(headingCounts.h4 ?? 0), status: "pass" },
    { label: "H5 Count", value: String(headingCounts.h5 ?? 0), status: "pass" },
    { label: "H6 Count", value: String(headingCounts.h6 ?? 0), status: "pass" },
    ((): AuditField => {
      if (!htmlLang)
        return {
          label: "HTML lang",
          value: null,
          status: "fail",
          message: "Missing lang attribute on <html>",
        };
      return { label: "HTML lang", value: htmlLang, status: "pass" };
    })(),
    ((): AuditField => {
      if (!viewportMeta)
        return {
          label: "Viewport",
          value: null,
          status: "fail",
          message: "Missing viewport meta tag",
        };
      return { label: "Viewport", value: viewportMeta, status: "pass" };
    })(),
    ((): AuditField => {
      if (!charsetMeta)
        return {
          label: "Charset",
          value: null,
          status: "warn",
          message: "Missing charset declaration",
        };
      return { label: "Charset", value: charsetMeta, status: "pass" };
    })(),
    ((): AuditField => {
      if (!hasJsonLd)
        return {
          label: "Structured Data",
          value: null,
          status: "warn",
          message: "No JSON-LD structured data found",
        };
      return { label: "Structured Data", value: "JSON-LD present", status: "pass" };
    })(),
    favicon
      ? { label: "Favicon", value: favicon, status: "pass" }
      : {
          label: "Favicon",
          value: null,
          status: "warn",
          message: "No favicon link found",
        },
    author
      ? { label: "Author", value: author, status: "pass" }
      : {
          label: "Author",
          value: null,
          status: "warn",
          message: "No author meta tag",
        },
    ((): AuditField => {
      if (imagesData.total === 0)
        return { label: "Image Alt Texts", value: "No images", status: "pass" };
      if (imagesData.withoutAlt > 0)
        return {
          label: "Image Alt Texts",
          value: `${imagesData.withoutAlt}/${imagesData.total} missing`,
          status: imagesData.withoutAlt === imagesData.total ? "fail" : "warn",
          message: `${imagesData.withoutAlt} image(s) missing alt attribute`,
        };
      return {
        label: "Image Alt Texts",
        value: `${imagesData.total} image(s) all have alt`,
        status: "pass",
      };
    })(),
    themeColor
      ? { label: "theme-color", value: themeColor, status: "pass" }
      : { label: "theme-color", value: null, status: "fail", message: "Missing theme-color meta tag" },
    appleTouchIcon
      ? { label: "apple-touch-icon", value: appleTouchIcon, status: "pass" }
      : { label: "apple-touch-icon", value: null, status: "fail", message: "Missing apple-touch-icon link" },
    manifest
      ? { label: "manifest", value: manifest, status: "pass" }
      : { label: "manifest", value: null, status: "fail", message: "Missing web app manifest link" },
    hreflang
      ? { label: "hreflang", value: hreflang, status: "pass" }
      : { label: "hreflang", value: null, status: "warn", message: "No hreflang alternate links — add if serving multiple languages/regions" },
    preloadHint
      ? { label: "preload hints", value: preloadHint, status: "pass" }
      : { label: "preload hints", value: null, status: "warn", message: "No preload hints found — consider preloading critical fonts or images" },
    ((): AuditField => {
      const KNOWN_TYPES = ["Article", "FAQPage", "Product", "WebSite", "Organization", "LocalBusiness", "BreadcrumbList"];
      if (!jsonLdText)
        return { label: "JSON-LD type", value: null, status: "fail", message: "No JSON-LD found — add structured data first" };
      if (!jsonLdType || !KNOWN_TYPES.includes(jsonLdType))
        return { label: "JSON-LD type", value: jsonLdType ?? "unknown", status: "warn", message: `@type "${jsonLdType ?? "not set"}" is not a recognised rich-result type` };
      return { label: "JSON-LD type", value: jsonLdType, status: "pass" };
    })(),
    ((): AuditField => {
      if (!jsonLdText)
        return { label: "JSON-LD valid", value: null, status: "fail", message: "No JSON-LD script found" };
      if (!jsonLdIsValid)
        return { label: "JSON-LD valid", value: null, status: "fail", message: "JSON-LD script contains invalid JSON" };
      return { label: "JSON-LD valid", value: "Valid JSON", status: "pass" };
    })(),
  ];

  const ogFields: AuditField[] = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
    "og:locale",
    "og:site_name",
  ].map((prop): AuditField => {
    const value = getOg(doc, prop);
    const optional = prop === "og:locale" || prop === "og:site_name";
    return value
      ? { label: prop, value, status: "pass" }
      : {
          label: prop,
          value: null,
          status: optional ? "warn" : "fail",
          message: `Missing ${prop}`,
        };
  });

  const twitterFields: AuditField[] = [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:site",
  ].map((name): AuditField => {
    const value = getMeta(doc, name);
    const optional = name === "twitter:site";
    return value
      ? { label: name, value, status: "pass" }
      : {
          label: name,
          value: null,
          status: optional ? "warn" : "fail",
          message: `Missing ${name}`,
        };
  });

  return {
    url,
    auditedAt: new Date().toISOString(),
    seo: scoreCategory(seoFields),
    og: scoreCategory([...ogFields, ...twitterFields]),
    details: {
      wordCount,
      keywords,
      publisher,
      xRobotsTag,
      headings,
      headingCounts,
      links,
      images: imagesData,
      jsonLdSchemas,
      hreflangLinks,
    },
  };
}
