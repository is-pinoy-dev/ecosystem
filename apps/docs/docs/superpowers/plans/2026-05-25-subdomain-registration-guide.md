# Subdomain Registration Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 19 MDX pages under `content/docs/register/` that guide Filipino developers through registering a free `*.is-pinoy.dev` subdomain via a GitHub PR-based flow.

**Architecture:** Deeply nested Fumadocs MDX — folder hierarchy drives sidebar navigation automatically. No application code changes required; all work is content creation. Pages are grouped into 5 sub-sections: `getting-started/`, `reference/`, `providers/`, `workflow/`, and `troubleshooting/`.

**Tech Stack:** Fumadocs 16.9.1, MDX, Next.js 16 App Router, fumadocs-ui components (`<Cards>`, `<Card>`, `<Callout>`, `<Steps>`, `<Step>`, `<Tabs>`, `<Tab>`)

---

## File Map

**Create (all new):**
- `content/docs/register/index.mdx`
- `content/docs/register/getting-started/index.mdx`
- `content/docs/register/getting-started/prerequisites.mdx`
- `content/docs/register/getting-started/naming-rules.mdx`
- `content/docs/register/reference/index.mdx`
- `content/docs/register/reference/json-format.mdx`
- `content/docs/register/reference/supported-records.mdx`
- `content/docs/register/providers/index.mdx`
- `content/docs/register/providers/vercel.mdx`
- `content/docs/register/workflow/index.mdx`
- `content/docs/register/workflow/fork-and-clone.mdx`
- `content/docs/register/workflow/create-file.mdx`
- `content/docs/register/workflow/validate.mdx`
- `content/docs/register/workflow/open-pr.mdx`
- `content/docs/register/workflow/after-merge.mdx`
- `content/docs/register/troubleshooting/index.mdx`
- `content/docs/register/troubleshooting/ci-failures.mdx`
- `content/docs/register/troubleshooting/dns-propagation.mdx`
- `content/docs/register/troubleshooting/common-errors.mdx`

All paths are relative to `apps/docs/`.

---

## Verification Method

There are no unit tests for MDX content. Verification for each task is:

1. Run the dev server from `apps/docs/`: `pnpm dev`
2. Open `http://localhost:3000` in a browser
3. Confirm the new pages appear in the sidebar and render without errors
4. Check that links between pages resolve correctly

You only need to start the dev server once. Leave it running across tasks.

---

## Task 1: Section entry point — `register/index.mdx`

**Files:**
- Create: `content/docs/register/index.mdx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p apps/docs/content/docs/register
```

Create `apps/docs/content/docs/register/index.mdx`:

```mdx
---
title: Register a Subdomain
description: Get a free *.is-pinoy.dev subdomain for your portfolio.
---

**is-pinoy.dev** offers free `*.is-pinoy.dev` subdomains to Filipino developers. Point your portfolio at a subdomain that represents where you're from.

> **Note:** We currently only accept **portfolio websites**. Side projects and other use cases will open in the future.

## How it works

Registration is GitHub-native — no dashboard, no form. You fork a repository, add a JSON file describing your subdomain, and open a pull request. Once a maintainer merges it, your subdomain goes live.

## Quick start

<Steps>
  <Step>
    **[Check prerequisites](/register/getting-started/prerequisites)** — GitHub account, live portfolio, Node.js
  </Step>
  <Step>
    **[Choose a subdomain](/register/getting-started/naming-rules)** — learn the naming rules
  </Step>
  <Step>
    **[Find your DNS values](/register/providers)** — get the CNAME (and optional TXT) from your hosting provider
  </Step>
  <Step>
    **[Fork and clone](/register/workflow/fork-and-clone)** — get a local copy of the domains repository
  </Step>
  <Step>
    **[Create your JSON file](/register/workflow/create-file)** — describe your subdomain and DNS records
  </Step>
  <Step>
    **[Validate](/register/workflow/validate)** — catch errors before opening a PR
  </Step>
  <Step>
    **[Open a pull request](/register/workflow/open-pr)** — submit your subdomain for review
  </Step>
  <Step>
    **[Wait for merge](/register/workflow/after-merge)** — CI runs, a maintainer reviews, DNS goes live
  </Step>
</Steps>

## Want a faster review?

Post your PR link in our [Discord](https://discord.com/channels/1507758007218471062/1507758194624299039) and a maintainer will pick it up sooner.
```

- [ ] **Step 2: Verify in browser**

Start the dev server if not already running:
```bash
cd apps/docs && pnpm dev
```

Open `http://localhost:3000`. Confirm:
- "Register a Subdomain" appears in the sidebar
- The page renders with the Steps component
- All 8 links are clickable (they'll 404 for now — that's fine)

- [ ] **Step 3: Commit**

```bash
git add apps/docs/content/docs/register/index.mdx
git commit -m "docs(register): add section entry point"
```

---

## Task 2: Getting Started section

**Files:**
- Create: `content/docs/register/getting-started/index.mdx`
- Create: `content/docs/register/getting-started/prerequisites.mdx`
- Create: `content/docs/register/getting-started/naming-rules.mdx`

- [ ] **Step 1: Create `getting-started/index.mdx`**

