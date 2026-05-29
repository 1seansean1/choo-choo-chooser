import { describe, it, expect } from "vitest";
import { ROUTES } from "../src/data/index.js";
import imagesDoc from "../src/data/route-images.json";

describe("route-images.json", () => {
  it("every catalog route has an image entry", () => {
    const missing = ROUTES.filter((r) => !imagesDoc.images[r.id]).map((r) => r.id);
    expect(missing, `routes without image: ${missing.join(", ")}`).toEqual([]);
  });

  it("every image entry has a hotlinkable thumbnail URL on upload.wikimedia.org", () => {
    for (const r of ROUTES) {
      const img = imagesDoc.images[r.id];
      expect(img.thumbnail_url, r.id).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
    }
  });

  it("every image entry carries a Wikipedia source_page for attribution", () => {
    for (const r of ROUTES) {
      const img = imagesDoc.images[r.id];
      expect(img.source_page, r.id).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//);
    }
  });
});
