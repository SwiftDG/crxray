import { useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  KeyRound,
  Layers3,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'
import './App.css'

const profiles = {
  risky: {
    id: 'clipsaver',
    name: 'ClipSaver Pro',
    label: 'Coupon and shopping helper',
    url: 'https://chromewebstore.google.com/detail/clipsaver-pro/demo-risky',
    grade: 'D',
    score: 78,
    status: 'High risk signals found',
    summary:
      'This extension requests broad access to websites you visit, including access that is not needed for a coupon helper.',
    permissions: [
      {
        icon: Eye,
        title: 'Reads and changes data on every website',
        level: 'High concern',
        detail:
          'This can let an extension view page content, alter what you see, and interact with forms across websites.',
      },
      {
        icon: KeyRound,
        title: 'Requests access to browser activity',
        level: 'High concern',
        detail:
          'This permission can expose details about your open tabs and browsing behaviour.',
      },
      {
        icon: Layers3,
        title: 'Uses background activity',
        level: 'Review needed',
        detail:
          'The extension can continue running while you browse, even when its popup is closed.',
      },
    ],
    actions: [
      'Do not install it until you can verify why it needs broad site access.',
      'Check the publisher website, privacy policy, and recent reviews.',
      'Look for a similar extension that asks for fewer permissions.',
    ],
  },
  safer: {
    id: 'nightreader',
    name: 'Night Reader',
    label: 'Dark reading mode',
    url: 'https://chromewebstore.google.com/detail/night-reader/demo-safer',
    grade: 'B',
    score: 24,
    status: 'Lower risk profile',
    summary:
      'This extension requests access that is broadly consistent with applying a dark theme to the pages you visit.',
    permissions: [
      {
        icon: Eye,
        title: 'Changes page appearance on websites',
        level: 'Expected',
        detail:
          'A reading-mode extension needs page access to apply a dark theme or adjust text appearance.',
      },
      {
        icon: LockKeyhole,
        title: 'Stores settings in your browser',
        level: 'Expected',
        detail:
          'This lets the extension remember choices such as theme, brightness, and enabled websites.',
      },
    ],
    actions: [
      'Review the extension publisher and recent user feedback before installing.',
      'Check that the requested permissions match the feature you want.',
      'Remove any extension you no longer use.',
    ],
  },
}

function App() {
  const [input, setInput] = useState('')
  const [scanState, setScanState] = useState('idle')
  const [report, setReport] = useState(null)

  const beginScan = (profile) => {
    setInput(profile.url)
    setReport(null)
    setScanState('scanning')

    window.setTimeout(() => {
      setReport(profile)
      setScanState('complete')
      window.setTimeout(() => {
        document.querySelector('#report')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 80)
    }, 1600)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const isSaferSearch = /night|dark|reader|theme/i.test(input)
    beginScan(isSaferSearch ? profiles.safer : profiles.risky)
  }

  const resetScan = () => {
    setInput('')
    setReport(null)
    setScanState('idle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#scanner" aria-label="CrxRay home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>CrxRay</span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#scanner">Scanner</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>

        <a className="header-link" href="#scanner">
          Start a scan <ChevronRight size={15} />
        </a>
      </header>

      <section className="hero" id="scanner">
        <div className="hero-copy">
          <p className="eyebrow">Extension safety, explained clearly</p>
          <h1>Check before you install.</h1>
          <p className="hero-intro">
            CrxRay reads the permissions a Chrome extension asks for and explains
            what they could mean for your privacy and security.
          </p>

          <form className="scanner-form" onSubmit={handleSubmit}>
            <label htmlFor="extension-link">Chrome Web Store link or extension ID</label>
            <div className="input-row">
              <ScanSearch size={20} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="extension-link"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste an extension link or ID"
                autoComplete="off"
              />
              <button type="submit" disabled={scanState === 'scanning'}>
                {scanState === 'scanning' ? 'Scanning' : 'Scan extension'}
                {scanState === 'scanning' ? (
                  <span className="button-loader" aria-hidden="true" />
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>
            </div>
            <p className="form-note">
              CrxRay analyses public extension information. It does not install or run the extension.
            </p>
          </form>

          <div className="example-row">
            <span>Try a demo scan</span>
            <button type="button" onClick={() => beginScan(profiles.risky)}>
              Coupon helper
            </button>
            <button type="button" onClick={() => beginScan(profiles.safer)}>
              Dark mode tool
            </button>
          </div>

          {scanState === 'scanning' && (
            <div className="scan-progress" role="status">
              <span className="progress-pulse" />
              <span>Reading requested permissions</span>
              <span>Mapping risk signals</span>
            </div>
          )}
        </div>

        <div className="signal-stage" aria-label="Permission analysis preview">
          <div className="stage-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <article className="extension-card">
            <div className="extension-card-top">
              <span className="extension-icon">
                <span />
                <span />
                <span />
              </span>
              <div>
                <p>Extension</p>
                <strong>{report?.name ?? 'QuickBrowse Helper'}</strong>
              </div>
              <span className="scan-status">
                {scanState === 'scanning' ? 'Scanning' : report ? 'Mapped' : 'Ready'}
              </span>
            </div>

            <div className="scan-line">
              <span className={scanState === 'scanning' ? 'is-scanning' : ''} />
            </div>

            <div className="permission-list">
              {(report?.permissions ?? profiles.risky.permissions).slice(0, 3).map((item) => {
                const Icon = item.icon
                return (
                  <div className="permission-row" key={item.title}>
                    <span className="permission-icon">
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span>{item.title}</span>
                    <small>{item.level}</small>
                  </div>
                )
              })}
            </div>
          </article>

          <aside className="signal-panel signal-panel-left">
            <span className="panel-kicker">Permission surface</span>
            <strong>{report ? `${report.permissions.length + 5} requests` : '14 requests'}</strong>
            <p>{report ? 'Signals mapped' : '3 need a closer look'}</p>
          </aside>

          <aside className="signal-panel signal-panel-right">
            <span className={`risk-dot ${report?.grade === 'B' ? 'is-low-risk' : ''}`} />
            <div>
              <span className="panel-kicker">Risk signal</span>
              <strong>{report?.grade === 'B' ? 'Expected access' : 'Broad site access'}</strong>
            </div>
          </aside>

          <span className="stage-label stage-label-top">Manifest read</span>
          <span className="stage-label stage-label-bottom">Signals mapped</span>
        </div>
      </section>

      <section className="trust-strip" id="how-it-works">
        <div>
          <ShieldCheck size={19} strokeWidth={1.7} />
          <span>Plain-English permission explanations</span>
        </div>
        <div>
          <LockKeyhole size={19} strokeWidth={1.7} />
          <span>No extension installation required</span>
        </div>
        <div>
          <CircleAlert size={19} strokeWidth={1.7} />
          <span>Evidence before recommendations</span>
        </div>
      </section>

      {report && (
        <section className="report-section" id="report">
          <div className="report-heading">
            <div>
              <p className="eyebrow">Scan report</p>
              <h2>{report.name}</h2>
              <p>{report.label}</p>
            </div>

            <div className={`risk-score risk-${report.grade.toLowerCase()}`}>
              <span>Risk grade</span>
              <strong>{report.grade}</strong>
              <small>{report.score} / 100</small>
            </div>
          </div>

          <div className="report-summary">
            <div>
              <span className={`report-dot risk-${report.grade.toLowerCase()}`} />
              <strong>{report.status}</strong>
            </div>
            <p>{report.summary}</p>
          </div>

          <div className="report-grid">
            <article className="findings">
              <div className="section-title">
                <p className="eyebrow">Why this was flagged</p>
                <span>{report.permissions.length} signals</span>
              </div>

              {report.permissions.map((permission, index) => {
                const Icon = permission.icon
                return (
                  <div className="finding" key={permission.title}>
                    <span className="finding-number">0{index + 1}</span>
                    <span className="finding-icon">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <div>
                      <strong>{permission.title}</strong>
                      <p>{permission.detail}</p>
                    </div>
                    <span className="severity">{permission.level}</span>
                  </div>
                )
              })}
            </article>

            <aside className="action-panel">
              <p className="eyebrow">What to do next</p>
              <h3>Make a safer choice.</h3>
              <ol>
                {report.actions.map((action) => (
                  <li key={action}>
                    <Check size={15} strokeWidth={2.2} />
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={resetScan}>
                Scan another extension <ArrowRight size={16} />
              </button>
            </aside>
          </div>
        </section>
      )}

      <section className="method-section" id="about">
        <p className="eyebrow">Built for safer choices</p>
        <div className="method-heading">
          <h2>Security details should not require a security degree.</h2>
          <p>
            A permission can sound harmless and still give an extension wide access.
            CrxRay turns technical requests into a report you can act on.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
