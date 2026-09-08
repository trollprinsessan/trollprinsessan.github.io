import { companies, getFacets } from "@/lib/companies";
import Archive from "@/components/archive";
import Nav from "@/components/nav";
import Hero from "@/components/modules/hero";
import Manifest from "@/components/modules/manifest";
import ManifestLogo from "@/components/modules/manifest-logo";
import Latest from "@/components/modules/latest";
import Partners from "@/components/modules/partners";
import Faq from "@/components/modules/faq";
import Footer from "@/components/modules/footer";
import GoodNews from "@/components/good-news";

export default function Home() {
  const facets = getFacets();
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div id="manifest"><Manifest /></div>
        <div id="archive">
          <div className="archive-masthead"><ManifestLogo /></div>
          <Archive companies={companies} facets={facets} />
        </div>
        <div id="latest"><Latest /></div>
        <div id="partners"><Partners /></div>
        {/* Network parked: the module and its CSS stay in the repo,
            it is just not on the page for now */}
        <div id="faq"><Faq /></div>
        <Footer />
      </main>
      <GoodNews />
    </>
  );
}
