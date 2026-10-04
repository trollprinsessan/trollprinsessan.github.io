import { impact } from "@/lib/modules-data";

export default function Impact() {
  return (
    <section className="mod-impact">
      <div className="mod-section-header mod-section-header--light">
        <span className="mod-eyebrow">Collective Impact</span>
        <span className="mod-eyebrow-right">Across all editions</span>
      </div>
      <div className="mod-impact-grid">
        {impact.map((stat) => (
          <div key={stat.label} className="mod-impact-stat">
            <div className="mod-impact-number">{stat.number}</div>
            <div className="mod-impact-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
