import {
  ArrowRight,
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

const permissionSignals = [
  { icon: Eye, label: 'Read page content', level: 'Observed' },
  { icon: KeyRound, label: 'Access sign-in data', level: 'Sensitive' },
  { icon: Layers3, label: 'Modify browser tabs', level: 'Observed' },
]

function App() {
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

          <form className="scanner-form">
            <label htmlFor="extension-link">Chrome Web Store link or extension ID</label>
            <div className="input-row">
              <ScanSearch size={20} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="extension-link"
                type="text"
                placeholder="Paste an extension link or ID"
                autoComplete="off"
              />
              <button type="button">
                Scan extension <ArrowRight size={17} />
              </button>
            </div>
            <p className="form-note">
              CrxRay analyses public extension information. It does not install or run the extension.
            </p>
          </form>

          <div className="example-row">
            <span>Try an example</span>
            <button type="button">Coupon finder</button>
            <button type="button">Dark mode tool</button>
          </div>
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
                <strong>QuickBrowse Helper</strong>
              </div>
              <span className="scan-status">Scanning</span>
            </div>

            <div className="scan-line">
              <span />
            </div>

            <div className="permission-list">
              {permissionSignals.map(({ icon: Icon, label, level }) => (
                <div className="permission-row" key={label}>
                  <span className="permission-icon">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <span>{label}</span>
                  <small>{level}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="signal-panel signal-panel-left">
            <span className="panel-kicker">Permission surface</span>
            <strong>14 requests</strong>
            <p>3 need a closer look</p>
          </aside>

          <aside className="signal-panel signal-panel-right">
            <span className="risk-dot" />
            <div>
              <span className="panel-kicker">Risk signal</span>
              <strong>Broad site access</strong>
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
