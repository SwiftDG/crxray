import { useEffect, useState } from 'react'
import {
  ArrowRight, ChevronRight, CircleAlert, Clipboard, Clock3, Cookie,
  Download, Eye, Globe2, History, KeyRound, Layers3, LockKeyhole,
  Network, ScanSearch, ShieldCheck, Trash2,
} from 'lucide-react'
import './App.css'

const iconMap = {
  eye: Eye, history: History, tabs: Layers3, cookies: Cookie, network: Network,
  clipboard: Clipboard, downloads: Download, background: Clock3, shield: ShieldCheck,
  privacy: Cookie, globe: Globe2,
}

const demos = [
  {
    id: 'clipsaver', kind: 'extension', name: 'ClipSaver Pro', label: 'Coupon and shopping helper',
    url: 'https://chromewebstore.google.com/detail/clipsaver-pro/demo-risky',
    grade: 'D', score: 78, status: 'High risk signals found',
    summary: 'This extension requests broad access to websites you visit, including access that is not needed for a coupon helper.',
    signals: [
      { iconKey: 'eye', title: 'Reads and changes data on every website', level: 'High concern', detail: 'This can let an extension view page content, alter what you see, and interact with forms across websites.' },
      { iconKey: 'history', title: 'Requests access to browser activity', level: 'High concern', detail: 'This permission can expose details about your open tabs and browsing behaviour.' },
      { iconKey: 'background', title: 'Uses background activity', level: 'Review needed', detail: 'The extension can continue running while you browse, even when its popup is closed.' },
    ],
  },
  {
    id: 'nightreader', kind: 'extension', name: 'Night Reader', label: 'Dark reading mode',
    url: 'https://chromewebstore.google.com/detail/night-reader/demo-safer',
    grade: 'B', score: 24, status: 'Lower risk profile',
    summary: 'This extension requests access that is broadly consistent with applying a dark theme to the pages you visit.',
    signals: [
      { iconKey: 'eye', title: 'Changes page appearance on websites', level: 'Expected', detail: 'A reading-mode extension needs page access to apply a dark theme or adjust text appearance.' },
      { iconKey: 'shield', title: 'Stores settings in your browser', level: 'Expected', detail: 'This lets the extension remember choices such as theme, brightness, and enabled websites.' },
    ],
  },
]

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem('crxray-history')) ?? []
    return saved.filter((entry) => entry.report)
  } catch {
    return []
  }
}

function actionsFor(report) {
  return report.kind === 'website'
    ? [
        'Open the site’s privacy settings before accepting cookies.',
        'Reject optional cookies when that choice is available.',
        'Review the detected tracking signals and share only what you are comfortable with.',
      ]
    : [
        'Check that each permission matches what the extension claims to do.',
        'Review the publisher, privacy policy, and recent user feedback.',
        'Avoid installing the extension until broad or sensitive access is justified.',
      ]
}

function extensionReport(data) {
  return {
    kind: 'extension',
    name: data.name,
    label: `Chrome extension · Manifest V${data.manifestVersion}`,
    source: `Live Chrome Web Store manifest · ${data.extensionId}`,
    grade: data.grade,
    score: data.score,
    status: data.status,
    summary: data.summary,
    signals: data.signals.map((signal) => ({
      ...signal,
      iconKey: signal.key === 'cookies' ? 'cookies' : signal.key === 'tabs' ? 'tabs' : signal.key,
    })),
  }
}

function websiteReport(data) {
  return {
    kind: 'website',
    name: data.title,
    label: data.host,
    source: `Live public page scan · ${data.host}`,
    grade: data.grade,
    score: data.score,
    status: data.status,
    summary: data.summary,
    signals: data.signals.map((signal) => ({
      ...signal,
      iconKey: signal.title.toLowerCase().includes('tracking') ? 'network' : 'privacy',
    })),
  }
}

