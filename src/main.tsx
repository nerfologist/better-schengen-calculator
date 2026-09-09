import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { initAnalytics } from './analytics/goatcounter.ts'
import App from './App.tsx'
import { StaysProvider } from './state/StaysContext.tsx'

registerSW({ immediate: true })
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StaysProvider>
      <App />
    </StaysProvider>
  </StrictMode>,
)
