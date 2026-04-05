# Architecture

## Overview

NewsBites is a content-first Next.js 16 application using the App Router. Content is stored as local markdown files, parsed on the server with `gray-matter`, and rendered into static route output for known articles and category pages.

## Top-Level Structure

- `/opt/newsbites/app`
  App Router routes, layout, and global styles

- `/opt/newsbites/components`
  Shared presentational components

- `/opt/newsbites/lib`
  Content loading and article utility functions

- `/opt/newsbites/content/articles`
  Markdown article source files with frontmatter

## Route Model

### Root Layout

[app/layout.tsx](/opt/newsbites/app/layout.tsx)

- Loads Playfair Display and DM Sans via `next/font/google`
- Defines global metadata
- Renders the site frame, brand header, and main navigation
- Builds category navigation from the shared `verticals` list

### Homepage

[app/page.tsx](/opt/newsbites/app/page.tsx)

- Keeps the main news surface focused on editorial scanning
- Pulls the featured article from the latest approved or published content
- Renders primary actions into the dedicated reader app
- Shows latest-story cards and per-vertical preview lanes

### Reader App

[app/app/page.tsx](/opt/newsbites/app/app/page.tsx)

- Hosts the richer reading experience at `/app`
- Passes query-driven entry state into a client reader shell
- Supports direct entry by category, article, or random mode

[components/news-app-shell.tsx](/opt/newsbites/components/news-app-shell.tsx)

- Provides category filters, random article jumps, and previous/next navigation
- Uses a scroll-snapped article deck so one story stays in focus at a time
- Keeps the URL aligned with the active article for deep-linking back into the app

### Article Page

[app/articles/[slug]/page.tsx](/opt/newsbites/app/articles/%5Bslug%5D/page.tsx)

- Uses `generateStaticParams()` from live article slugs
- Loads article content by slug
- Renders markdown body using `react-markdown` and `remark-gfm`
- Shows author, tags, and status in a sidebar

### Category Page

[app/category/[vertical]/page.tsx](/opt/newsbites/app/category/%5Bvertical%5D/page.tsx)

- Uses `generateStaticParams()` from the shared vertical registry
- Rejects unknown verticals with `notFound()`
- Lists approved or published articles within a single lane

### About Page

[app/about/page.tsx](/opt/newsbites/app/about/page.tsx)

- Explains the product positioning
- Reinforces approval-first editorial publishing
- Restates the visual direction

## Content Loading

[lib/articles.ts](/opt/newsbites/lib/articles.ts)

This module is the core content layer.

Responsibilities:

- Reads markdown files from `content/articles`
- Parses frontmatter with `gray-matter`
- Normalizes display date labels
- Computes reading time
- Filters out draft content from the live site
- Provides helpers for featured articles, latest articles, vertical previews, and slug lookup

Important behavior:

- `getAllArticles()` only returns items with `status === "approved"` or `status === "published"`
- Vertical definitions are centralized in the `verticals` tuple:
  - `ai`
  - `finance`
  - `global-politics`
  - `trends`

## Styling System

[app/globals.css](/opt/newsbites/app/globals.css)

The styling is custom CSS layered over Tailwind v4 import support. The app primarily relies on semantic class names instead of utility-heavy markup.

Design characteristics:

- Warm editorial page background with layered gradients instead of a flat canvas
- Shared brand surfaces for the homepage and the `/app` reading mode
- Serif-heavy headlines, rounded action buttons, and stronger glassmorphism framing
- Scroll-snapped article cards and restrained entrance animation
- Reduced-motion handling via `prefers-reduced-motion`

## Rendering Model

The app is currently best understood as server-built from local content files:

- Articles are file-backed, not database-backed
- Dynamic route params are known from local markdown files
- There are no API routes, auth gates, or live data dependencies in this repository
- The current codebase is suitable for static-like content delivery, even though deployment presently uses a Node runtime
- The `/app` route reads query params on demand to support article, category, and random entry points

## Extension Points

The current architecture is ready for these next steps without major rework:

- Adding more markdown articles
- Adding richer frontmatter fields such as `excerpt`, `featured`, or `heroImage`
- Adding editorial review metadata
- Adding RSS, sitemap, and structured metadata
- Replacing local markdown with a CMS later if needed, while keeping route contracts stable