function App() {
  const [mode, setMode] = useState('extension')
  const [input, setInput] = useState('')
  const [scanState, setScanState] = useState('idle')
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(loadHistory)

  useEffect(() => {
    localStorage.setItem('crxray-history', JSON.stringify(history))
  }, [history])

  const saveReport = (nextReport) => {
    setHistory((current) => [
      {
        id: `${Date.now()}-${nextReport.kind}`,
        scannedAt: new Date().toISOString(),
        report: nextReport,
      },
      ...current,
    ].slice(0, 8))
  }

  const showReport = (nextReport, shouldSave = true) => {
    setReport(nextReport)
    setScanState('complete')
    if (shouldSave) saveReport(nextReport)

    window.setTimeout(() => {
      document.querySelector('#report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const runDemo = (demo) => {
    setMode('extension')
    setInput(demo.url)
    setError('')
    setReport(null)
    setScanState('scanning')
    window.setTimeout(() => showReport(demo), 1300)
  }

  const runLiveScan = async (event) => {
    event.preventDefault()

    if (!input.trim()) {
      setError(mode === 'extension'
        ? 'Paste a Chrome Web Store link or extension ID to begin.'
        : 'Paste a public website URL to begin.')
      return
    }

    setError('')
    setReport(null)
    setScanState('scanning')

    try {
      const endpoint = mode === 'extension'
        ? `/api/scan-extension?input=${encodeURIComponent(input)}`
        : `/api/scan-site?url=${encodeURIComponent(input)}`
      const response = await fetch(endpoint)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'CrxRay could not complete this scan.')

      showReport(mode === 'extension' ? extensionReport(data) : websiteReport(data))
    } catch (scanError) {
      setScanState('idle')
      setError(scanError.message || 'CrxRay could not complete this scan.')
    }
  }

  const resetScan = () => {
    setInput('')
    setError('')
    setReport(null)
    setScanState('idle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scanHint = mode === 'extension'
    ? 'Paste a Chrome Web Store link or extension ID'
    : 'Paste a public website URL'

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#scanner" aria-label="CrxRay home">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>CrxRay</span>
        </a>
        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#scanner">Scanner</a><a href="#examples">Examples</a>
          <a href="#history">History</a><a href="#about">About</a>
        </nav>
        <a className="header-link" href="#scanner">Start a scan <ChevronRight size={15} /></a>
      </header>

      <section className="hero" id="scanner">
        <div className="hero-copy">
          <p className="eyebrow">Browser privacy, explained clearly</p>
          <h1>Check before you consent or install.</h1>
          <p className="hero-intro">
            CrxRay checks browser extensions and website privacy signals before you give them access.
          </p>

          <div className="scanner-modes" role="tablist" aria-label="Scan type">
            <button className={mode === 'extension' ? 'active' : ''} type="button" onClick={() => { setMode('extension'); setInput(''); setError('') }}>
              Extension scan
            </button>
            <button className={mode === 'website' ? 'active' : ''} type="button" onClick={() => { setMode('website'); setInput(''); setError('') }}>
              Website privacy
            </button>
          </div>

          <form className="scanner-form" onSubmit={runLiveScan}>
            <label htmlFor="scan-input">{scanHint}</label>
            <div className="input-row">
              {mode === 'extension' ? <ScanSearch size={20} strokeWidth={1.8} /> : <Globe2 size={20} strokeWidth={1.8} />}
              <input
                id="scan-input"
                value={input}
                onChange={(event) => { setInput(event.target.value); setError('') }}
                placeholder={scanHint}
                autoComplete="off"
              />
              <button type="submit" disabled={scanState === 'scanning'}>
                {scanState === 'scanning' ? 'Scanning' : mode === 'extension' ? 'Scan extension' : 'Scan website'}
                {scanState === 'scanning' ? <span className="button-loader" /> : <ArrowRight size={17} />}
              </button>
            </div>
            <p className={error ? 'input-error' : 'form-note'}>
              {error || (mode === 'extension'
                ? 'CrxRay retrieves the public extension manifest. It does not install or run the extension.'
                : 'CrxRay checks the public page source for consent and tracking signals.')}
            </p>
          </form>

          <div className="example-row">
            <span>Try a reliable demo</span>
            <button type="button" onClick={() => runDemo(demos[0])}>Coupon helper</button>
            <button type="button" onClick={() => runDemo(demos[1])}>Dark mode tool</button>
          </div>

          {scanState === 'scanning' && (
            <div className="scan-progress" role="status">
              <span className="progress-pulse" />
              <span>{mode === 'extension' ? 'Retrieving extension manifest' : 'Checking consent and tracker signals'}</span>
              <span>Building report</span>
            </div>
          )}
        </div>

        <div className="signal-stage" aria-label="Privacy analysis preview">
          <div className="stage-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <article className="extension-card">
            <div className="extension-card-top">
              <span className="extension-icon"><span /><span /><span /></span>
              <div><p>{report?.kind === 'website' ? 'Website' : 'Extension'}</p><strong>{report?.name ?? 'Privacy surface'}</strong></div>
              <span className="scan-status">{scanState === 'scanning' ? 'Scanning' : report ? 'Mapped' : 'Ready'}</span>
            </div>
            <div className="scan-line"><span className={scanState === 'scanning' ? 'is-scanning' : ''} /></div>
            <div className="permission-list">
              {(report?.signals ?? demos[0].signals).slice(0, 3).map((signal) => {
                const Icon = iconMap[signal.iconKey] ?? CircleAlert
                return <div className="permission-row" key={signal.title}>
                  <span className="permission-icon"><Icon size={16} strokeWidth={1.8} /></span>
                  <span>{signal.title}</span><small>{signal.level}</small>
                </div>
              })}
            </div>
          </article>
          <aside className="signal-panel signal-panel-left">
            <span className="panel-kicker">Privacy surface</span>
            <strong>{report ? `${report.signals.length} signals` : 'Ready to scan'}</strong>
            <p>{report?.kind === 'website' ? 'Consent and trackers' : 'Permissions and host access'}</p>
          </aside>
          <aside className="signal-panel signal-panel-right">
            <span className={`risk-dot ${report?.grade === 'A' || report?.grade === 'B' ? 'is-low-risk' : ''}`} />
            <div><span className="panel-kicker">Risk signal</span><strong>{report?.status ?? 'Evidence first'}</strong></div>
          </aside>
          <span className="stage-label stage-label-top">Signals read</span>
          <span className="stage-label stage-label-bottom">Context mapped</span>
        </div>
      </section>

      <section className="trust-strip">
        <div><ShieldCheck size={19} strokeWidth={1.7} /><span>Evidence before recommendations</span></div>
        <div><LockKeyhole size={19} strokeWidth={1.7} /><span>Public information only</span></div>
        <div><CircleAlert size={19} strokeWidth={1.7} /><span>Plain-English risk context</span></div>
      </section>

      {report && (
        <section className="report-section" id="report">
          <div className="report-heading">
            <div><p className="eyebrow">Scan report</p><h2>{report.name}</h2><p>{report.label}</p></div>
            <div className={`risk-score risk-${report.grade.toLowerCase()}`}>
              <span>Risk grade</span><strong>{report.grade}</strong><small>{report.score} / 100</small>
            </div>
          </div>
          <p className="report-source">{report.source || 'Curated CrxRay demonstration profile'}</p>
          <div className="report-summary">
            <div><span className={`report-dot risk-${report.grade.toLowerCase()}`} /><strong>{report.status}</strong></div>
            <p>{report.summary}</p>
          </div>
          <div className="report-grid">
            <article className="findings">
              <div className="section-title"><p className="eyebrow">How it was assessed</p><span>{report.signals.length} signals</span></div>
              {report.signals.map((signal, index) => {
                const Icon = iconMap[signal.iconKey] ?? CircleAlert
                return <div className="finding" key={signal.title}>
                  <span className="finding-number">0{index + 1}</span>
                  <span className="finding-icon"><Icon size={18} strokeWidth={1.8} /></span>
                  <div><strong>{signal.title}</strong><p>{signal.detail}</p></div>
                  <span className="severity">{signal.level}</span>
                </div>
              })}
            </article>
            <aside className="action-panel">
              <p className="eyebrow">What to do next</p><h3>Make a safer choice.</h3>
              <ol>{actionsFor(report).map((action, index) => <li key={action}><span className="action-number">0{index + 1}</span><span>{action}</span></li>)}</ol>
              <button type="button" onClick={resetScan}>Scan another item <ArrowRight size={16} /></button>
            </aside>
          </div>
        </section>
      )}

      <section className="examples-section" id="examples">
        <div className="section-intro">
          <div><p className="eyebrow">Curated examples</p><h2>Compare the context, not just the colour.</h2></div>
          <p>CrxRay uses examples to show why the same access can be expected in one situation and excessive in another.</p>
        </div>
        <div className="example-grid">
          {demos.map((demo) => (
            <article className="example-card" key={demo.id}>
              <div className="example-card-top"><span className={`grade-chip grade-${demo.grade.toLowerCase()}`}>{demo.grade}</span><span>{demo.label}</span></div>
              <h3>{demo.name}</h3><p>{demo.summary}</p>
              <div className="example-card-footer"><span>{demo.signals.length} explained signals</span><button type="button" onClick={() => runDemo(demo)}>Run demo <ArrowRight size={15} /></button></div>
            </article>
          ))}
        </div>
        <p className="demo-disclosure">Demo profiles are curated so the core permission-risk flow remains available even when a store page cannot be reached.</p>
      </section>

      <section className="history-section" id="history">
        <div className="history-heading">
          <div><p className="eyebrow">This device</p><h2>Recent scans</h2></div>
          {history.length > 0 && <button className="clear-history" type="button" onClick={() => setHistory([])}><Trash2 size={14} />Clear history</button>}
        </div>
        {history.length === 0 ? (
          <div className="empty-history"><Clock3 size={21} strokeWidth={1.6} /><div><strong>No scans saved yet.</strong><p>Your recent CrxRay reports stay on this device only.</p></div></div>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <button className="history-row" type="button" key={entry.id} onClick={() => { setReport(entry.report); setScanState('complete'); window.setTimeout(() => document.querySelector('#report')?.scrollIntoView({ behavior: 'smooth' }), 60) }}>
                <span className={`grade-chip grade-${entry.report.grade.toLowerCase()}`}>{entry.report.grade}</span>
                <span className="history-name"><strong>{entry.report.name}</strong><small>{entry.report.status}</small></span>
                <span className="history-time">{new Date(entry.scannedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><ArrowRight size={16} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="method-section" id="about">
        <p className="eyebrow">Built for safer choices</p>
        <div className="method-heading">
          <h2>Privacy details should not require a security degree.</h2>
          <p>CrxRay checks public browser-extension manifests and public website source signals. It helps people pause, understand the evidence, and choose deliberately.</p>
        </div>
      </section>
    </main>
  )
}

export default App