```bash
mkdir -p apps/docs/content/docs/register/getting-started
```

Create `apps/docs/content/docs/register/getting-started/index.mdx`:

```mdx
---
title: Getting Started
description: What you need to know before registering a subdomain.
---

Before you register, read through the two short pages in this section:

<Cards>
  <Card title="Prerequisites" href="/register/getting-started/prerequisites" description="What you need before you start — GitHub account, live portfolio, and local tools." />
  <Card title="Naming Rules" href="/register/getting-started/naming-rules" description="Allowed characters, length limits, and what kinds of requests get rejected." />
</Cards>

Once you've reviewed both, head to [Provider Guides](/register/providers) to find the DNS values for your hosting platform.
```

- [ ] **Step 2: Create `getting-started/prerequisites.mdx`**

Create `apps/docs/content/docs/register/getting-started/prerequisites.mdx`:

```mdx
---
title: Prerequisites
description: Everything you need before you start the registration process.
---

Make sure you have all of the following before opening a pull request.

## A GitHub account

Registration is done by opening a pull request on GitHub. You need a GitHub account, and the `owner.github` field in your JSON file must match your GitHub username exactly.

If you don't have one, [sign up at github.com](https://github.com/join).

## A live, deployed portfolio website

Your subdomain must point to something real and active. We don't accept:

- Sites that are under construction or returning a 404
- Placeholder pages with no content
- Non-portfolio projects (for now — this will change in the future)

Deploy your portfolio first, then come back to register your subdomain.

## Your hosting provider's DNS values

You'll need the CNAME record value (and sometimes a TXT verification record) from your hosting provider before you create your JSON file.

See the [Provider Guides](/register/providers) section for step-by-step instructions on finding these values.

## Git installed locally

You'll need Git to clone your fork and push your changes.

Check if it's installed:
```bash
git --version
```

If not installed, download it from [git-scm.com](https://git-scm.com).

## Node.js installed locally

The JSON validator runs via `npx`, which requires Node.js.

Check if it's installed:
```bash
node --version
```

If not installed, download it from [nodejs.org](https://nodejs.org). Any version 18 or newer works.

---

Once you have everything above, continue to [Naming Rules](/register/getting-started/naming-rules).
```

- [ ] **Step 3: Create `getting-started/naming-rules.mdx`**

Create `apps/docs/content/docs/register/getting-started/naming-rules.mdx`:

```mdx
---
title: Naming Rules
description: Rules for choosing a valid is-pinoy.dev subdomain.
---

Your subdomain must follow these rules to pass validation and review.

## Allowed characters

| Rule | Valid | Invalid |
|------|-------|---------|
| Lowercase letters only | `juan` | `Juan` |
| Numbers allowed | `juan2` | — |
| Hyphens allowed | `juan-dev` | — |
| No underscores | — | `juan_dev` |
| No dots | — | `juan.dev` |
| No leading hyphen | — | `-juan` |
| No trailing hyphen | — | `juan-` |

In regular expression form: `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`

## Length

Between **1 and 63 characters** (the standard DNS label limit).

## One subdomain per person

Each GitHub account may register one subdomain. If you already have one and want to change it, open a GitHub issue on the [domains repository](https://github.com/is-pinoy-dev/domains).

## What gets rejected

Pull requests will be closed if the subdomain:

- **Does not point to a portfolio** — only portfolio websites are accepted for now
- **Squats a name** — registering a subdomain you have no intention of using
- **Impersonates someone** — using another person's name, handle, or brand
- **Uses reserved names** — certain names are reserved by maintainers (e.g. `www`, `api`, `mail`)
- **Has a mismatched owner** — `owner.github` must match the GitHub account opening the PR
- **Fails schema validation** — records that don't pass the JSON schema

## Tip: use your GitHub username

Using your GitHub username as your subdomain (e.g. `juandelacruz.is-pinoy.dev` for GitHub user `juandelacruz`) makes review faster because the `owner.github` check passes trivially.

---

Ready to continue? Head to [Provider Guides](/register/providers) to find the DNS values for your hosting platform.
```

- [ ] **Step 4: Verify in browser**

Check `http://localhost:3000/register/getting-started`. Confirm:
- Three pages appear under "Getting Started" in the sidebar
- The Cards component on the index page renders with working links
- The tables in `naming-rules` render correctly

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content/docs/register/getting-started/
git commit -m "docs(register): add getting-started section"
```

---

## Task 3: Reference section

**Files:**
- Create: `content/docs/register/reference/index.mdx`
- Create: `content/docs/register/reference/json-format.mdx`
- Create: `content/docs/register/reference/supported-records.mdx`

- [ ] **Step 1: Create `reference/index.mdx`**

```bash
mkdir -p apps/docs/content/docs/register/reference
```

Create `apps/docs/content/docs/register/reference/index.mdx`:

```mdx
---
title: Reference
description: Technical specifications for the subdomain JSON format and supported DNS record types.
---

This section is your technical reference. Bookmark it while filling in your JSON file.

<Cards>
  <Card title="JSON Format" href="/register/reference/json-format" description="Every field in the subdomain JSON file, with examples and validation rules." />
  <Card title="Supported Records" href="/register/reference/supported-records" description="CNAME, A, and TXT records — when to use each and how to format the values." />
