/**
 * GoatCounter analytics: cookieless, anonymous, EU-consent-free.
 *
 * Set SITE_CODE to the code chosen when creating the site on goatcounter.com
 * (e.g. 'schengendays' for https://schengendays.goatcounter.com). While it is
 * empty, or in dev builds, everything here is a no-op. Only feature usage is
 * ever tracked; stay dates and labels never leave the device.
 */
const SITE_CODE = 'nerfologist'

interface GoatCounter {
  count: (opts: { path: string; event?: boolean }) => void
}

declare global {
  interface Window {
    goatcounter?: GoatCounter
  }
}

export function initAnalytics(): void {
  if (!SITE_CODE || !import.meta.env.PROD) return

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = `https://${SITE_CODE}.goatcounter.com/count`
  document.head.appendChild(script)

  window.addEventListener('error', (e) => {
    track(`js-error-${e.error instanceof Error ? e.error.name : 'unknown'}`)
  })
  window.addEventListener('unhandledrejection', () => {
    track('js-unhandled-rejection')
  })
  window.addEventListener('appinstalled', () => {
    track('pwa-installed')
  })
}

/** Record a named feature event. Safe to call unconditionally. */
export function track(event: string): void {
  try {
    window.goatcounter?.count({ path: event, event: true })
  } catch {
    // Analytics must never break the app.
  }
}
