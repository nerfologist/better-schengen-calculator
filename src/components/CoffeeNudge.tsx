import { track } from '../analytics/goatcounter'

/** Small donation prompt shown at moments the tool just helped someone. */
export function CoffeeNudge({ placement }: { placement: string }) {
  return (
    <p className="coffee-nudge">
      Did this help you plan?{' '}
      <a
        href="https://buymeacoffee.com/nerfologist"
        target="_blank"
        rel="noreferrer"
        onClick={() => track(`donate-clicked-${placement}`)}
      >
        ☕ Buy me a coffee
      </a>
    </p>
  )
}
