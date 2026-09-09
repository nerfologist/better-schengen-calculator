import { useRef, useState } from 'react'
import { track } from '../analytics/goatcounter'
import { useStays } from '../state/StaysContext'
import { exportJson, importJson } from '../storage/staysRepo'

export function ExportImport() {
  const { stays, dispatch } = useStays()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function doExport() {
    const blob = new Blob([exportJson(stays)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'schengen-stays.json'
    a.click()
    URL.revokeObjectURL(url)
    track('backup-exported')
  }

  async function doImport(file: File) {
    try {
      const imported = importJson(await file.text())
      if (
        stays.length > 0 &&
        !window.confirm(
          `Replace your ${stays.length} recorded stay(s) with the ${imported.length} from this file?`,
        )
      ) {
        return
      }
      dispatch({ type: 'replaceAll', stays: imported })
      setMessage(`Imported ${imported.length} stay(s).`)
      track('backup-imported')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <div className="export-import">
      <button className="btn" onClick={doExport} disabled={stays.length === 0}>
        Export backup
      </button>
      <button className="btn" onClick={() => fileInput.current?.click()}>
        Import backup
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void doImport(file)
          e.target.value = ''
        }}
      />
      {message && <p className="muted">{message}</p>}
    </div>
  )
}
