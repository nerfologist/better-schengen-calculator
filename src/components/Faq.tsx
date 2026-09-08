export function Faq() {
  return (
    <section id="faq" aria-label="How the rule works">
      <h2>How the 90/180 rule works</h2>
      <details className="tool">
        <summary>What is the rule, in one sentence?</summary>
        <div className="tool-body">
          <p>
            As a visitor to the Schengen area, you may be inside it for at most{' '}
            <strong>90 days within any 180-day period</strong>.
          </p>
        </div>
      </details>
      <details className="tool">
        <summary>What does "any 180-day period" mean?</summary>
        <div className="tool-body">
          <p>
            It is a <strong>moving window</strong>, not a fixed calendar period. On every
            single day of a visit, look back at the last 180 days (that day included) and
            count how many of them you spent in the Schengen area. That count must never
            go above 90. Because the window moves forward one day at a time, each old
            travel day stops counting exactly 180 days after it happened.
          </p>
        </div>
      </details>
      <details className="tool">
        <summary>Do arrival and departure days count?</summary>
        <div className="tool-body">
          <p>
            Yes. The day you enter and the day you leave both count as full days in the
            Schengen area, even if you arrive five minutes before midnight.
          </p>
        </div>
      </details>
      <details className="tool">
        <summary>Do my days reset when I leave?</summary>
        <div className="tool-body">
          <p>
            No. Leaving does not reset anything. Each day you spent inside keeps counting
            against you until it slides out of the back of the 180-day window. This is why
            "90 days in, 90 days out" works: after 90 full days outside, your old days
            have aged enough to allow a new full stay.
          </p>
        </div>
      </details>
      <details className="tool">
        <summary>A quick example, please</summary>
        <div className="tool-body">
          <p>
            Say you spent all of January and February in the Schengen area, roughly 59
            days, then went home. If you come back on June 1st, the window ending on any
            June day still contains those winter days, so you have only about 31 days
            available. But every day you wait after the end of July, a January day drops
            out of the window and gives you a day back. The calculator above does exactly
            this arithmetic for every day of your planned trip.
          </p>
        </div>
      </details>
      <details className="tool">
        <summary>Who does this rule apply to?</summary>
        <div className="tool-body">
          <p>
            Non-EU nationals visiting the Schengen area visa-free or on a short-stay (type
            C) visa. It does not apply to holders of residence permits or long-stay
            national visas for a Schengen country. Note that the Schengen area is not the
            same as the EU: for example, Ireland is in the EU but not in Schengen, while
            Norway, Iceland, Switzerland and Liechtenstein are in Schengen but not in the
            EU. Overstaying can mean fines, deportation, and entry bans, so when in doubt
            verify with the border authorities of the country you visit.
          </p>
        </div>
      </details>
    </section>
  )
}