</Cards>
```

- [ ] **Step 2: Create `reference/json-format.mdx`**

Create `apps/docs/content/docs/register/reference/json-format.mdx`:

```mdx
---
title: JSON Format
description: Complete reference for the subdomain JSON file format.
---

Each subdomain is described by a single JSON file at `subdomains/<your-subdomain>.json` in the [domains repository](https://github.com/is-pinoy-dev/domains).

## Full example

```json
{
  "$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
  "subdomain": "yourname",
  "owner": {
    "github": "your-github-username",
    "email": "you@example.com"
  },
  "records": {
    "CNAME": {
      "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
    }
  }
}
```

## Field reference

### `$schema`

```json
"$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json"
```

Optional but recommended. Adding this field enables JSON schema validation in editors like VS Code — you'll see inline errors as you type.

---

### `subdomain`

```json
"subdomain": "yourname"
```

**Required.** The name you want before `.is-pinoy.dev`. Must:
- Match the filename exactly (e.g. `yourname.json` → `"subdomain": "yourname"`)
- Be lowercase alphanumeric with hyphens only
- Be between 1 and 63 characters

See [Naming Rules](/register/getting-started/naming-rules) for the full character rules.

---

### `owner.github`

```json
"owner": {
  "github": "your-github-username"
}
```

**Required.** Must exactly match the GitHub username of the account opening the pull request. CI will reject the PR if these don't match.

<Callout type="warn">
  This is case-sensitive. `JuanDeLaCruz` and `juandelacruz` are different values. Use your username exactly as it appears on GitHub.
</Callout>

---

### `owner.email`

```json
"owner": {
  "github": "your-github-username",
  "email": "you@example.com"
}
```

**Optional.** Used by maintainers to contact you if there's an issue with your subdomain. Never exposed publicly.

---

### `records`

```json
"records": {
  "CNAME": {
    "value": "yoursite.vercel.app."
  }
}
```

**Required.** Must contain at least one valid record. Supported keys: `CNAME`, `A`, `TXT`. See [Supported Records](/register/reference/supported-records) for details on each type.

## Common mistakes

| Mistake | Example of wrong value | Correct value |
|---------|----------------------|---------------|
| Filename doesn't match `subdomain` field | File: `juan.json`, field: `"subdomain": "juan-dev"` | File and field must both be `juan` or both `juan-dev` |
| `owner.github` is wrong casing | `"github": "JuanDeLaCruz"` when GitHub username is `juandelacruz` | Match exactly as shown on GitHub |
| Missing trailing dot on CNAME | `"value": "yoursite.vercel.app"` | `"value": "yoursite.vercel.app."` |
| `email` field in wrong place | `"email": "..."` at top level | Must be inside `"owner": {}` |
```

- [ ] **Step 3: Create `reference/supported-records.mdx`**

Create `apps/docs/content/docs/register/reference/supported-records.mdx`:

```mdx
---
title: Supported Records
description: DNS record types you can use in your subdomain JSON file.
---

Your `records` object can contain one or more of the following DNS record types.

## Overview

| Type | Use case | Example value |
|------|----------|---------------|
| `CNAME` | Hosted platforms (Vercel, Netlify, GitHub Pages) | `yoursite.vercel.app.` |
| `A` | Custom server or VPS | `203.0.113.1` |
| `TXT` | Domain verification (e.g. Google Search Console, Vercel) | `google-site-verification=...` |

## CNAME

Use this when your portfolio is hosted on a platform like Vercel, Netlify, or GitHub Pages. The platform gives you a hostname to point at.

```json
"records": {
  "CNAME": {
    "value": "yoursite.vercel.app."
  }
}
```

<Callout type="warn">
  The CNAME value **must end with a trailing dot** (`.`). This is standard DNS notation for a fully-qualified domain name. Your hosting provider will show the value with the dot — keep it.
</Callout>

## A record

Use this when your portfolio is running on a custom server or VPS and you want to point the subdomain directly at an IP address.

```json
"records": {
  "A": {
    "value": "203.0.113.1"
  }
}
```

The value must be a valid IPv4 address.

<Callout type="info">
  A records do not get a trailing dot. Only CNAME values use the trailing dot.
</Callout>

## TXT

Used for domain verification — most commonly when a platform (like Vercel or Google) needs to confirm you own the domain before it will serve traffic.

```json
"records": {
  "TXT": {
    "value": "google-site-verification=abc123"
  }
}
```

When the TXT record comes from Vercel, you must also include the `provider` field:

```json
"records": {
  "TXT": {
    "value": "vc-domain-verify=yourname.is-pinoy.dev,abc123",
    "provider": "vercel"
  }
}
```

<Callout type="warn">
  The `"provider": "vercel"` field is **required** whenever you add a TXT record from Vercel. The validator will fail without it.
</Callout>

## Combining records

You can include multiple record types in one file. The most common combination is CNAME + TXT for platforms that require domain verification alongside the primary DNS record.

```json
"records": {
  "CNAME": {
    "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
  },
  "TXT": {
    "value": "vc-domain-verify=yourname.is-pinoy.dev,abc123",
    "provider": "vercel"
  }
}
```

## What you cannot combine

You **cannot** use `A` and `CNAME` together on the same subdomain. These record types are mutually exclusive in DNS — a name can either be an alias (CNAME) or a direct address (A), not both.

If you try to include both, the validator will reject your file.
```

- [ ] **Step 4: Verify in browser**

Check `http://localhost:3000/register/reference`. Confirm:
- Three pages under "Reference" in sidebar
- `json-format` page renders all Callout components correctly
- `supported-records` page renders all code blocks and Callouts correctly

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content/docs/register/reference/
git commit -m "docs(register): add reference section"
```

---

## Task 4: Providers section

**Files:**
- Create: `content/docs/register/providers/index.mdx`
- Create: `content/docs/register/providers/vercel.mdx`

- [ ] **Step 1: Create `providers/index.mdx`**

```bash
mkdir -p apps/docs/content/docs/register/providers
```

Create `apps/docs/content/docs/register/providers/index.mdx`:

```mdx
---
title: Provider Guides
description: Step-by-step guides for finding your DNS values on popular hosting platforms.
---

Before you create your subdomain JSON file, you need two values from your hosting provider:

1. **CNAME value** — a hostname your provider gives you (e.g. `xxxxxxxxxxxxxxxx.vercel-dns-017.com.`)
2. **TXT verification value** — a string some providers show for domain ownership verification (not always required)

Select your hosting platform below:

<Cards>
  <Card title="Vercel" href="/register/providers/vercel" description="Find your CNAME and TXT values from your Vercel project's Domains settings." />
</Cards>

<Callout type="info">
  More provider guides (Netlify, GitHub Pages, and others) will be added in the future. If your platform isn't listed, look for a "Custom Domain" or "Domains" settings page in your provider's dashboard — it will show you a CNAME or A record to configure.
</Callout>

Once you have your DNS values, continue to [Create Your JSON File](/register/workflow/create-file).
```

- [ ] **Step 2: Create `providers/vercel.mdx`**

Create `apps/docs/content/docs/register/providers/vercel.mdx`:

```mdx
---
title: Vercel
description: How to find your DNS values from Vercel to register an is-pinoy.dev subdomain.
---

This guide walks you through finding the CNAME and TXT values you need from Vercel.

## Prerequisites

- Your portfolio is already deployed on Vercel
- You have chosen a subdomain (e.g. `yourname.is-pinoy.dev`)

---

<Steps>
  <Step>
    ## Open your project's Domain settings

    1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) and sign in
    2. Click on your portfolio project
    3. Click the **Settings** tab
    4. In the left sidebar, click **Domains**
  </Step>
  <Step>
    ## Add your is-pinoy.dev subdomain

    In the domain input field, type your full subdomain:

    ```
    yourname.is-pinoy.dev
    ```

    Click **Add**. Vercel will display a panel showing the DNS records you need to configure.
  </Step>
  <Step>
    ## Copy your CNAME value

    Vercel will show a **CNAME** record with a value that looks like:

    ```
    xxxxxxxxxxxxxxxx.vercel-dns-017.com.
    ```

    This value is unique to your project. Copy it exactly — you will paste it into your JSON file.

    <Callout type="warn">
      The value ends with a dot (`.`). Vercel shows it this way intentionally — keep the dot when you paste it into your JSON file.
    </Callout>
  </Step>
  <Step>
    ## Copy your TXT verification value (if shown)

    Vercel sometimes also displays a **TXT** record for domain ownership verification:

    ```
    vc-domain-verify=yourname.is-pinoy.dev,abc123
    ```

    If Vercel shows this record, copy the full value. If it does not appear, skip this step — it is not always required.
  </Step>
  <Step>
    ## Create your subdomain JSON file

    Now that you have your DNS values, go to [Create Your JSON File](/register/workflow/create-file) to add them to your file.

    For reference, here is what your JSON should look like depending on which records Vercel showed you:

    <Tabs items={["CNAME only", "CNAME + TXT"]}>
      <Tab value="CNAME only">
        ```json
        {
          "$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
          "subdomain": "yourname",
          "owner": {
            "github": "your-github-username"
          },
          "records": {
            "CNAME": {
              "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
            }
          }
        }
        ```
      </Tab>
      <Tab value="CNAME + TXT">
        ```json
        {
          "$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
          "subdomain": "yourname",
          "owner": {
            "github": "your-github-username"
          },
          "records": {
            "CNAME": {
              "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
            },
            "TXT": {
              "value": "vc-domain-verify=yourname.is-pinoy.dev,abc123",
              "provider": "vercel"
            }
          }
        }
        ```
      </Tab>
    </Tabs>

    Replace `yourname`, `your-github-username`, and the record values with your actual information.
  </Step>
