// Copies the public parts of the Obsidian vault into content/ and regenerates the homepage.
// Only the folders in PUBLIC are published; everything else in the vault stays private.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const VAULT = path.join(os.homedir(), "Desktop", "Second Brain", "Books")
const CONTENT = path.resolve(import.meta.dirname, "..", "content")
const PUBLIC = ["Sources", "Ideas", "Definitions"]

if (!fs.existsSync(VAULT)) {
  console.error(`Vault not found at ${VAULT}`)
  process.exit(1)
}

fs.mkdirSync(CONTENT, { recursive: true })
for (const dir of PUBLIC) {
  execFileSync("rsync", [
    "-a",
    "--delete",
    "--exclude=.DS_Store",
    `${path.join(VAULT, dir)}/`,
    `${path.join(CONTENT, dir)}/`,
  ])
}
fs.copyFileSync(path.join(VAULT, "Meta", "Library.base"), path.join(CONTENT, "Library.base"))

// Minimal frontmatter reader: the book notes only use flat `key: value` pairs.
function frontmatter(file) {
  const match = fs.readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/)
  const data = {}
  for (const line of match?.[1].split("\n") ?? []) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "")
  }
  return data
}

const booksDir = path.join(VAULT, "Sources", "Books")
const books = fs
  .readdirSync(booksDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ title: f.slice(0, -3), ...frontmatter(path.join(booksDir, f)) }))
  .sort((a, b) => (b.consumed ?? "").localeCompare(a.consumed ?? "") || a.title.localeCompare(b.title))

const bookLines = books.map((b) => {
  const byline = [b.author, b.year].filter(Boolean).join(", ")
  return `- [[${b.title}]]${byline ? ` · ${byline}` : ""}`
})

// The Definitions link is a full URL because Quartz resolves any relative "Definitions"
// link to Sources/Definitions.md instead of the Definitions/ folder page.
const index = `---
title: Second Brain
---

Ideas from the books I've read. Each idea is its own short note, linked to the book it came from and to related ideas from other books.

Open a book to see its ideas listed under **Backlinks**, or open the full graph (the icon in the top-right corner of **Graph View**) to see how ideas connect across books.

## Books

${bookLines.join("\n")}

## More

- [[Library.base|Library]]: every book and idea in one table
- [[Ideas/Original Ideas/index|Original Ideas]]
- [Definitions](https://alexxlevesque.github.io/second-brain/definitions/): terms I've coined
`

fs.writeFileSync(path.join(CONTENT, "index.md"), index)
console.log(`Synced ${books.length} books from ${VAULT}`)
