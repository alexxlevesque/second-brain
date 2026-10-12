// Runs after `quartz build`. The graph draws every entry in contentIndex.json as a node,
// including tag and folder pages, which have no links and float around the edge as orphans,
// the Library base, which links to every note and becomes one giant hub, and the homepage,
// whose links to every book knot all the books together in the middle.
// Dropping them matches the Obsidian graph (tags, orphans and .base files hidden; the
// homepage hides its graph panel in quartz.config.yaml). The explorer
// rebuilds folders from the notes' own paths, so it doesn't need the folder entries.
import fs from "node:fs"
import path from "node:path"

const file = path.resolve(import.meta.dirname, "..", "public", "static", "contentIndex.json")
const index = JSON.parse(fs.readFileSync(file, "utf8"))
const isHidden = (slug) =>
  slug === "index" || slug.startsWith("tags/") || slug.endsWith("/index") || slug.endsWith(".base")

let removed = 0
for (const slug of Object.keys(index)) {
  if (isHidden(slug)) {
    delete index[slug]
    removed++
  }
}
fs.writeFileSync(file, JSON.stringify(index))
console.log(`Removed ${removed} homepage, tag, folder and base pages from the graph`)