</Steps>

## Important notes

- **Trailing dot** — the CNAME value must end with `.` exactly as Vercel shows it
- **`"provider": "vercel"`** — required whenever you include a TXT record from Vercel; validation will fail without it
- **"Invalid Configuration" on Vercel's dashboard** — Vercel will show this warning until your PR is merged and DNS has propagated. This is expected. Vercel cannot verify the record until it's live.

---

Once your JSON file is ready, proceed to [Validate](/register/workflow/validate).
```

- [ ] **Step 3: Verify in browser**

Check `http://localhost:3000/register/providers`. Confirm:
- Two pages under "Providers" in sidebar
- Vercel page renders `<Steps>` and `<Tabs>` components correctly
- Tabs switch between "CNAME only" and "CNAME + TXT" examples

- [ ] **Step 4: Commit**

```bash
git add apps/docs/content/docs/register/providers/
git commit -m "docs(register): add providers section"
```

---

## Task 5: Workflow section — Steps 1–5

**Files:**
- Create: `content/docs/register/workflow/index.mdx`
- Create: `content/docs/register/workflow/fork-and-clone.mdx`
- Create: `content/docs/register/workflow/create-file.mdx`
- Create: `content/docs/register/workflow/validate.mdx`

- [ ] **Step 1: Create `workflow/index.mdx`**

