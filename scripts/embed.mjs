#!/usr/bin/env node
/* THE EMBED BUILD: the page as files a host page loads with a script tag,
   rather than in an iframe, so it sits in the host's own document and takes
   the host's width, scroll and fonts like any other part of it.

     node scripts/embed.mjs <public-url> [out-dir]

   <public-url>  where the files will be served from, e.g.
                 https://example.vercel.app - every path to a file in public/
                 is made absolute against it, because the code runs on the
                 host's domain and a root path would look there instead
   [out-dir]     default dist-embed/<date>_<commit> (git-ignored): a folder of
                 its own for every build, never written over, with a
                 receipt (BUILD) of what it was built from

   The output:
     index.html               a redirect to the page that embeds this, so the
                              file host is not a second copy of the site
     js/nk100.js, chunks/     the page, as an ES module
     js/nk100.css             every stylesheet the page uses, in order
     <public files>           pictures, film, fonts
     vercel.json              cross-origin access for the host page, no indexing
     EMBED-SNIPPET.html       what goes in the host page's embed element

   The host page's own menu and footer are kept; the page's own are left out
   (components/page-body.tsx). */

import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const base = (process.argv[2] ?? "").replace(/\/$/, "");
const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};
const commit = git("rev-parse --short HEAD") || "nogit";
const dirty = git("status --porcelain --untracked-files=no") ? "+changes" : "";
const stamp = new Date().toISOString();
const out = path.resolve(root, process.argv[3] ?? `dist-embed/${stamp.slice(0, 10)}_${commit}${dirty ? "-dirty" : ""}`);
if (!process.argv[3] && fs.existsSync(out)) {
  console.error(`${out} is already built - a build is never written over. Commit the change, or pass an out-dir.`);
  process.exit(1);
}
/* where a visit to the file host itself is sent */
const HOME = process.env.NK_EMBED_HOME ?? "https://www.norrsken.org/100";

if (!/^https?:\/\//.test(base)) {
  console.error("usage: node scripts/embed.mjs https://<where-the-files-are-served> [out-dir]");
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

/* 1. the page, bundled */
await build({
  absWorkingDir: root,
  entryPoints: { nk100: "embed/main.tsx" },
  outdir: path.join(out, "js"),
  bundle: true,
  splitting: true,
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  minify: false,
  legalComments: "none",
  chunkNames: "chunks/[name]-[hash]",
  alias: {
    "next/link": "./embed/next-link.tsx",
    "next/dynamic": "./embed/next-dynamic.tsx",
  },
  /* the files in public/ are served beside the bundle, not bundled into it:
     a root path to one of them stays a path (made absolute below) */
  plugins: [
    {
      name: "public-files",
      setup(b) {
        const names = fs.readdirSync(path.join(root, "public")).filter((n) => !n.startsWith("."));
        const filter = new RegExp(`^/(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(/|$)`);
        b.onResolve({ filter }, (args) => ({ path: args.path, external: true }));
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "warning",
});

/* 2. the files the page uses */
const publicDir = path.join(root, "public");
const publicNames = fs.readdirSync(publicDir).filter((n) => !n.startsWith(".") && n !== "_ideas.html");
for (const name of publicNames) fs.cpSync(path.join(publicDir, name), path.join(out, name), { recursive: true });

/* 3. every root path to one of those files, made absolute */
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`(["'\`(\\s,=])/(${publicNames.map(escape).join("|")})(?=[/"'\`)\\s?#,])`, "g");
let rewritten = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|css)$/.test(e.name)) {
      const src = fs.readFileSync(p, "utf8");
      const next = src.replace(pattern, (_, pre, name) => {
        rewritten++;
        return `${pre}${base}/${name}`;
      });
      if (next !== src) fs.writeFileSync(p, next);
    }
  }
};
walk(path.join(out, "js"));

/* 4. the host's settings */
fs.writeFileSync(
  path.join(out, "vercel.json"),
  JSON.stringify(
    {
      headers: [
        {
          source: "/(.*)",
          headers: [
            /* the host page loads the module and fetches files across origins */
            { key: "Access-Control-Allow-Origin", value: "*" },
            /* the file host is not a second copy of the site in search results */
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
            { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
          ],
        },
        {
          /* the film and its posters change only with a new build: kept a day
             (after the rule above: the last match sets the header) */
          source: "/film/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
        },
      ],
    },
    null,
    2
  ) + "\n"
);

fs.writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="refresh" content="0; url=${HOME}">
<link rel="canonical" href="${HOME}">
<title>Norrsken100</title>
<a href="${HOME}">${HOME}</a>
`
);

/* 5. the embed element's content */
fs.writeFileSync(
  path.join(out, "EMBED-SNIPPET.html"),
  `<link rel="stylesheet" href="${base}/js/nk100.css" />
<div id="nk100-root"></div>
<script type="module" src="${base}/js/nk100.js"></script>
`
);

/* 6. the receipt */
fs.writeFileSync(
  path.join(out, "BUILD"),
  `norrsken100 embed build\ncommit: ${commit}${dirty}\nbuilt: ${stamp}\ntarget: ${base}\nembedded at: ${HOME}\n`
);

const size = (p) => fs.statSync(p).size;
console.log(
  `embed: ${out}\nbase ${base}\nnk100.js ${Math.round(size(path.join(out, "js/nk100.js")) / 1024)} KB, nk100.css ${Math.round(
    size(path.join(out, "js/nk100.css")) / 1024
  )} KB, ${rewritten} paths made absolute`
);
