import type { Article } from "@/lib/articles";

export function ArticleJsonLd({ article }: { article: Article }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.lead,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "TechInsiderBytes",
      url: "https://news.techinsiderbytes.com",
      logo: {
        "@type": "ImageObject",
        url: "https://news.techinsiderbytes.com/brand-assets/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://news.techinsiderbytes.com/articles/${article.slug}`,
    },
    articleSection: article.vertical,
    keywords: article.tags.join(", "),
    ...(article.coverImage && {
      image: { "@type": "ImageObject", url: article.coverImage },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
