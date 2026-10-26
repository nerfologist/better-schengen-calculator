# Schengen Days

A better Schengen 90/180-day short-stay calculator. Unlike the official EU
calculator, it remembers your stays between visits, works well on phones, and
shows your situation on a calendar timeline.

## Features

- **Persistent stays**: date ranges are stored on-device (localStorage) and
  survive browser exits and reboots. Export/import a JSON backup for safety or
  to move data between devices.
- **Timeline**: the last 7 months plus the next one, with your stays, the
  rolling 180-day window start, and today highlighted.
- **Summary**: days used in the current window, days available today, and the
  latest exit date if you entered today.
- **Trip planning**: given an entry date, the latest allowed exit date; given a
  proposed date range, whether it complies with the 90/180 rule (and if not,
  when it breaks and by how much). Planned stays already recorded in the
  future are taken into account.
- **PWA**: installable on a phone's home screen, fully offline-capable.
- **Local-only by default**: stays never leave the device. A **Delete all data**
  button removes stays, quarantined payloads, and planning inputs; see the
  [privacy note](https://schengen-days.com/privacy.html).

## The rule

Third-country nationals under the short-stay regime may spend at most **90
days in any 180-day period** in the Schengen area. Entry and exit days both
count. Compliance must hold on every day of presence: for each such day, the
180 days ending on it (inclusive) must contain at most 90 days of presence.

The core logic lives in `src/domain/` as pure TypeScript with a test suite of
hand-verified scenarios (`npm test`). Dates are handled as integer day numbers
derived from UTC calendar dates, so timezone and DST bugs are impossible by
construction.

## Development

```sh
npm install
npm run dev             # dev server
npm run lint            # oxlint
npm test                # vitest watch mode (npm test -- --run for one pass)
npm run build           # type-check + production build with PWA assets
npm run preview         # serve the production build
npm run size            # enforce gzipped JS/CSS budgets for dist/assets
npm run verify:vendor   # check public/count.js against its pinned SHA-384
```

## Analytics

Anonymous, cookieless usage analytics via [GoatCounter](https://www.goatcounter.com)
(pageviews plus feature-usage events; stay data never leaves the device).
`src/analytics/config.ts` holds the site code; set it to the code of a
GoatCounter account, or leave it empty to disable analytics. The CSP in both
the meta tag and the generated `_headers` derives the allowed origin from that
same value.

`public/count.js` is vendored and loaded with a SHA-384 integrity attribute
pinned in `src/analytics/vendor.ts`. `npm run verify:vendor` (also run in CI)
fails if the two drift. Analytics is always disabled in dev builds. The
[privacy note](public/privacy.html) documents what the endpoint receives and
the `#toggle-goatcounter` opt-out.

## Deployment

Every push to `main` and every pull request runs lint, the dependency audit,
the vendored-script check, tests, the production build, and the bundle-size
budget (`ci.yml`). Pull requests also get a dependency review. Deployment to
GitHub Pages happens only when a release is published (`deploy.yml`); manual
`workflow_dispatch` deploys are restricted to `main`, e.g.:

```sh
gh release create v0.2.0 --generate-notes
```

The deploy builds the tagged commit, gated by the test suite. It can also be
triggered manually from the Actions tab (workflow_dispatch). The site is
served at https://schengen-days.com (custom domain configured in the repo's
Pages settings; DNS on Cloudflare, proxy off, apex A records to the GitHub
Pages IPs plus a www CNAME to nerfologist.github.io). In the repo settings,
set Pages > Source to "GitHub Actions".

The build emits `dist/_headers` with `frame-ancestors`, HSTS, `nosniff`,
`Permissions-Policy`, COOP, and cache rules. GitHub Pages ignores it, so the
meta CSP in `index.html` remains the active policy. To apply the stronger
header policy, put Cloudflare in front of Pages or deploy the same `dist` to
Cloudflare Pages; see [`deploy/cloudflare/README.md`](deploy/cloudflare/README.md).

## Disclaimer

Informational only, not legal advice. Verify against the
[official EU calculator](https://ec.europa.eu/assets/home/visa-calculator/calculator.htm?lang=en)
and the authorities of the country you visit.
