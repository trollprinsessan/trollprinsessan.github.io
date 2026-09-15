/* GOOD NEWS
   Norrsken's newsletter, as a section of the page rather than a field in the
   footer. The live page's module is a heading, one email field, a privacy
   consent and a button, sitting between the FAQ and the imprint; this is the
   same four things on the page's own grid.

   The title art is a PLACEHOLDER: /title-gifs/good-news.gif is a stand-in
   made here (the words in Arial Bold, a cursor blinking) so the slot is
   sized and placed. Swap the file and nothing else needs to change.

   The field has no endpoint yet: submitting hands the address to Norrsken's
   own Good News page rather than pretending to capture it here. */
export default function GoodNews() {
  return (
    <section className="mod-goodnews">
      <div className="mod-section-header">
        <img
          className="mod-title-art mod-title-art--goodnews"
          src="/title-gifs/good-news.gif"
          alt="Good News"
        />
      </div>

      {/* the manifest's own column: a running head, the copy, then the field
          under it - and the title art across the tracks to its right, where
          the manifest keeps its plate */}
      <p className="mod-goodnews-head">WANT MORE GOOD NEWS?</p>
      <p className="mod-goodnews-copy">
        Join over <span className="mod-manifest-num">65,000</span> other
        subscribers and get Good News, the Norrsken newsletter, in your inbox.
      </p>

      <GoodNewsForm />
    </section>
  );
}

/* the signup on its own - the field in the dock's slot and the consent - so
   the section and the footer carry the same form */
export function GoodNewsForm({
  className = "",
  placeholder = "Email",
}: {
  className?: string;
  /* the footer carries norrsken.org's own wording for the field */
  placeholder?: string;
}) {
  return (
    <form
      className={`mod-goodnews-form ${className}`}
      action="https://www.norrsken.org/goodnews"
      method="get"
      target="_blank"
    >
      {/* the dock's slot: a flat fill, the field and the word inside it */}
      <div className="mod-goodnews-field ctl-box">
        <input
          type="email"
          name="email"
          required
          placeholder={placeholder}
          aria-label="Email address"
        />
        <button type="submit">Subscribe</button>
      </div>
      {/* the consent, kept as the live page keeps it: required, and a
          square that fills rather than a drawn box */}
      <label className="mod-goodnews-consent">
        <input type="checkbox" name="consent" required />
        <span className="mod-goodnews-consent-mark" aria-hidden="true" />
        <span>
          I agree with the{" "}
          <a
            href="https://www.norrsken.org/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
        </span>
      </label>
    </form>
  );
}
