// Runs after `quartz build`. The graph draws every entry in contentIndex.json as a node,
// including tag and folder pages, which have no links and float around the edge as orphans,
// and the Library base, which links to every note and becomes one giant hub.
// Dropping them matches the Obsidian graph (tags, orphans and .base files hidden). The explorer
// rebuilds folders from the notes' own paths, so it doesn't need the folder entries.
import fs from "node:fs"
import path from "node:path"

const file = path.resolve(import.meta.dirname, "..", "public", "static", "contentIndex.json")
const index = JSON.parse(fs.readFileSync(file, "utf8"))
const isHidden = (slug) =>
  slug.startsWith("tags/") || slug.endsWith("/index") || slug.endsWith(".base")

let removed = 0
for (const slug of Object.keys(index)) {
  if (isHidden(slug)) {
    delete index[slug]
    removed++
  }
}
fs.writeFileSync(file, JSON.stringify(index))
console.log(`Removed ${removed} tag, folder and base pages from the graph`)
