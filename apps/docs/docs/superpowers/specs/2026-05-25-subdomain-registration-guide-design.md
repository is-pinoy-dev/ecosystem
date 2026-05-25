# Subdomain Registration Guide — Design Spec

**Date:** 2026-05-25  
**Author:** Jun Bosque  
**Status:** Approved

---

## Overview

Add a comprehensive, deeply-nested documentation guide to the `apps/docs` site covering how Filipino developers can register a free `*.is-pinoy.dev` subdomain. The guide targets users of the is-pinoy.dev platform — developers who want to point their portfolio at a memorable subdomain. The registration flow is PR-based: fork the `is-pinoy-dev/domains` GitHub repo, create a JSON file, validate it, and open a pull request.

---

## Content Structure

19 MDX pages across 5 sub-sections under `content/docs/register/`.

```
content/docs/register/
├── index.mdx
├── getting-started/
│   ├── index.mdx
│   ├── prerequisites.mdx
│   └── naming-rules.mdx
├── reference/
│   ├── index.mdx
│   ├── json-format.mdx
│   └── supported-records.mdx
├── providers/
│   ├── index.mdx
│   └── vercel.mdx
├── workflow/
│   ├── index.mdx
│   ├── fork-and-clone.mdx
│   ├── create-file.mdx
│   ├── validate.mdx
│   ├── open-pr.mdx
│   └── after-merge.mdx
└── troubleshooting/
    ├── index.mdx
    ├── ci-failures.mdx
    ├── dns-propagation.mdx
    └── common-errors.mdx
```

---

## Section Breakdown

### `register/index.mdx` — Overview
- What is-pinoy.dev is and who it's for
- Current scope: portfolio websites only
- 8-step quick summary (numbered list linking to workflow pages)
- Link to Discord for faster review

---

### `getting-started/`

**`index.mdx`**
- What the subdomain registry is
- The PR-based model explained (no UI, GitHub-native)
- Links to prerequisites and naming rules

**`prerequisites.mdx`**
- GitHub account required
- A live, deployed portfolio website (not under construction)
- A chosen subdomain in mind
- Git installed locally
- Node.js installed (for the validator)

**`naming-rules.mdx`**
- Allowed characters: `a-z`, `0-9`, `-`
- Length: 1–63 characters
- No leading or trailing hyphens
- One subdomain per person
- What gets rejected: non-portfolios, squatting, impersonation, reserved names, mismatched owner, invalid records
- Tip: use your GitHub username as your subdomain for easiest review

---

### `reference/`

**`index.mdx`**
- Overview of the reference section
- Links to json-format and supported-records

**`json-format.mdx`**
- Full schema reference for `subdomains/<name>.json`
- Field-by-field breakdown:
  - `$schema` — optional but recommended for IDE validation
  - `subdomain` — must match filename exactly, lowercase only
  - `owner.github` — must match the GitHub username opening the PR
  - `owner.email` — optional
  - `records` — object with one or more record type keys
- Complete annotated example (CNAME only)
- Complete annotated example (CNAME + TXT)
- Common mistakes table: trailing dot missing, filename mismatch, wrong github handle

**`supported-records.mdx`**
- Table: CNAME / A / TXT — use case, example value, notes
- CNAME: for hosted platforms (Vercel, Netlify, GitHub Pages) — value must end with `.`
- A record: for custom VPS/server — plain IPv4 address
- TXT: for domain verification — `provider` field required when source is Vercel
- Combining records: CNAME + TXT example
- When NOT to combine: A and CNAME cannot coexist on the same name

---

### `providers/`

**`index.mdx`**
- What a "provider guide" is (finding your CNAME/TXT values)
- The two values you're looking for: CNAME target, optional TXT verification string
- Provider list: Vercel (link). Note that more guides will be added.

