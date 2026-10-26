import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initAnalytics } from './analytics/goatcounter.ts'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { StaysProvider } from './state/StaysContext.tsx'

async function startBackgroundWork() {
  const { registerSW } = await import('virtual:pwa-register')
  registerSW({ immediate: true })
  initAnalytics()
}

// Neither registering the service worker nor loading analytics is needed for
// the first paint. Run them when the browser is idle, with a hard timeout so
// they still happen on busy devices.
function scheduleBackgroundWork() {
  const requestIdle = (
    window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
    }
  ).requestIdleCallback
  if (requestIdle) {
    requestIdle(startBackgroundWork, { timeout: 2000 })
  } else {
    window.setTimeout(startBackgroundWork, 200)
  }
}

if (document.readyState === 'complete') {
  scheduleBackgroundWork()
} else {
  window.addEventListener('load', scheduleBackgroundWork, { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StaysProvider>
        <App />
      </StaysProvider>
    </ErrorBoundary>
  </StrictMode>,
)
