import { useCallback, useState } from 'react'
import { track } from './analytics/goatcounter'
import { ExportImport } from './components/ExportImport'
import { FaqDialog } from './components/FaqDialog'
import { StayList } from './components/StayList'
import { SummaryCards } from './components/SummaryCards'
import { Timeline } from './components/Timeline/Timeline'
import { MaxStayTool } from './components/tools/MaxStayTool'
import { ProposedStayTool } from './components/tools/ProposedStayTool'
import type { PlanRecap } from './components/tools/recap'
import type { DayRange } from './domain/types'
import { useStays } from './state/StaysContext'
import { formatDayShort } from './ui/format'

export default function App() {
  const { violations } = useStays()
  const [maxPreview, setMaxPreview] = useState<DayRange | null>(null)
  const [proposedPreview, setProposedPreview] = useState<DayRange | null>(null)
  const [maxRecap, setMaxRecap] = useState<PlanRecap | null>(null)
  const [proposedRecap, setProposedRecap] = useState<PlanRecap | null>(null)
  const [faqOpen, setFaqOpen] = useState(false)
  const openFaq = useCallback(() => {
    setFaqOpen(true)
    track('faq-opened')
  }, [])

  const onMaxPreview = useCallback((r: DayRange | null) => setMaxPreview(r), [])
  const onProposedPreview = useCallback(
    (r: DayRange | null) => setProposedPreview(r),
    [],
  )
  const onMaxRecap = useCallback((r: PlanRecap | null) => setMaxRecap(r), [])
  const onProposedRecap = useCallback((r: PlanRecap | null) => setProposedRecap(r), [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Schengen Days</h1>
        <p className="muted">
          Track your short stays under the 90-days-in-any-180-days rule.{' '}
          <button type="button" className="link-button" onClick={openFaq}>
            How does the rule work?
          </button>
        </p>
      </header>

      {violations.length > 0 && (
        <div className="banner-danger" role="alert">
          Your recorded stays already exceed 90/180 around{' '}
          {violations
            .map((v) => `${formatDayShort(v.start)} (peak ${v.peak}/90)`)
            .join(', ')}
          . Double-check the dates you entered.
        </div>
      )}

      <StayList />

      <SummaryCards recap={proposedRecap ?? maxRecap} />
      <Timeline preview={proposedPreview ?? maxPreview} />

      <section aria-label="Planning tools">
        <h2>Plan a trip</h2>
        <MaxStayTool onPreview={onMaxPreview} onRecap={onMaxRecap} />
        <ProposedStayTool onPreview={onProposedPreview} onRecap={onProposedRecap} />
      </section>

      <FaqDialog open={faqOpen} onClose={() => setFaqOpen(false)} />

      <footer className="app-footer">
        <ExportImport />
        <p className="muted">
          Data is stored only on this device. This tool is informational and not
          legal advice: read{' '}
          <button type="button" className="link-button" onClick={openFaq}>
            how the 90/180 rule works
          </button>
          , and verify with the{' '}
          <a
            href="https://ec.europa.eu/assets/home/visa-calculator/calculator.htm?lang=en"
            target="_blank"
            rel="noreferrer"
          >
            official EU calculator
          </a>{' '}
          and the authorities of the country you visit. Anonymous, cookie-free
          usage statistics are collected; your travel data never leaves your
          device.
        </p>
        <p className="muted app-credits">
          Made by{' '}
          <a href="https://github.com/nerfologist" target="_blank" rel="noreferrer">
            nerfologist
          </a>
          . © 2026, all rights reserved. Is this tool useful to you?{' '}
          <a
            href="https://buymeacoffee.com/nerfologist"
            target="_blank"
            rel="noreferrer"
            onClick={() => track('donate-clicked')}
          >
            ☕ Buy me a coffee
          </a>
        </p>
      </footer>
    </div>
  )
}
