# Content Workflow

## Editorial Model

The master plan defines an approval-first publishing loop for the first phase of NewsBites. The repository already supports that model through article status filtering.

Current principle:

- Draft content can exist in the repository
- Only `approved` or `published` articles appear on the live site

That behavior is implemented in [lib/articles.ts](/opt/newsbites/lib/articles.ts).

## Article Storage

Articles are stored as markdown files in `/opt/newsbites/content/articles`.

Current article examples:

- [ai-cost-discipline.md](/opt/newsbites/content/articles/ai-cost-discipline.md)
- [finance-liquidity-watch.md](/opt/newsbites/content/articles/finance-liquidity-watch.md)
- [global-politics-middle-powers.md](/opt/newsbites/content/articles/global-politics-middle-powers.md)
- [trends-interface-fatigue.md](/opt/newsbites/content/articles/trends-interface-fatigue.md)

## Required Frontmatter

Each article currently uses this metadata shape:

- `title`
- `slug`
- `date`
- `vertical`
- `tags`
- `status`
- `lead`
- `coverImage`
- `author`

This schema is inferred from [lib/articles.ts](/opt/newsbites/lib/articles.ts).

## Supported Verticals

The site currently recognizes exactly four editorial lanes:

- `ai`
- `finance`
- `global-politics`
- `trends`

These are the same four verticals defined in the master plan.

## Current Publishing States

- `draft`
  Exists for work in progress and does not render on the site

- `approved`
  Renders on the site and matches the current approval-first launch model

- `published`
  Also renders on the site and can be used later if a stricter distinction is needed between internal approval and public promotion

## Suggested Editorial Flow

Based on the master plan and the current repository behavior, the intended workflow is:

1. Draft article content in markdown.
2. Review headline, lead, tags, and vertical assignment.
3. Keep `status: "draft"` until manual review is complete.
4. Change status to `approved` once the article is cleared for the live site.
5. Deploy the site so the approved article becomes publicly reachable.
6. Introduce `published` as a separate post-deploy state only if operationally useful later.

## Content Conventions Seen In The Repository

The current sample articles follow a clear pattern:

- Short, high-signal headlines
- One-paragraph lead suitable for cards and hero surfaces
- Section-based article bodies
- Bullet lists for fast scanning
- A neutral house byline of `NewsBites Desk`

This aligns with the product goal of simple, digestible news rather than long-form analysis.

## Recommended Next Documentation Step

If the editorial pipeline becomes more automated, add a dedicated style guide file describing:

- headline rules
- lead-length targets
- citation requirements
- approval checklist
- tagging conventions
- when to use `approved` versus `published`
