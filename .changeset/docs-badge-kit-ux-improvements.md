---
"docs": minor
---

Badge Kit docs UX improvements and general polish.

- **Badge embed tabs**: replaced custom tab/code UI in `BadgeThemes` with Fumadocs `Tabs`/`Tab` + `CodeBlock`/`Pre`, matching the rest of the docs and adding a copy button to embed code
- **Subdomain banner**: added `SubdomainBanner` at the top of the Badge Kit page so users can set their subdomain once and see all previews and embed URLs update live
- **Reference examples**: reorganised the flat examples code block into per-type tabs (Subdomain badge, Member badge, Platform badges, Banners) with one URL per tab and a description title, so the copy button captures only the link
- **Sidebar search bar border**: added retro pixel-art border (`3px solid var(--border)` + `4px 4px 0 var(--primary-dark)` shadow) to the desktop sidebar search bar, consistent with other bordered elements
- **"Workflow" renamed to "Steps"**: sidebar section and cross-links updated to use friendlier language
- **robots.txt**: added `Allow: /` for all crawlers
