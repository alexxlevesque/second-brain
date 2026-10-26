// Runs after `quartz build`. The graph plugin has no options for these, so this edits its
// built script directly:
// - Node colors match the Obsidian graph: sources blue, everything else in the theme's text
//   color (white in dark mode, near-black in light mode, where white would vanish).
// - The homepage's graph panel shows the whole graph. The homepage itself is pruned from the
//   graph (see prune-graph.mjs), so its usual depth-1 local graph was a single dot. The
//   plugin normalizes the homepage slug "index" to "/".
// - Labels ignore the pointer, so a neighbor's title drawn over a node can't steal its hover.
// Matches the minified code exactly and fails the build if a plugin update changes it.
import fs from "node:fs"
import path from "node:path"

const SOURCE_COLOR = "#3633ff"
// Tighter forces than the full-screen graph so every node fits in the small sidebar panel.
const HOMEPAGE_GRAPH = { depth: -1, repelForce: 0.2, linkDistance: 10 }

const PATCHES = [
  {
    name: "node colors",
    find: 'function $e(i){var l=i.id===g;return l?Ie:K.has(i.id)||i.id.startsWith("tags/")?Qu:ue}',
    replace: `function $e(i){return i.id.startsWith("sources/")?h("${SOURCE_COLOR}","${SOURCE_COLOR}"):ze}`,
  },
  {
    name: "homepage graph",
    find: 'var S=JSON.parse(_.dataset.cfg||"{}")',
    replace: `var S=Object.assign(JSON.parse(_.dataset.cfg||"{}"),g==="/"&&!_.closest(".global-graph-outer")?${JSON.stringify(HOMEPAGE_GRAPH)}:{})`,
  },
  {
    name: "labels ignore pointer",
    find: "Du.anchor.set(.5,1.2),Du.alpha=0",
    replace: 'Du.anchor.set(.5,1.2),Du.eventMode="none",Du.alpha=0',
  },
]

const dir = path.resolve(import.meta.dirname, "..", "public", "static", "scripts")
const file = fs
  .readdirSync(dir)
  .map((f) => path.join(dir, f))
  .find((f) => f.endsWith(".js") && fs.readFileSync(f, "utf8").includes("forceManyBody"))
if (!file) {
  console.error("Graph script not found in public/static/scripts")
  process.exit(1)
}

let code = fs.readFileSync(file, "utf8")
for (const { name, find, replace } of PATCHES) {
  if (code.split(find).length !== 2) {
    console.error(`Graph patch "${name}" no longer matches ${path.basename(file)}; the graph plugin changed`)
    process.exit(1)
  }
  code = code.replace(find, () => replace)
}
fs.writeFileSync(file, code)
console.log(`Applied ${PATCHES.length} graph patches to ${path.basename(file)}`)
