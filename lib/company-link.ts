/* A COMPANY HAS AN ADDRESS.
   The open company is written into the page's own address as ?company=slug,
   so a link to it opens it, and the back button closes it. The page stays the
   page: the section anchor (#archive) is kept as it was, and nothing reloads.

   Anything on the page can ask for a company - the manifest's plate does -
   without knowing where the list keeps its modal: it raises this event and
   the list opens it. */

export const COMPANY_PARAM = "company";
export const OPEN_COMPANY_EVENT = "nk100:open-company";

export function companyFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(COMPANY_PARAM);
}

export function writeCompanyUrl(slug: string | null, mode: "push" | "replace") {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(COMPANY_PARAM, slug);
  else url.searchParams.delete(COMPANY_PARAM);
  const next = `${url.pathname}${url.search}${url.hash}`;
  /* the router keeps its own record in the history entry; it is carried
     over rather than replaced */
  const state = { ...(window.history.state ?? {}), nk100Company: slug };
  if (mode === "push") window.history.pushState(state, "", next);
  else window.history.replaceState(state, "", next);
}

export function openCompany(slug: string) {
  window.dispatchEvent(new CustomEvent(OPEN_COMPANY_EVENT, { detail: slug }));
}
