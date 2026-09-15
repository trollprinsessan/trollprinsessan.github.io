import { companies, getFacets } from "@/lib/companies";
import { visualFor, isClipart, hasOwnPlate } from "@/lib/art-direction";
import Archive from "@/components/archive";
import Hero from "@/components/modules/hero";
import Manifest from "@/components/modules/manifest";
import ManifestLogo from "@/components/modules/manifest-logo";
import Latest from "@/components/modules/latest";
import Partners from "@/components/modules/partners";
import Faq from "@/components/modules/faq";
import GoodNewsSection from "@/components/modules/good-news";
import Footer from "@/components/modules/footer";
import GoodNews from "@/components/good-news";
import SnapAssist from "@/components/snap-assist";
import HeroMenu from "@/components/modules/hero-menu";

export default function Home() {
  const facets = getFacets();
  /* the manifest draws one company at a time; it needs four fields, not the
     whole record, so the list handed to it stays small in the bundle. Only the
     companies with a clipart plate or a gif are eligible - the full-frame
     photographs and the line drawings sit the wheel out for now. */
  const draw = companies
    .filter((c) => hasOwnPlate(c) && isClipart(visualFor(c)))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      statement: c.statement,
      geo: c.countries.join(", "),
      sector: c.sectorLabel,
      visual: visualFor(c),
    }));
  return (
    <>
      <main>
        {/* THE MARK RIDES THE FOOT OF THE WINDOW, THEN THE HEAD.
            Stuck to the bottom of the screen while the film and the manifest
            are read, parked directly above the list when its place comes up,
            and then stuck to the top while the list runs under it - so the
            block it is stuck inside holds the list too. */}
        <div className="run">
          <div className="reveal">
            <Hero />
            <div id="manifest"><Manifest draw={draw} /></div>
          </div>
          <div className="archive-masthead"><ManifestLogo /></div>
          {/* the snap target the mark used to be: a still point where its
              place ends, since a sticky target judders */}
          <div className="reveal-end" aria-hidden="true" />
          <div id="archive">
            <Archive companies={companies} facets={facets} />
          </div>
        </div>
        <div id="latest"><Latest /></div>
        <div id="goodnews"><GoodNewsSection /></div>
        <div id="partners"><Partners /></div>
        {/* Network parked: the module and its CSS stay in the repo,
            it is just not on the page for now */}
        <div id="faq"><Faq /></div>
        <Footer />
      </main>
      {/* THE MENU rides the window's top right corner the whole way down:
          one word, the sections folding out under it. It is white and set
          in difference, so it is white on the film and black on the page
          without ever being told which it is over. Out here rather than in
          the hero, because a blend only sees what shares its stacking
          context, and the hero is one of its own. */}
      <HeroMenu />
      <GoodNews />
      <SnapAssist />
    </>
  );
}
