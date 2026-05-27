import type { AuditResult, AuditField, AuditCategory } from "@is-pinoy-dev/schemas";

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

export function parseAudit(html: string, url: string): AuditResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const titleText = doc.querySelector("title")?.textContent ?? null;
  const description = getMeta(doc, "description");
  const canonical =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const robots = getMeta(doc, "robots");
  const h1s = doc.querySelectorAll("h1");
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
  const images = Array.from(doc.querySelectorAll("img"));
  const imagesWithoutAlt = images.filter(
    (img) => !img.getAttribute("alt") && img.getAttribute("alt") !== ""
  );

  const seoFields: AuditField[] = [
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
    ((): AuditField => {
      if (h1s.length === 0)
        return {
          label: "H1 Tag",
          value: null,
          status: "fail",
          message: "No H1 found",
        };
      if (h1s.length > 1)
        return {
          label: "H1 Tag",
          value: `${h1s.length} found`,
          status: "warn",
          message: `${h1s.length} H1 tags found (expected 1)`,
        };
      return { label: "H1 Tag", value: h1s[0]?.textContent ?? "", status: "pass" };
    })(),
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
      if (images.length === 0)
        return { label: "Image Alt Texts", value: "No images", status: "pass" };
      if (imagesWithoutAlt.length > 0)
        return {
          label: "Image Alt Texts",
          value: `${imagesWithoutAlt.length}/${images.length} missing`,
          status: imagesWithoutAlt.length === images.length ? "fail" : "warn",
          message: `${imagesWithoutAlt.length} image(s) missing alt attribute`,
        };
      return {
        label: "Image Alt Texts",
        value: `${images.length} image(s) all have alt`,
        status: "pass",
      };
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
  };
}
