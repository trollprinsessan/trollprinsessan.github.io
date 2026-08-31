import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
