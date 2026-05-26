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
          status: "fail",
          message: "Missing robots meta tag",
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
      return { label: "H1 Tag", value: h1s[0].textContent ?? "", status: "pass" };
    })(),
  ];

  const ogFields: AuditField[] = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
  ].map((prop): AuditField => {
    const value = getOg(doc, prop);
    return value
      ? { label: prop, value, status: "pass" }
      : { label: prop, value: null, status: "fail", message: `Missing ${prop}` };
  });

  const twitterFields: AuditField[] = [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ].map((name): AuditField => {
    const value = getMeta(doc, name);
    return value
      ? { label: name, value, status: "pass" }
      : {
          label: name,
          value: null,
          status: "fail",
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
