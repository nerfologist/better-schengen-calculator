import { useCallback, useState } from 'react'
import { ExportImport } from './components/ExportImport'
import { StayList } from './components/StayList'
import { SummaryCards } from './components/SummaryCards'
import { Timeline } from './components/Timeline/Timeline'
import { MaxStayTool } from './components/tools/MaxStayTool'
import { ProposedStayTool } from './components/tools/ProposedStayTool'
import type { DayRange } from './domain/types'
import { useStays } from './state/StaysContext'
import { formatDayShort } from './ui/format'

export default function App() {
  const { violations } = useStays()
  const [maxPreview, setMaxPreview] = useState<DayRange | null>(null)
  const [proposedPreview, setProposedPreview] = useState<DayRange | null>(null)

  const onMaxPreview = useCallback((r: DayRange | null) => setMaxPreview(r), [])
  const onProposedPreview = useCallback(
    (r: DayRange | null) => setProposedPreview(r),
    [],
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Schengen Days</h1>
        <p className="muted">
          Track your short stays under the 90-days-in-any-180-days rule.
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

      <SummaryCards />
      <Timeline preview={proposedPreview ?? maxPreview} />

      <section aria-label="Planning tools">
        <h2>Plan a trip</h2>
        <MaxStayTool onPreview={onMaxPreview} />
        <ProposedStayTool onPreview={onProposedPreview} />
      </section>

      <StayList />

      <footer className="app-footer">
        <ExportImport />
        <p className="muted">
          Data is stored only on this device. This tool is informational and not
          legal advice; verify with the{' '}
          <a
            href="https://ec.europa.eu/assets/home/visa-calculator/calculator.htm?lang=en"
            target="_blank"
            rel="noreferrer"
          >
            official EU calculator
          </a>{' '}
          and the authorities of the country you visit.
        </p>
      </footer>
    </div>
  )
}