```bash
mkdir -p apps/docs/content/docs/register/workflow
```

Create `apps/docs/content/docs/register/workflow/index.mdx`:

```mdx
---
title: Workflow
description: The full eight-step process for registering an is-pinoy.dev subdomain.
---

Registration takes about 10 minutes for a first-time contributor.

## Step map

| Step | Page | What you do |
|------|------|-------------|
| 1–2 | [Fork & Clone](/register/workflow/fork-and-clone) | Fork the domains repo on GitHub and clone it locally |
| 3–4 | [Create Your File](/register/workflow/create-file) | Create `subdomains/<name>.json` with your DNS records |
| 5 | [Validate](/register/workflow/validate) | Run the validator to catch errors before opening a PR |
| 6–7 | [Open a PR](/register/workflow/open-pr) | Commit, push, and open a pull request |
| 8 | [After Merge](/register/workflow/after-merge) | CI runs, maintainer reviews, DNS goes live |

Start with [Fork & Clone](/register/workflow/fork-and-clone).
```

- [ ] **Step 2: Create `workflow/fork-and-clone.mdx`**

Create `apps/docs/content/docs/register/workflow/fork-and-clone.mdx`:

```mdx
---
title: Fork & Clone
description: Steps 1–2 — Fork the domains repository on GitHub and clone it to your machine.
---

## Step 1: Fork the repository

1. Go to [github.com/is-pinoy-dev/domains](https://github.com/is-pinoy-dev/domains)
2. Click the **Fork** button in the top-right corner
3. Select your personal GitHub account as the destination

You now have your own copy of the repository at `https://github.com/your-username/domains`.

---

## Step 2: Clone your fork

```bash
git clone https://github.com/your-username/domains.git
cd domains
```

Replace `your-username` with your actual GitHub username.

---

Next: [Create Your JSON File](/register/workflow/create-file)
```

- [ ] **Step 3: Create `workflow/create-file.mdx`**

Create `apps/docs/content/docs/register/workflow/create-file.mdx`:

```mdx
---
title: Create Your JSON File
description: Steps 3–4 — Create subdomains/<name>.json and fill in your DNS records.
---

## Step 3: Find your DNS values

Before creating your file, you need the CNAME value (and sometimes a TXT value) from your hosting provider.

See the [Provider Guides](/register/providers) section and follow the guide for your platform. Come back here once you have your values.

---

## Step 4: Create your subdomain file

Create a new file at `subdomains/<your-subdomain>.json` inside the repository you cloned.

```bash
touch subdomains/yourname.json
```

Replace `yourname` with the subdomain you want (e.g. `juan` for `juan.is-pinoy.dev`).

Open the file and fill it in:

<Tabs items={["CNAME only", "CNAME + TXT"]}>
  <Tab value="CNAME only">
    ```json
    {
      "$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
      "subdomain": "yourname",
      "owner": {
        "github": "your-github-username"
      },
      "records": {
        "CNAME": {
          "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
        }
      }
    }
    ```
  </Tab>
  <Tab value="CNAME + TXT">
    ```json
    {
      "$schema": "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
      "subdomain": "yourname",
      "owner": {
        "github": "your-github-username"
      },
      "records": {
        "CNAME": {
          "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
        },
        "TXT": {
          "value": "vc-domain-verify=yourname.is-pinoy.dev,abc123",
          "provider": "vercel"
        }
      }
    }
    ```
  </Tab>
</Tabs>

Replace `yourname`, `your-github-username`, and the record values with your actual information.

## Before you continue — checklist

<Callout type="warn">
  Double-check all three of these before running the validator:
  - The **filename** (`yourname.json`) matches the **`subdomain` field** (`"subdomain": "yourname"`) exactly
  - **`owner.github`** matches your GitHub username exactly (case-sensitive)
  - The **CNAME value ends with a trailing dot** (`.`)
</Callout>

---

Next: [Validate](/register/workflow/validate)
```

- [ ] **Step 4: Create `workflow/validate.mdx`**

Create `apps/docs/content/docs/register/workflow/validate.mdx`:

```mdx
---
title: Validate
description: Step 5 — Run the validator to catch errors before opening a PR.
---

## Step 5: Validate your file

Run the validator against your JSON file:

```bash
npx @is-pinoy-dev/validate ./subdomains/yourname.json
```

Replace `yourname` with your subdomain.

## What success looks like

