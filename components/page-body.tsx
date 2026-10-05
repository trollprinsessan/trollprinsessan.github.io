import { companies, getFacets } from "@/lib/companies";
import { visualFor, isClipart, hasOwnPlate } from "@/lib/art-direction";
/* page-v#: the list in the page, or in a tab off the foot */
import ListSlot from "@/components/variants/page-v2/list-slot";
import Hero from "@/components/modules/hero";
import Manifest from "@/components/modules/manifest";
import ManifestLogo from "@/components/modules/manifest-logo";
import Latest from "@/components/modules/latest";
import Partners from "@/components/modules/partners";
import Faq from "@/components/modules/faq";
import Press from "@/components/modules/press";
import GoodNewsSection from "@/components/modules/good-news";
import Footer from "@/components/modules/footer";
import SnapAssist from "@/components/snap-assist";
import HeroMenu from "@/components/modules/hero-menu";

/* The page's content. The Next route renders it whole; the embed build
   (scripts/embed.mjs) renders it inside a host page that brings its own menu
   and footer, so both can be left out. */
/* THE FOOT IS WEBFLOW'S. The page carried a footer of its own while it was
   a site; embedded under norrsken.org the host draws the real one, so this
   build does not. The module and its styles stay in the repo - the default
   is simply off now, and the standalone build has no foot either. */
export default function PageBody({ menu = true, footer = false }: { menu?: boolean; footer?: boolean }) {
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
            <ListSlot companies={companies} facets={facets} />
          </div>
        </div>
        <div id="latest"><Latest /></div>
        <div id="goodnews"><GoodNewsSection /></div>
        <div id="partners"><Partners /></div>
        {/* Network parked: the module and its CSS stay in the repo,
            it is just not on the page for now */}
        <div id="faq"><Faq /></div>
        {/* who has written about the list: the marks alone, each a link */}
        <div id="press"><Press /></div>
        {footer && <Footer />}
      </main>
      {/* THE MENU rides the window's top right corner the whole way down:
          one word, the sections folding out under it. It is white and set
          in difference, so it is white on the film and black on the page
          without ever being told which it is over. Out here rather than in
          the hero, because a blend only sees what shares its stacking
          context, and the hero is one of its own. */}
      {menu && <HeroMenu />}
      {/* the floating Good News note is parked: the component stays in the
          repo, it is just not on the page */}
      <SnapAssist />
    </>
  );
}
