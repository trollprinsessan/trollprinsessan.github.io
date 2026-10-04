import { alumni } from "@/lib/modules-data";

export default function Alumni() {
  return (
    <section className="mod-alumni">
      <div className="mod-section-header">
        <span className="mod-eyebrow">Alumni Momentum</span>
        <span className="mod-eyebrow-right">Where are they now</span>
      </div>
      <div className="mod-alumni-table">
        <div className="mod-alumni-row mod-alumni-head">
          <span>Company</span>
          <span>Latest update</span>
          <span>Milestone</span>
          <span>Edition</span>
        </div>
        {alumni.map((co) => (
          <div key={co.name} className="mod-alumni-row">
            <div className="mod-alumni-co">
              <div className="mod-alumni-coname">{co.name}</div>
              <div className="mod-alumni-sector">
                {co.sector} · {co.country}
              </div>
            </div>
            <div className="mod-alumni-update">{co.update}</div>
            <div className="mod-alumni-metric">
              <div className="mod-alumni-metric-number">{co.metric}</div>
              <div className="mod-alumni-metric-label">{co.metricLabel}</div>
            </div>
            <div className="mod-alumni-edition">
              {co.years.join(" / ")}
            </div>
          </div>
        ))}
      </div>
      <div className="mod-alumni-note">
        Momentum data sourced from public announcements. More alumni updates coming.
      </div>
    </section>
  );
}
