import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const script = readFileSync(new URL('public/count.js', root))
const actual = createHash('sha384').update(script).digest('base64')

const source = readFileSync(new URL('src/analytics/vendor.ts', root), 'utf8')
const match = /COUNT_JS_SHA384\s*=\s*'([^']+)'/.exec(source)

if (!match) {
  console.error('Could not find COUNT_JS_SHA384 in src/analytics/vendor.ts')
  process.exit(1)
}
if (match[1] !== actual) {
  console.error('public/count.js does not match the pinned SHA-384 digest.')
  console.error(`  expected: ${match[1]}`)
  console.error(`  actual:   ${actual}`)
  console.error('Update public/count.js and src/analytics/vendor.ts together.')
  process.exit(1)
}

console.log(`Vendored count.js integrity verified (sha384-${actual}).`)
