/* THE EMBED ENTRY. The page as a script the host page loads: it renders into
   #nk100-root, below the host's own menu and above its footer, and leaves
   both alone.

   What the Next layout does in the document's head is done here before the
   first render: the parts' versions are written on the root element for the
   CSS that waits on them, and the intro is skipped for a visit that arrives
   on a query, a hash or the back button. */
import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import Loader from "@/components/loader";
import Runtime from "@/components/settings/runtime";
import PageBody from "@/components/page-body";
import { LINE_WIDTH, rootAttributes } from "@/components/settings/versions";

const root = document.documentElement;
for (const [k, v] of Object.entries(rootAttributes())) root.setAttribute(k, v);
root.style.setProperty("--nk-line-w", `${LINE_WIDTH}px`);
root.classList.add("nk100");
try {
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (location.search || location.hash || nav?.type === "back_forward") root.classList.add("no-loader");
} catch {
  /* a browser without the timing API simply plays the intro */
}

const mount = document.getElementById("nk100-root");
if (mount) {
  createRoot(mount).render(
    <>
      <Loader />
      <PageBody menu={false} footer={false} />
      <Runtime />
    </>
  );
}