```
✔ Schema valid
✔ Subdomain matches filename
✔ owner.github present
✔ Records valid

yourname.is-pinoy.dev is ready to submit.
```

If you see output like this, your file is valid. Move on to [Open a PR](/register/workflow/open-pr).

## What failure looks like

```
✖ CNAME value must end with a trailing dot (e.g. "yoursite.vercel.app.")
```

The validator outputs one error per line with a description of what's wrong. Fix each error and re-run the validator until it passes.

<Callout type="info">
  For a full list of validation errors and how to fix them, see [Common Errors](/register/troubleshooting/common-errors).
</Callout>

---

Next: [Open a PR](/register/workflow/open-pr)
```

- [ ] **Step 5: Verify in browser**

Check `http://localhost:3000/register/workflow`. Confirm:
- Four pages under "Workflow" in sidebar (index, fork-and-clone, create-file, validate)
- Tabs on `create-file` and `validate` pages render correctly
- Callout on `create-file` page renders with warning styling

- [ ] **Step 6: Commit**

```bash
git add apps/docs/content/docs/register/workflow/index.mdx \
        apps/docs/content/docs/register/workflow/fork-and-clone.mdx \
        apps/docs/content/docs/register/workflow/create-file.mdx \
        apps/docs/content/docs/register/workflow/validate.mdx
git commit -m "docs(register): add workflow steps 1-5"
```

---

## Task 6: Workflow section — Steps 6–8

**Files:**
- Create: `content/docs/register/workflow/open-pr.mdx`
- Create: `content/docs/register/workflow/after-merge.mdx`

- [ ] **Step 1: Create `workflow/open-pr.mdx`**

Create `apps/docs/content/docs/register/workflow/open-pr.mdx`:

```mdx
---
title: Open a PR
description: Steps 6–7 — Commit your file, push to your fork, and open a pull request.
---

## Step 6: Commit and push

```bash
git add subdomains/yourname.json
git commit -m "Add yourname.is-pinoy.dev"
git push origin main
```

Replace `yourname` with your subdomain.

---

## Step 7: Open a pull request

1. Go to your fork on GitHub: `https://github.com/your-username/domains`
2. GitHub will show a **Compare & pull request** banner after your push — click it
3. Confirm that the base repository is `is-pinoy-dev/domains` and the base branch is `main`
4. Fill in the PR title and body using the templates below

### PR title

```
Add yourname.is-pinoy.dev
```

### PR body template

Copy and fill in this template:

```markdown
## Subdomain Registration

**Subdomain:** `yourname.is-pinoy.dev`

### Website Screenshot

<!-- Attach a screenshot of your portfolio website here -->

### Technical Checklist

- [x] Filename and `subdomain` field in JSON both match your subdomain
- [x] `owner.github` matches my GitHub username
- [x] At least one valid record (`CNAME`, `A`, or `TXT`)
- [x] CNAME value ends with a trailing dot (e.g. `yoursite.vercel.app.`)
- [x] The subdomain points to something real and active

### Terms

- [x] My subdomain points to a **portfolio website**
- [x] I agree to the Terms of Service
- [x] I have read and understood the Privacy Policy
- [x] I have read the contributing guidelines
```

5. Click **Create pull request**

