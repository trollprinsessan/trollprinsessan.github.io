export default function Community() {
  // Photo src array — replace with real assets once provided.
  const photos = [
    { label: "Event hero", span: "tall" },
    { label: "Portrait" },
    { label: "Portrait" },
    { label: "Detail" },
    { label: "Detail" },
  ];

  return (
    <section className="mod-community">
      <div className="mod-section-header">
        <span className="mod-eyebrow">The Network in Action</span>
        <span className="mod-eyebrow-right">Previous events &amp; gatherings</span>
      </div>
      <div className="mod-community-grid">
        {photos.map((p, i) => (
          <div
            key={i}
            className={`mod-community-cell${p.span ? " mod-community-cell--tall" : ""}`}
          >
            {/* Replace with <img src={p.src} /> once assets are provided */}
            <span className="mod-community-placeholder">{p.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