**`vercel.mdx`**
- Prerequisites: project already deployed to Vercel, subdomain chosen
- Step 1: Open project → Settings → Domains
- Step 2: Add `yourname.is-pinoy.dev` in the domain input
- Step 3: Copy CNAME value (format: `xxxxxxxxxxxxxxxx.vercel-dns-017.com.`)
- Step 4: Copy TXT verification value if shown (format: `vc-domain-verify=...`)
- Step 5: JSON file examples — CNAME only, and CNAME + TXT
- Important notes: trailing dot, `"provider": "vercel"` required for TXT, Vercel "Invalid Configuration" is expected until PR merges

---

### `workflow/`

**`index.mdx`**
- Step map: 8 steps with one-line descriptions and links to each page
- Estimated time: ~10 minutes for a first-time registrant

**`fork-and-clone.mdx`** — Steps 1–2
- Go to `github.com/is-pinoy-dev/domains`, click Fork
- Select personal account as destination
- `git clone https://github.com/your-username/domains.git`
- `cd domains`

**`create-file.mdx`** — Steps 3–4
- Find DNS values first (link to providers section)
- Create `subdomains/yourname.json`
- Fill in the JSON (full example with all fields)
- Double-check checklist: filename matches subdomain field, github field matches account, trailing dot on CNAME

**`validate.mdx`** — Step 5
- Run `npx @is-pinoy-dev/validate ./subdomains/yourname.json`
- What success output looks like
- What failure output looks like
- Fix errors before continuing (link to troubleshooting/common-errors)

**`open-pr.mdx`** — Steps 6–7
- `git add subdomains/yourname.json`
- `git commit -m "Add yourname.is-pinoy.dev"`
- `git push origin main`
- Go to fork on GitHub → Compare & pull request
- PR title format: `Add yourname.is-pinoy.dev`
- Full PR body template (screenshot placeholder, technical checklist, terms checklist)
- Tip: post PR link in Discord for faster review

**`after-merge.mdx`** — Step 8
- What CI checks (JSON schema validation, owner.github match)
- What happens after merge: Cloudflare sync
- DNS propagation: usually minutes, up to 48 hours
- How to verify: `dig yourname.is-pinoy.dev CNAME` or online DNS checker
- What to do if it's been 48 hours and still not live (open a GitHub issue)

---

### `troubleshooting/`

**`index.mdx`**
- How to read CI failure comments on your PR
- Two main failure sources: schema validation, owner verification
- Links to specific pages

**`ci-failures.mdx`**
- Schema validation failed: what the error message looks like, how to fix
- `owner.github` mismatch: must exactly match the GitHub account that opened the PR (case-sensitive)
- How to push a fix to an open PR (just push a new commit, CI re-runs)

**`dns-propagation.mdx`**
- Vercel dashboard shows "Invalid Configuration" — this is expected, not an error on your end
- What DNS propagation is and why it takes time
- How to check propagation status: `dig` command, whatsmydns.net
- When to be concerned: 48+ hours after merge with no propagation

**`common-errors.mdx`**
- Missing trailing dot on CNAME value
- Filename does not match `subdomain` field
- `owner.github` is wrong casing or wrong username
- `"provider"` field missing on Vercel TXT record
- A and CNAME records both set on same subdomain

---

## Technical Notes

- **Framework:** Fumadocs 16.9.1 — folder-based MDX, sidebar auto-generated from directory structure
- **File format:** MDX with YAML frontmatter (`title`, `description`)
- **No meta.json needed** for basic ordering; can be added later to control sidebar sort order
- **URL mapping:** `content/docs/register/workflow/open-pr.mdx` → `/register/workflow/open-pr`
- **Source repo cross-links:** Each page should link to the relevant file in `github.com/is-pinoy-dev/domains` where applicable

---

## Out of Scope

- Provider guides for Netlify, GitHub Pages, or others (future work)
- Subdomain update/removal flow (future work)
- API-based or UI-based registration (does not exist — PR flow only)
