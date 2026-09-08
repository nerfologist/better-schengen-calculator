import { useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react'

export interface FaqDialogProps {
  open: boolean
  onClose: () => void
}

const FAQ_ITEMS: { question: string; answer: ReactNode }[] = [
  {
    question: 'What is the rule, in one sentence?',
    answer: (
      <p>
        As a visitor to the Schengen area, you may be inside it for at most{' '}
        <strong>90 days within any 180-day period</strong>.
      </p>
    ),
  },
  {
    question: 'What does "any 180-day period" mean?',
    answer: (
      <p>
        It is a <strong>moving window</strong>, not a fixed calendar period. On every
        single day of a visit, look back at the last 180 days (that day included) and
        count how many of them you spent in the Schengen area. That count must never go
        above 90. Because the window moves forward one day at a time, each old travel day
        stops counting exactly 180 days after it happened.
      </p>
    ),
  },
  {
    question: 'Do arrival and departure days count?',
    answer: (
      <p>
        Yes. The day you enter and the day you leave both count as full days in the
        Schengen area, even if you arrive five minutes before midnight.
      </p>
    ),
  },
  {
    question: 'Do my days reset when I leave?',
    answer: (
      <p>
        No. Leaving does not reset anything. Each day you spent inside keeps counting
        against you until it slides out of the back of the 180-day window. This is why
        "90 days in, 90 days out" works: after 90 full days outside, your old days have
        aged enough to allow a new full stay.
      </p>
    ),
  },
  {
    question: 'A quick example, please',
    answer: (
      <p>
        Say you spent all of January and February in the Schengen area, roughly 59 days,
        then went home. If you come back on June 1st, the window ending on any June day
        still contains those winter days, so you have only about 31 days available. But
        every day you wait after the end of July, a January day drops out of the window
        and gives you a day back. The calculator does exactly this arithmetic for every
        day of your planned trip.
      </p>
    ),
  },
  {
    question: 'Who does this rule apply to?',
    answer: (
      <p>
        Non-EU nationals visiting the Schengen area visa-free or on a short-stay (type C)
        visa. It does not apply to holders of residence permits or long-stay national
        visas for a Schengen country. Note that the Schengen area is not the same as the
        EU: for example, Ireland is in the EU but not in Schengen, while Norway, Iceland,
        Switzerland and Liechtenstein are in Schengen but not in the EU. Overstaying can
        mean fines, deportation, and entry bans, so when in doubt verify with the border
        authorities of the country you visit.
      </p>
    ),
  },
]

export function FaqDialog({ open, onClose }: FaqDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      // Fresh start on every visit: all questions collapsed.
      for (const item of dialog.querySelectorAll('details[open]')) {
        ;(item as HTMLDetailsElement).open = false
      }
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Exclusive accordion: opening a question closes the others. The DOM owns
  // the open state (React-controlled `open` fights native summary toggling).
  const closeSiblings = (e: SyntheticEvent<HTMLDetailsElement>) => {
    const opened = e.currentTarget
    if (!opened.open || !ref.current) return
    for (const other of ref.current.querySelectorAll('details[open]')) {
      if (other !== opened) (other as HTMLDetailsElement).open = false
    }
  }

  return (
    <dialog
      ref={ref}
      className="faq-dialog"
      aria-labelledby="faq-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="faq-header">
        <h2 id="faq-title" className="confirm-title">
          How the 90/180 rule works
        </h2>
        <button type="button" className="btn btn-small" onClick={onClose} aria-label="Close">
          Close
        </button>
      </div>
      {FAQ_ITEMS.map((item) => (
        <details key={item.question} className="tool" onToggle={closeSiblings}>
          <summary>{item.question}</summary>
          <div className="tool-body">{item.answer}</div>
        </details>
      ))}
    </dialog>
  )
}
