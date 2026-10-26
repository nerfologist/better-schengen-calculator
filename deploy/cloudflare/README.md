# Security headers and caching

GitHub Pages cannot set response headers. To get `frame-ancestors`, HSTS,
`nosniff`, and long-lived caching for hashed assets, put Cloudflare in front of
the site (or deploy the same build to Cloudflare Pages).

The build emits `dist/_headers` from `vite.config.ts`. It contains:

- a CSP with `frame-ancestors 'none'`, `upgrade-insecure-requests`, and the
  GoatCounter origin derived from `src/analytics/config.ts`
- `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`
- `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`
- `no-cache` for `/sw.js`, `/index.html`, and `/manifest.webmanifest`

The meta CSP in `index.html` remains as a fallback. When both a header and a
meta policy are present, browsers enforce the intersection, so the header can
only add restrictions (such as `frame-ancestors`) without weakening the meta
policy.

## Option A: Cloudflare proxy in front of GitHub Pages

1. In the Cloudflare DNS dashboard, proxy the apex and `www` records (orange
   cloud) and set SSL/TLS mode to **Full (strict)**.
2. Add a **Transform Rule > Modify response header** for
   `schengen-days.com/*` with the headers from `dist/_headers`. Cloudflare
   allows multiple `set` operations per rule; split them across rules if the
   dashboard limit requires it.
3. Add **Cache Rules**:
   - `/assets/*`: Edge TTL and Browser TTL one year; the filenames are hashed.
   - `/sw.js`, `/index.html`, `/manifest.webmanifest`: bypass cache / no-store
     so a deploy is picked up immediately.
   - Images and other static files: one month.
4. Verify with `curl -sI https://schengen-days.com/` and
   `curl -sI https://schengen-days.com/assets/<file>.js`.

HSTS caution: enable `includeSubDomains` only if every subdomain is HTTPS.
Do not submit to the preload list until that is permanently true.

## Option B: Cloudflare Pages

`dist/_headers` is read automatically when it is present at the deployment
root:

```sh
npm run build
npx wrangler pages deploy dist --project-name schengen-days
```

Point the custom domain at the Pages project and keep the same DNS/SSL checks.
Because the build emits the file, the CSP cannot drift from `SITE_CODE`.

## Why not a meta tag only?

`frame-ancestors` and `sandbox` are ignored in a `<meta http-equiv>` CSP, so a
meta-only policy cannot prevent framing. A JavaScript frame-buster is not a
substitute for the header.
