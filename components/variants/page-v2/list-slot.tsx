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
  const aside =
    (parts: Parameters<NonNullable<React.ComponentProps<typeof Archive>["aside"]>>[0]) => (
          <CompanySide {...parts} badges={true} />
        );
  /* page-v5: page-v4, with the list's own head - the campaigns' key */
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
