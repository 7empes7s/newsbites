import Link from "next/link";

const socialLinks = [
  { label: "X", href: "#", note: "Breaking drops" },
  { label: "LinkedIn", href: "#", note: "Briefing updates" },
  { label: "Telegram", href: "#", note: "Direct alerts" },
];

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? "site-footer site-footer-compact" : "site-footer"}>
      <div className="site-footer-copy">
        <p className="article-meta">TechInsiderBytes</p>
        <h2>Stay with the signal.</h2>
        <p>
          NewsBites is where TechInsiderBytes publishes its daily briefings.
          Follow for alerts and new drops.
        </p>
      </div>

      <div className="site-footer-socials" aria-label="Social destinations">
        {socialLinks.map((social) => (
          <Link key={social.label} className="site-footer-social" href={social.href}>
            <span>{social.label}</span>
            <strong>{social.note}</strong>
          </Link>
        ))}
      </div>
    </footer>
  );
}
