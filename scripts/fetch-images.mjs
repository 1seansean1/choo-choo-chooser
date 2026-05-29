// scripts/fetch-images.mjs
//
// For each route in the catalog, fetch a hero image from Wikipedia's REST
// /page/summary endpoint and write the URLs + attribution to
// src/data/route-images.json.
//
// Image hosting: upload.wikimedia.org is fine to hotlink for a small personal
// site. Each image's `source_page` field carries the Wikipedia article URL for
// attribution.
//
// Run:  node scripts/fetch-images.mjs

import { ROUTES } from "../src/data/index.js";
import { writeFileSync } from "node:fs";

// Curated slug overrides per route.id. Where a route's `name` doesn't match
// the Wikipedia article title (very common — "Shinkansen Nozomi" → "Nozomi
// (train)", etc.), we pin the slug explicitly.
const SLUG_OVERRIDES = {
  "cz-west":                "California_Zephyr",
  "cz-east":                "California_Zephyr",
  "rocky-mountaineer":      "Rocky_Mountaineer",
  "winter-park":            "Winter_Park_Express",
  "coast-starlight":        "Coast_Starlight",
  "acela":                  "Acela",
  "the-canadian":           "The_Canadian_(train)",
  "eurostar":               "Eurostar",
  "glacier-express":        "Glacier_Express",
  "bernina-express":        "Bernina_Express",
  "frecciarossa":           "Frecciarossa",
  "flam":                   "Flåm_Line",
  "caledonian-sleeper":     "Caledonian_Sleeper",
  "shinkansen-nozomi":      "Nozomi_(train)",
  "qinghai-tibet":          "Qinghai–Tibet_railway",
  "trans-siberian":         "Trans-Siberian_Railway",
  "reunification-express":  "Reunification_Express",
  "the-ghan":               "The_Ghan",
  "tranzalpine":            "TranzAlpine",
  "blue-train":             "Blue_Train_(South_Africa)",
  "tazara":                 "TAZARA_Railway",
  "andean-explorer":        "PeruRail",
  "tren-nubes":             "Tren_a_las_Nubes",
  "ice-berlin-munich":      "Intercity-Express",
  "tgv-paris-marseille":    "TGV_inOui",
  "ave-madrid-seville":     "AVE",
  "nightjet-vienna-venice": "Nightjet",
  "vsoe":                   "Venice-Simplon_Orient_Express",
  "bergensbanen":           "Bergen_Line",
  "fuxing":                 "Fuxing_(train)",
  "ktx":                    "Korea_Train_Express",
  "vande-bharat":           "Vande_Bharat_Express",
  "darjeeling":             "Darjeeling_Himalayan_Railway",
  "eo-express":             "Eastern_and_Oriental_Express",
  "taiwan-hsr":             "Taiwan_High_Speed_Rail",
  "empire-builder":         "Empire_Builder",
  "brightline":             "Brightline",
  "sunset-limited":         "Sunset_Limited",
  "indian-pacific":         "Indian_Pacific",
  "al-boraq":               "Al-Boraq",
  "madaraka":               "Madaraka_Express",
  "serra-verde":            "Morretes",   // train article has no thumb; use the destination town
  // Expansion 2026
  "italo-rome-naples":      "AGV_575",     // the trainset Italo uses; only article with a thumb
  "lumo-london-edinburgh":  "Lumo_(train_operating_company)",
  "iryo-madrid-barcelona":  "Iryo",
  "ave-madrid-barcelona":   "Madrid–Barcelona_high-speed_rail_line",
  "ice-hamburg-munich":     "Intercity-Express",
  "golden-pass":            "GoldenPass_Line",
  "hayabusa-tokyo-shin-aomori": "Hayabusa_(train)",
  "trans-mongolian":        "Trans-Mongolian_Railway",
  "hiram-bingham":          "Belmond_Hiram_Bingham",
  "avanti-london-glasgow":  "Avanti_West_Coast",
  "central-andino":         "Ferrocarril_Central_Andino",
};

// Some article slugs return only an icon as the page thumbnail; for those we
// override with a specific File: page on Commons. The script falls through to
// these when the REST summary fails or returns nothing useful.
const COMMONS_FALLBACK = {
  // Add entries here as misses are discovered.
};

const SUMMARY = (slug) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;

async function fetchOne(id, route) {
  const slug = SLUG_OVERRIDES[id] || route.name.replace(/\s+/g, "_");
  const url = SUMMARY(slug);
  const r = await fetch(url, {
    headers: {
      "User-Agent": "ChooChooChooser/0.1 (https://github.com/1seansean1/choo-choo-chooser)",
      "Accept": "application/json",
    },
  });
  if (!r.ok) return { id, slug, error: `HTTP ${r.status}` };
  const j = await r.json();
  if (j.type !== "standard" && j.type !== "disambiguation") {
    return { id, slug, error: `not a standard page: ${j.type}` };
  }
  if (!j.thumbnail || !j.thumbnail.source) {
    return { id, slug, error: "no thumbnail in summary" };
  }
  return {
    id,
    slug,
    title: j.title,
    description: j.description,
    thumbnail_url: j.thumbnail.source,
    thumbnail_width: j.thumbnail.width,
    thumbnail_height: j.thumbnail.height,
    original_url: j.originalimage ? j.originalimage.source : j.thumbnail.source,
    source_page: j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`,
    attribution: "Wikipedia / Wikimedia Commons",
  };
}

(async function main() {
  const out = {};
  const misses = [];
  let ok = 0, miss = 0;
  for (const r of ROUTES) {
    process.stdout.write(`  ${r.id.padEnd(28)} `);
    try {
      const res = await fetchOne(r.id, r);
      if (res.error) {
        process.stdout.write(`MISS  (${res.slug})  ${res.error}\n`);
        misses.push({ id: r.id, name: r.name, slug: res.slug, error: res.error });
        miss++;
      } else {
        process.stdout.write(`ok    ${res.title}  ${res.thumbnail_width}x${res.thumbnail_height}\n`);
        out[r.id] = res;
        ok++;
      }
    } catch (e) {
      process.stdout.write(`THROW ${e.message}\n`);
      misses.push({ id: r.id, name: r.name, error: e.message });
      miss++;
    }
    // be polite to wikipedia
    await new Promise((res) => setTimeout(res, 120));
  }

  writeFileSync(
    "src/data/route-images.json",
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source: "https://en.wikipedia.org/api/rest_v1/page/summary",
        license_note:
          "Images hosted by Wikimedia Commons; individual licenses vary (mostly CC-BY-SA or public domain). Each entry's source_page links to the article where licensing is stated.",
        images: out,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`\nWrote src/data/route-images.json — ${ok}/${ROUTES.length} ok, ${miss} miss`);
  if (misses.length) {
    console.log("\nMisses (add to SLUG_OVERRIDES or COMMONS_FALLBACK):");
    for (const m of misses) console.log(" ", JSON.stringify(m));
  }
})();
