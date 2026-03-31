import fs from "node:fs"
import path from "node:path"

const messagesDir = path.resolve(process.cwd(), "messages")
const localeFiles = fs
  .readdirSync(messagesDir)
  .filter((file) => file.endsWith(".json"))
  .sort()

if (localeFiles.length < 2) {
  console.error("[i18n] At least two locale files are required to compare message catalogs.")
  process.exit(1)
}

function flattenMessages(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenMessages(nestedValue, prefix ? `${prefix}.${key}` : key),
  )
}

const catalogs = localeFiles.map((fileName) => {
  const filePath = path.join(messagesDir, fileName)
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
  return {
    fileName,
    filePath,
    keys: new Set(flattenMessages(content)),
  }
})

const reference = catalogs[0]
let hasErrors = false

for (const catalog of catalogs.slice(1)) {
  const missingInCurrent = [...reference.keys].filter((key) => !catalog.keys.has(key)).sort()
  const extraInCurrent = [...catalog.keys].filter((key) => !reference.keys.has(key)).sort()

  if (missingInCurrent.length === 0 && extraInCurrent.length === 0) {
    continue
  }

  hasErrors = true

  console.error(`\n[i18n] Catalog mismatch: ${catalog.fileName} <> ${reference.fileName}`)

  if (missingInCurrent.length > 0) {
    console.error(`[i18n] Missing keys in ${catalog.fileName}:`)
    for (const key of missingInCurrent) {
      console.error(`  - ${key}`)
    }
  }

  if (extraInCurrent.length > 0) {
    console.error(`[i18n] Extra keys in ${catalog.fileName}:`)
    for (const key of extraInCurrent) {
      console.error(`  + ${key}`)
    }
  }
}

if (hasErrors) {
  process.exit(1)
}

console.log(`[i18n] All ${localeFiles.length} locale catalogs are in sync.`)
