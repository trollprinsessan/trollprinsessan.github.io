"use client";

import Archive from "@/components/archive";
import type { Company, Facets } from "@/lib/types";
import { useVersion } from "@/components/settings/registry";
import ListTab from "./list-tab";
import DockBar from "@/components/variants/page-v4/dock-bar";
import CompanySide from "@/components/variants/page-v4/company-side";
import ListLead from "@/components/variants/page-v5/list-lead";

/* WHERE THE LIST LIVES. page-v1 is the original page: the list in
   the page, under the mark, with the original dock. page-v2 takes it out of
   the page and into a tab off the foot of the window; the page is otherwise
   the same.
   Either way it is one Archive - one state, one set of views - so every
   listview-v# shows in both. */
export default function ListSlot({ companies, facets }: { companies: Company[]; facets: Facets }) {
  const page = useVersion("page");
  /* THE COMPANY BESIDE THE INDEX: chosen on its own, in every page that has
     the list in it - sideview-v1 and -v6 are the original panel, the rest the
     page's own column. The grid and the categories open the modal. */
  const sideview = useVersion("sideview");
  /* the dock is chosen on every page: on page-v1 dockstyle-v1 is the original
     dock, every later version the page's bar */
  const dockstyle = useVersion("dockstyle");
  const dockplace = useVersion("dockplace");
  const aside =
    sideview === "v1" || sideview === "v6" || sideview === "v12"
      ? undefined
      : (parts: Parameters<NonNullable<React.ComponentProps<typeof Archive>["aside"]>>[0]) => (
          <CompanySide {...parts} badges={page === "v5"} />
        );
  if (page === "v2") return <ListTab companies={companies} facets={facets} />;
  /* page-v3: the same tab, riding the page's scroll */
  if (page === "v3") return <ListTab companies={companies} facets={facets} mode="scroll" />;
  /* page-v4: the original page, the list in it, with the tab's row as the
     dock */
  if (page === "v4") {
    return <Archive companies={companies} facets={facets} dock={(parts) => <DockBar {...parts} />} aside={aside} />;
  }
  /* page-v5: page-v4, with the list's own head - the campaigns' key */
  if (page === "v5") {
    return (
      <Archive
        companies={companies}
        facets={facets}
        dock={(parts) => <DockBar {...parts} />}
        aside={aside}
        lead={(parts) => <ListLead {...parts} />}
      />
    );
  }
  return (
    <Archive
      companies={companies}
      facets={facets}
      aside={aside}
      dock={dockstyle === "v1" && dockplace === "v1" ? undefined : (parts) => <DockBar {...parts} />}
    />
  );
}
