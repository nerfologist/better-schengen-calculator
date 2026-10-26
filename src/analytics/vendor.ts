/**
 * Integrity of the vendored analytics script (public/count.js), originally
 * fetched from https://gc.zgo.at/count.js.
 *
 * Count.js has no version string, so the SHA-384 digest is the pin. Refresh
 * public/count.js and this digest together; `npm run verify:vendor` (also run
 * in CI) fails if they drift.
 */
export const COUNT_JS_SHA384 =
  '2UjvVpptg4JlEVgJI2PdscrjOjPcil/4F1ZvIMJ81CShQnEDSlPI+l4PfogvTLYi'
