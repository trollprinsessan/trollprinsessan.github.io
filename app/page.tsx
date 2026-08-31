import { companies, getFacets } from "@/lib/companies";
import Archive from "@/components/archive";
import Nav from "@/components/nav";
import Hero from "@/components/modules/hero";
import Manifest from "@/components/modules/manifest";
import ManifestLogo from "@/components/modules/manifest-logo";
import Latest from "@/components/modules/latest";
import Partners from "@/components/modules/partners";
import Network from "@/components/modules/network";
import Faq from "@/components/modules/faq";

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
        <div id="network"><Network /></div>
        <div id="faq"><Faq /></div>
      </main>
    </>
  );
}
