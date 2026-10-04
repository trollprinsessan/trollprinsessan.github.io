/* next/link in the embed build: a plain anchor. The embedded page has no
   client-side router; its links are ordinary navigations. */
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  children?: ReactNode;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
};

export default function Link({ href, children, prefetch: _p, scroll: _s, replace: _r, ...rest }: Props) {
  const to = typeof href === "string" ? href : href.pathname ?? "#";
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
