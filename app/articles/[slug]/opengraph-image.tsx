import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/articles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return new ImageResponse(<div>Not Found</div>, { width: 1200, height: 630 });

  // Vertical label for the badge
  const verticalLabel = article.vertical.replace(/-/g, " ").toUpperCase();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        width: "100%",
        height: "100%",
        padding: "64px",
        background: "linear-gradient(135deg, #1B2A4A 0%, #0d1826 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Top-left logo text */}
      <div style={{ position: "absolute", top: 48, left: 64, fontSize: 20, opacity: 0.6 }}>
        TechInsiderBytes
      </div>

      {/* Vertical badge */}
      <div
        style={{
          display: "inline-flex",
          padding: "6px 16px",
          background: "#F5A623",
          borderRadius: 4,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 24,
          width: "fit-content",
        }}
      >
        {verticalLabel}
      </div>

      {/* Title — limit to 2 lines */}
      <div
        style={{
          fontSize: article.title.length > 60 ? 44 : 52,
          fontWeight: 700,
          lineHeight: 1.2,
          maxWidth: "90%",
        }}
      >
        {article.title.length > 100 ? article.title.slice(0, 97) + "..." : article.title}
      </div>

      {/* Lead / subtitle */}
      <div style={{ marginTop: 20, fontSize: 22, opacity: 0.75, maxWidth: "80%", lineHeight: 1.4 }}>
        {article.lead.length > 120 ? article.lead.slice(0, 117) + "..." : article.lead}
      </div>

      {/* Domain */}
      <div style={{ marginTop: 36, fontSize: 18, opacity: 0.5 }}>
        news.techinsiderbytes.com
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
