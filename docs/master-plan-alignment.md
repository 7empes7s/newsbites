# Master Plan Alignment

This document extracts the NewsBites-specific direction from `/opt/mimoun/openclaw-config/workspace/MASTER_PLAN.md` and compares it to the live application in `/opt/newsbites`.

## Planned Product Direction

From the master plan, NewsBites v1 is intended to be:

- The first productized public stack in the wider TechInsiderBytes ecosystem
- A fast, mobile-friendly editorial site at `news.techinsiderbytes.com`
- A markdown-led publishing system with human approval in the first phase
- A visually distinctive product described as "Bloomberg Terminal meets a Reel"
- Focused on four verticals: AI, Finance, Global Politics, and Trends

## Planned Design Direction

The master plan defines:

- Primary color: deep navy `#1B2A4A`
- Accent color: amber `#F5A623`
- Headline font: Playfair Display
- Body font: DM Sans
- Layout: card-based, mobile-first, filterable by vertical

## Planned Functional Scope

Required pages from the master plan:

- Homepage
- Article page
- Category pages
- About page

Required content model:

- Markdown files under `/content/articles`
- Frontmatter including `title`, `slug`, `date`, `vertical`, `tags`, `status`, and `lead`

Planned deployment notes:

- Repo location: `/opt/newsbites`
- GitHub repo: `7empes7s/newsbites`
- Runtime target: port `3001`
- Public host: `news.techinsiderbytes.com`
- Caddy reverse proxy to `localhost:3001`

## Current Repository State

The current repository matches most of the v1 scope:

- Next.js app exists in `/opt/newsbites`
- Homepage exists in [app/page.tsx](/opt/newsbites/app/page.tsx)
- Article route exists in [app/articles/[slug]/page.tsx](/opt/newsbites/app/articles/%5Bslug%5D/page.tsx)
- Category route exists in [app/category/[vertical]/page.tsx](/opt/newsbites/app/category/%5Bvertical%5D/page.tsx)
- About page exists in [app/about/page.tsx](/opt/newsbites/app/about/page.tsx)
- Markdown articles exist in `/opt/newsbites/content/articles`
- Four verticals are implemented in [lib/articles.ts](/opt/newsbites/lib/articles.ts)
- The repo has a configured GitHub remote pointing to `https://github.com/7empes7s/newsbites.git`

## Current Implementation Notes

The current app already reflects the core design brief:

- Playfair Display and DM Sans are loaded in [app/layout.tsx](/opt/newsbites/app/layout.tsx)
- Deep navy and amber are implemented as CSS variables in [app/globals.css](/opt/newsbites/app/globals.css)
- The homepage is organized into a lead story, latest stories, and vertical lanes in [app/page.tsx](/opt/newsbites/app/page.tsx)
- Article content is loaded from markdown and rendered with `react-markdown` in [app/articles/[slug]/page.tsx](/opt/newsbites/app/articles/%5Bslug%5D/page.tsx)
- Only `approved` and `published` articles render live, enforced in [lib/articles.ts](/opt/newsbites/lib/articles.ts)

## Gaps And Deviations

These items are either missing or not fully aligned with the master plan:

- The README had remained a stock starter and did not document the real system. This has now been corrected.
- The site is currently configured as a Next.js runtime app using `next build` and `next start`, not a static export.
- `deploy.sh` installs dependencies on each deployment and assumes an existing `newsbites.service`; there is no repo-local service unit or infrastructure-as-code definition here.
- The master plan mentions a logo asset, but no logo image is present in this repository beyond the default favicon file.
- The category empty state says "No published stories" while the live content filter accepts both `approved` and `published`. That wording reflects intent imperfectly.
- There is no documentation in this repo yet for DNS, Caddy configuration, or the systemd unit file itself.

## Practical Interpretation

NewsBites is already beyond scaffold stage. It has a functional v1 editorial shell, a working markdown article model, and the planned route structure. The main remaining documentation and operational work is to make the deployment path, editorial workflow, and infrastructure expectations explicit and easy for future agents to continue.