<Callout type="info">
  **Want a faster review?** Post your PR link in our [Discord](https://discord.com/channels/1507758007218471062/1507758194624299039) and a maintainer will pick it up sooner.
</Callout>

---

Next: [After Merge](/register/workflow/after-merge)
```

- [ ] **Step 2: Create `workflow/after-merge.mdx`**

Create `apps/docs/content/docs/register/workflow/after-merge.mdx`:

```mdx
---
title: After Merge
description: Step 8 — What happens after your PR is merged and how to verify DNS propagation.
---

## Step 8: Wait for CI and review

After you open your pull request, two things happen before it gets merged:

### CI runs automatically

The CI pipeline validates your JSON file and checks that `owner.github` matches the GitHub account that opened the PR. This usually completes within a minute.

If CI fails, GitHub will post a comment on your PR explaining what went wrong. Push a fix to your branch and CI will re-run automatically. See [CI Failures](/register/troubleshooting/ci-failures) for help.

### A maintainer reviews

Once CI passes, a maintainer will review your PR and merge it if everything looks good. Review usually happens within a day or two.

<Callout type="info">
  Post your PR link in our [Discord](https://discord.com/channels/1507758007218471062/1507758194624299039) to get a faster review.
</Callout>

---

## After merge: DNS goes live

Once your PR is merged, the subdomain is synced to Cloudflare automatically. DNS propagation usually takes **a few minutes** but can take **up to 48 hours** depending on DNS resolvers.

## Verify DNS propagation

Check whether your subdomain has propagated using `dig`:

```bash
dig yourname.is-pinoy.dev CNAME
```

You should see your CNAME value in the ANSWER SECTION:

```
;; ANSWER SECTION:
yourname.is-pinoy.dev.  300  IN  CNAME  xxxxxxxxxxxxxxxx.vercel-dns-017.com.
```

Alternatively, use a web-based tool like [whatsmydns.net](https://www.whatsmydns.net) to check propagation from multiple locations.

## If your subdomain isn't live after 48 hours

Open an issue on the [domains repository](https://github.com/is-pinoy-dev/domains/issues) and include:
- Your subdomain
- A link to the merged PR
- The output of `dig yourname.is-pinoy.dev CNAME`

---

Congratulations — your `*.is-pinoy.dev` subdomain is live! 🎉

If you run into issues, check the [Troubleshooting](/register/troubleshooting) section.
```

- [ ] **Step 3: Verify in browser**

Check `http://localhost:3000/register/workflow/open-pr` and `/register/workflow/after-merge`. Confirm:
- Both pages appear in sidebar under Workflow
- Callout components render correctly
- Code blocks with bash commands render with syntax highlighting

- [ ] **Step 4: Commit**

```bash
git add apps/docs/content/docs/register/workflow/open-pr.mdx \
        apps/docs/content/docs/register/workflow/after-merge.mdx
git commit -m "docs(register): add workflow steps 6-8"
```

---

## Task 7: Troubleshooting section

**Files:**
- Create: `content/docs/register/troubleshooting/index.mdx`
- Create: `content/docs/register/troubleshooting/ci-failures.mdx`
- Create: `content/docs/register/troubleshooting/dns-propagation.mdx`
- Create: `content/docs/register/troubleshooting/common-errors.mdx`

- [ ] **Step 1: Create `troubleshooting/index.mdx`**

```bash
mkdir -p apps/docs/content/docs/register/troubleshooting
```

Create `apps/docs/content/docs/register/troubleshooting/index.mdx`:

```mdx
---
title: Troubleshooting
description: Solutions for common problems during subdomain registration.
---

<Cards>
  <Card title="CI Failures" href="/register/troubleshooting/ci-failures" description="Your PR's CI check failed — here's how to read the error and push a fix." />
  <Card title="DNS Propagation" href="/register/troubleshooting/dns-propagation" description="Your PR was merged but the subdomain isn't resolving yet." />
  <Card title="Common Errors" href="/register/troubleshooting/common-errors" description="Validation errors from the CLI validator and how to fix each one." />
</Cards>

## How to read a CI failure

When CI fails on your PR, GitHub automatically posts a comment with the error. Look for a comment from the `github-actions` bot — it will contain the exact validation error.

The two most common CI failures are:

1. **Schema validation failed** — your JSON file has a formatting or value error
2. **`owner.github` mismatch** — the GitHub username in your JSON doesn't match the account that opened the PR

See [CI Failures](/register/troubleshooting/ci-failures) for fixes for both.
```

- [ ] **Step 2: Create `troubleshooting/ci-failures.mdx`**

Create `apps/docs/content/docs/register/troubleshooting/ci-failures.mdx`:

```mdx
---
title: CI Failures
description: How to fix CI failures on your subdomain registration pull request.
---

When you open a PR, CI runs two checks:

1. **JSON schema validation** — your file is validated against the official JSON schema
2. **Owner verification** — `owner.github` must match the GitHub account that opened the PR

If either check fails, GitHub posts a comment on your PR with the error message. Fix the issue, push a new commit to your branch, and CI will re-run automatically.

## Schema validation failed

The CI comment will look something like:

```
✖ /records/CNAME/value: must match pattern "^.+\.$"
```

This means your CNAME value is missing the trailing dot. Fix your JSON:

```json
"CNAME": {
  "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
}
```

For a full list of schema errors and their fixes, see [Common Errors](/register/troubleshooting/common-errors).

## `owner.github` mismatch

The CI comment will say something like:

```
✖ owner.github (juandelacruz) does not match the pull request author (JuanDeLaCruz)
```

This check is **case-sensitive**. Fix your JSON so `owner.github` exactly matches your GitHub username as shown in your profile URL (`github.com/your-username`).

```json
"owner": {
  "github": "JuanDeLaCruz"
}
```

<Callout type="warn">
  GitHub usernames are case-sensitive in this check. Copy your username from your GitHub profile URL to be sure.
</Callout>

## How to push a fix

After editing your JSON file:

```bash
git add subdomains/yourname.json
git commit -m "Fix validation error"
git push origin main
```

CI will re-run automatically within a few seconds of the push.
```

- [ ] **Step 3: Create `troubleshooting/dns-propagation.mdx`**

Create `apps/docs/content/docs/register/troubleshooting/dns-propagation.mdx`:

```mdx
---
title: DNS Propagation
description: What to do if your subdomain isn't resolving after your PR was merged.
---

## Vercel shows "Invalid Configuration"

After your PR is merged but before DNS has propagated, Vercel's dashboard will show an **"Invalid Configuration"** warning on your domain. This is expected — Vercel is checking whether the CNAME record exists in DNS, and it hasn't propagated yet.

**You don't need to do anything.** Wait for DNS to propagate and the warning will go away automatically.

## How long does propagation take?

DNS changes typically propagate within **a few minutes** after your PR is merged and the Cloudflare sync runs. In rare cases it can take **up to 48 hours** depending on your DNS resolver's TTL and cache.

## How to check propagation

Use `dig` to query the CNAME record directly:

```bash
dig yourname.is-pinoy.dev CNAME
```

A propagated record looks like this:

```
;; ANSWER SECTION:
yourname.is-pinoy.dev.  300  IN  CNAME  xxxxxxxxxxxxxxxx.vercel-dns-017.com.
```

If the ANSWER SECTION is empty, the record hasn't propagated to your resolver yet.

You can also use [whatsmydns.net](https://www.whatsmydns.net) to check propagation from multiple geographic locations simultaneously.

## Still not live after 48 hours?

If more than 48 hours have passed since your PR was merged and your subdomain still isn't resolving, open an issue on the [domains repository](https://github.com/is-pinoy-dev/domains/issues) with:

- Your subdomain (e.g. `yourname.is-pinoy.dev`)
- A link to your merged PR
- The output of `dig yourname.is-pinoy.dev CNAME`
```

- [ ] **Step 4: Create `troubleshooting/common-errors.mdx`**

Create `apps/docs/content/docs/register/troubleshooting/common-errors.mdx`:

```mdx
---
title: Common Errors
description: Validation errors from the CLI validator and how to fix each one.
---

These are the most common errors reported by `npx @is-pinoy-dev/validate` and by CI.

## Missing trailing dot on CNAME

**Error:**
```
✖ CNAME value must end with a trailing dot (e.g. "yoursite.vercel.app.")
```

**Fix:** Add a `.` at the end of your CNAME value:

```json
"CNAME": {
  "value": "xxxxxxxxxxxxxxxx.vercel-dns-017.com."
}
```

---

## Filename does not match `subdomain` field

**Error:**
```
✖ Filename "juan-dev.json" does not match subdomain field "juan"
```

**Fix:** The filename (without `.json`) and the `subdomain` field must be identical. Either rename the file or update the field:

```json
{
  "subdomain": "juan-dev"
}
```
```bash
mv subdomains/juan.json subdomains/juan-dev.json
```

---

## `owner.github` missing or wrong

**Error:**
```
✖ owner.github is required
```

or from CI:

```
✖ owner.github (juandelacruz) does not match the pull request author (JuanDeLaCruz)
```

**Fix:** Add or correct the `owner.github` field. It must exactly match your GitHub username (case-sensitive):

```json
"owner": {
  "github": "JuanDeLaCruz"
}
```

---

## Missing `"provider"` field on Vercel TXT record

**Error:**
```
✖ records.TXT.provider is required when TXT value starts with "vc-domain-verify"
```

**Fix:** Add `"provider": "vercel"` to your TXT record:

```json
"TXT": {
  "value": "vc-domain-verify=yourname.is-pinoy.dev,abc123",
  "provider": "vercel"
}
```

---

## A and CNAME records both present

**Error:**
```
✖ records cannot contain both A and CNAME
```

**Fix:** Use one or the other. If your site is on a hosted platform (Vercel, Netlify, GitHub Pages), use CNAME. If you're pointing to an IP address, use A:

```json
"records": {
  "CNAME": {
    "value": "yoursite.vercel.app."
  }
}
```

---

## Invalid subdomain characters

**Error:**
```
✖ subdomain must match pattern ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$
```

**Fix:** Use only lowercase letters, numbers, and hyphens. No uppercase, no underscores, no dots. No leading or trailing hyphens:

| Invalid | Valid |
|---------|-------|
| `Juan` | `juan` |
| `juan_dev` | `juan-dev` |
| `-juan` | `juan` |
| `juan-` | `juan` |
```

- [ ] **Step 5: Verify in browser**

Check `http://localhost:3000/register/troubleshooting`. Confirm:
- Four pages under "Troubleshooting" in sidebar
- Cards on index page render and link to sub-pages
- All Callout components render correctly
- Code blocks render with correct syntax highlighting

- [ ] **Step 6: Commit**

```bash
git add apps/docs/content/docs/register/troubleshooting/
git commit -m "docs(register): add troubleshooting section"
```

---

## Task 8: Final verification pass

- [ ] **Step 1: Check all sidebar sections appear**

With the dev server running at `http://localhost:3000`, confirm the sidebar shows:

```
Register a Subdomain
  Getting Started
    Getting Started (index)
    Prerequisites
    Naming Rules
  Reference
    Reference (index)
    JSON Format
    Supported Records
  Providers
    Providers (index)
    Vercel
  Workflow
    Workflow (index)
    Fork & Clone
    Create Your JSON File
    Validate
    Open a PR
    After Merge
  Troubleshooting
    Troubleshooting (index)
    CI Failures
    DNS Propagation
    Common Errors
```

- [ ] **Step 2: Walk through the full user journey**

Click through in sequence:
1. `/register` → click "Fork & Clone" in the Steps component
2. `/register/workflow/fork-and-clone` → click "Create Your JSON File"
3. `/register/workflow/create-file` → click "Provider Guides" link → `/register/providers`
4. `/register/providers` → click "Vercel" → verify Tabs work
5. `/register/workflow/validate` → click "Common Errors" → `/register/troubleshooting/common-errors`

Confirm all cross-page links resolve without 404.

- [ ] **Step 3: Final commit if any fixes were made**

```bash
git add -A
git commit -m "docs(register): fix cross-page links and formatting"
```

Only needed if you made fixes in Step 1–2. Skip if everything was clean.
```
