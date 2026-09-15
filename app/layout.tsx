import type { Metadata } from "next";
import "./globals.css";
import Loader from "@/components/loader";

export const metadata: Metadata = {
  title: "Norrsken / 100 — The world's most promising impact startups",
  description:
    "A curated index of the world's 100 most promising early-stage impact startups, edition by edition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* the root carries a class the script below may set before React is
       there, so its attributes are allowed to differ from the server's */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* THE INTRO ONLY AT THE FRONT DOOR: decided before the first paint,
            so a link into a company or a list never flashes the loader. Plays
            for the page as it is; not for a query, a hash, or a back/forward
            visit. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var l=location,n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(l.search||l.hash||(n&&n.type==="back_forward"))document.documentElement.classList.add("no-loader")}catch(e){}',
          }}
        />
      </head>
      <body>
        <Loader />
        {children}
      </body>
    </html>
  );
}
