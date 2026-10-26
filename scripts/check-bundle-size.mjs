import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const BUDGETS = {
  '.js': 90 * 1024,
  '.css': 10 * 1024,
}

function gzipTotal(extension) {
  const files = readdirSync('dist/assets').filter((name) => name.endsWith(extension))
  let total = 0
  for (const file of files) {
    total += gzipSync(readFileSync(`dist/assets/${file}`)).length
  }
  return total
}

let failed = false
for (const [extension, budget] of Object.entries(BUDGETS)) {
  const actual = gzipTotal(extension)
  const status = actual <= budget ? 'ok' : 'OVER BUDGET'
  console.log(
    `${extension.slice(1).toUpperCase()}: ${(actual / 1024).toFixed(1)} KiB gzip ` +
      `(budget ${(budget / 1024).toFixed(0)} KiB) - ${status}`,
  )
  if (actual > budget) failed = true
}

if (failed) process.exit(1)
