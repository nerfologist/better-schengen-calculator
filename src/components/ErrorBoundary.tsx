import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CORRUPT_KEY, STORAGE_KEY } from '../storage/schema'
import { clearAllData } from '../storage/staysRepo'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Last-resort recovery screen. It keeps the stored payload untouched and
 * offers it as a download before the user chooses to reset anything.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  private download = () => {
    const payload = {
      note: 'Raw Schengen Days data recovered after a UI error.',
      data: readRaw(STORAGE_KEY),
      corrupt: readRaw(CORRUPT_KEY),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'schengen-stays-recovery.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  private reset = () => {
    if (
      !window.confirm(
        'Delete all stays and planning dates stored on this device? Download a copy first if you need it. This cannot be undone.',
      )
    ) {
      return
    }
    // clearAllData also removes PLAN_KEYS and the quarantined payload, and
    // tolerates storage being blocked.
    clearAllData()
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="app">
        <div className="banner-danger" role="alert">
          <strong>Something went wrong.</strong> Your saved data has not been deleted.
          Download a copy before trying again, or reset the local data if the error
          keeps happening.
          <br />
          <span className="muted">{error.message}</span>
        </div>
        <div className="stay-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <button type="button" className="btn" onClick={this.download}>
            Download data
          </button>
          <button type="button" className="btn btn-danger" onClick={this.reset}>
            Reset local data
          </button>
        </div>
      </div>
    )
  }
}
