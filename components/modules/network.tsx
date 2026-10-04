import { alumni } from "@/lib/modules-data";
import { companies } from "@/lib/companies";
import ManifestSphereWrapper from "./manifest-sphere-wrapper";

export default function Network() {
  const imageUrls = companies
    .filter((c) => c.visual)
    .map((c) => c.visual as string);

  return (
    <section className="mod-network">
      <div className="mod-section-header">
        <span className="mod-eyebrow">The Network</span>
      </div>
      <div className="mod-network-split">
        {/* sphere parked here for now, in the slot the event photo will
            eventually take */}
        <div className="mod-network-feature mod-network-feature--sphere">
          <ManifestSphereWrapper imageUrls={imageUrls} />
        </div>
        <div className="mod-network-entries">
          {alumni.map((co) => {
            const tags = [co.sector, co.country].filter(Boolean);
            return (
              <div key={co.name} className="mod-network-entry">
                {co.date && <span className="mod-network-entry-date">{co.date}</span>}
                <span className="mod-network-entry-name">{co.name}</span>
                {co.update && <p className="mod-network-entry-update">{co.update}</p>}
                {tags.length > 0 && (
                  <div className="mod-network-entry-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="mod-network-entry-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
