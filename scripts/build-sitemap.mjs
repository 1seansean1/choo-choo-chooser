// scripts/build-sitemap.mjs — generate dist/sitemap.xml after the Vite build.
// Each route becomes a /?route=<id> entry so Googlebot can crawl deep-links
// (the App's mount-time useEffect opens the matching route's Detail panel).

import { writeFileSync, mkdirSync } from "node:fs";
import { ROUTES } from "../src/data/index.js";

const SITE = "https://choo-choo-chooser.vercel.app";
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: SITE + "/",            priority: "1.0", changefreq: "daily"  },
  { loc: SITE + "/mapviewer",   priority: "0.8", changefreq: "weekly" },
  ...ROUTES.map((r) => ({
    loc: `${SITE}/?route=${encodeURIComponent(r.id)}`,
    priority: "0.7",
    changefreq: "weekly",
    title: r.name,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/sitemap.xml", xml);
console.log(`Wrote dist/sitemap.xml — ${urls.length} URLs (${ROUTES.length} routes + 2 pages)`);
