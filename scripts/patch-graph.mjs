// Runs after `quartz build`. The graph plugin has no options for these, so this edits its
// built script directly:
// - Node colors match the Obsidian graph: sources blue, everything else in the theme's text
//   color (white in dark mode, near-black in light mode, where white would vanish).
// - The homepage's graph panel shows the whole graph. The homepage itself is pruned from the
//   graph (see prune-graph.mjs), so its usual depth-1 local graph was a single dot. The
//   plugin normalizes the homepage slug "index" to "/". Repulsion pushes disconnected clusters
//   apart indefinitely, so a custom "gravity" force pulls nodes toward the center and stops
//   them at the panel's edges.
// - Labels ignore the pointer, so a neighbor's title drawn over a node can't steal its hover.
// - Nodes are only 2-4px in radius, so hovering missed unless the cursor was dead center.
//   Each node's hit area is widened by the same 5px the plugin already allows for dragging,
//   kept constant on screen when zoomed out. Where widened areas overlap, the node whose
//   center is nearest the cursor wins, so a crowded neighbor can't take over a node.
// Matches the minified code exactly and fails the build if a plugin update changes it.
import fs from "node:fs"
import path from "node:path"

const SOURCE_COLOR = "#3633ff"
const HIT_SLOP = 5
// Tighter forces than the full-screen graph so every node fits in the small sidebar panel.
const HOMEPAGE_GRAPH = { depth: -1, repelForce: 0.2, linkDistance: 10, gravity: 0.1 }
const EDGE_MARGIN = 8

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
  {
    name: "wider node hit area",
    find: 'U.eventMode="static",U.cursor="pointer"',
    replace: `U.hitArea=(function(r,me){return{contains:function(x,y){var R=r+${HIT_SLOP}/Math.min(j.k,1),d=x*x+y*y;if(d>R*R)return!1;for(var px=me.position.x+x,py=me.position.y+y,i=0;i<P.length;i++){var q=P[i].gfx;if(q!==me){var dx=q.position.x-px,dy=q.position.y-py;if(dx*dx+dy*dy<d)return!1}}return!0}}})(Tu,U),U.eventMode="static",U.cursor="pointer"`,
  },
  {
    name: "homepage gravity",
    find: 'ou.on("tick",function(){})',
    replace: `ou.on("tick",function(){}),S.gravity&&ou.force("gravity",function(al){for(var i=0;i<ru.length;i++){var n=ru[i],mx=O/2-${EDGE_MARGIN},my=G/2-${EDGE_MARGIN};n.vx-=n.x*S.gravity*al,n.vy-=n.y*S.gravity*al,n.vx=Math.max(-mx-n.x,Math.min(mx-n.x,n.vx)),n.vy=Math.max(-my-n.y,Math.min(my-n.y,n.vy))}})`,
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
