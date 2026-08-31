import { notFound } from "next/navigation";
import Link from "next/link";
import { companies, getCompany } from "@/lib/companies";
import type { Company } from "@/lib/types";

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) return {};
  return {
    title: `${c.name} — Norrsken / 100`,
    description: c.statement || undefined,
  };
}

// Rich-text sections, in display order. New 2026 framing first, then legacy.
function sections(c: Company) {
  return [
    { label: "What they fix", body: c.current.fix },
    { label: "What they outperform", body: c.current.outperform },
    { label: "What this means for the future", body: c.current.future },
    { label: "Problem", body: c.legacy.problem },
    { label: "Solution", body: c.legacy.solution },
    { label: "Description", body: c.legacy.description },
  ].filter((s) => s.body && s.body.trim());
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) notFound();

  const blocks = sections(c);

  return (
    <main className="detail">
      <div className="detail-bar">
        <Link href="/" className="back label">
          Back to index
        </Link>
        <span className="label">{c.years.join(" · ")}</span>
      </div>

      {c.visual ? (
        <div className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.visual} alt={c.name} />
        </div>
      ) : null}

      <div className="detail-meta">
        <div className="meta-item">
          <span className="label">Sector</span>
          <span className="meta-val">{c.sectorLabel || "—"}</span>
          {c.subsector ? <span className="meta-sub">{c.subsector}</span> : null}
        </div>
        <div className="meta-item">
          <span className="label">Year founded</span>
          <span className="meta-val">{c.yearFounded ?? "—"}</span>
        </div>
        <div className="meta-item">
          <span className="label">Country</span>
          <span className="meta-val">{c.countries.join(", ") || "—"}</span>
        </div>
        {c.website ? (
          <a
            className="website-btn"
            href={c.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Website <span aria-hidden>↗</span>
          </a>
        ) : null}
      </div>

      <div className="detail-head">
        <div className="detail-name">{c.name}</div>
        <hr />
        {c.statement ? <h1 className="detail-statement">{c.statement}</h1> : null}
      </div>

      {blocks.length > 0 && (
        <div className="detail-body">
          {blocks.map((s) => (
            <section key={s.label} className="block">
              <h2 className="block-label">{s.label}</h2>
              <p className="block-body">{s.body}</p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
