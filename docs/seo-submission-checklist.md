# SEO Submission Checklist

## Prerequisites (must be done first)
- [x] Phase 53 deployed (article metadata)
- [x] Phase 54 deployed (JSON-LD)
- [x] Phase 55 deployed (sitemap at /sitemap.xml)
- [x] Phase 56 deployed (RSS at /feed.xml)

## Google Search Console
1. Go to https://search.google.com/search-console/
2. Add property: news.techinsiderbytes.com
3. Verify via HTML tag — add the meta tag to app/layout.tsx:
   `<meta name="google-site-verification" content="YOUR_CODE_HERE" />`
4. Submit sitemap: https://news.techinsiderbytes.com/sitemap.xml

## Google News Publisher Center
1. Go to https://publishercenter.google.com/
2. Add publication — site URL: https://news.techinsiderbytes.com
3. Content labels: Technology, Finance, World News, Science
4. RSS feed: https://news.techinsiderbytes.com/feed.xml

## Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters/
2. Add site, verify, submit sitemap URL

## Validate
- Rich Results Test: https://search.google.com/test/rich-results
- RSS Validator: https://validator.w3.org/feed/
- Schema Validator: https://validator.schema.org/
