# NewsBites

NewsBites is the first public-facing product in the broader TechInsiderBytes stack. It is a Next.js editorial site built around a simple-news format: fast scanning, strong headlines, markdown-backed articles, and a human-approved publishing loop.

The current app is running as a content-first Next.js site from `/opt/newsbites` and is intended to serve `news.techinsiderbytes.com`.

## Documentation

- [Documentation Index](/opt/newsbites/docs/README.md)
- [Master Plan Alignment](/opt/newsbites/docs/master-plan-alignment.md)
- [Architecture](/opt/newsbites/docs/architecture.md)
- [Content Workflow](/opt/newsbites/docs/content-workflow.md)
- [Deployment](/opt/newsbites/docs/deployment.md)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Markdown content via `gray-matter`
- Markdown rendering via `react-markdown` and `remark-gfm`

## Current Routes

- `/`
- `/app`
- `/about`
- `/articles/[slug]`
- `/category/[vertical]`

## Content Source

Articles live in `/opt/newsbites/content/articles` and use frontmatter for metadata. Only articles marked `approved` or `published` are included in the site.
