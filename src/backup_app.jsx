import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck, LayoutDashboard, Users, Smartphone, Building2,
  Search, Bell, ArrowUpRight, AlertTriangle, CheckCircle2, Clock,
  Plus, Globe, Eye, FileWarning, Activity, X, ScanSearch, ExternalLink
} from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:5000'

const initialSocial = [
  { name: 'MangoLeaf Naturals Support', handle: '@mangoleaf_help', platform: 'Instagram', risk: 92, reason: 'Similar name · Unverified account', status: 'Under Review' },
  { name: 'MangoLeaf Official', handle: '@mangoleaf.in', platform: 'Instagram', risk: 12, reason: 'Verified brand account', status: 'Trusted' },
  { name: 'MangoLeaf Rewards', handle: '@mangoleaf_rewards', platform: 'Facebook', risk: 84, reason: 'Suspicious links · Similar branding', status: 'New Alert' },
]
const initialApps = [
  { name: 'MangoLeaf Rewards', publisher: 'ML Rewards Studio', store: 'Google Play', risk: 89, reason: 'Publisher mismatch · Similar icon', status: 'New Alert' },
  { name: 'MangoLeaf Naturals', publisher: 'MangoLeaf Naturals Pvt Ltd', store: 'Google Play', risk: 8, reason: 'Matches official brand profile', status: 'Trusted' },
  { name: 'Mango Leaf Offers', publisher: 'Quick Apps Lab', store: 'App Store', risk: 76, reason: 'Similar name · Unverified publisher', status: 'Under Review' },
]
const initialBrands = [
  { name: 'MangoLeaf Naturals', category: 'Beauty & Personal Care', initials: 'ML', color: 'green', accounts: 4, apps: 2 },
  { name: 'AsterPay', category: 'Financial Services', initials: 'AP', color: 'blue', accounts: 3, apps: 1 },
]

function RiskBadge({ value }) {
  const type = value >= 75 ? 'high' : value >= 40 ? 'medium' : 'low'
  return <span className={`risk-badge ${type}`}>{value}/100</span>
}
function StatusBadge({ status }) {
  const cls = status === 'Trusted' ? 'trusted' : status === 'New Alert' ? 'new' : 'review'
  return <span className={`status-badge ${cls}`}><span />{status}</span>
}
function Field({ label, value, onChange, placeholder, required = false, help }) {
  return <label className="scan-field">
    <span>{label}{required ? ' *' : ''}</span>
    <input value={value} onChange={onChange} placeholder={placeholder} required={required} />
    {help && <small>{help}</small>}
  </label>
}

function App() {
  const [page, setPage] = useState('Overview')
  const [social, setSocial] = useState(initialSocial)
  const [apps, setApps] = useState(initialApps)
  const [scannedAlerts, setScannedAlerts] = useState([])
  const [brands, setBrands] = useState(initialBrands)
  const [search, setSearch] = useState('')
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [scanForm, setScanForm] = useState({
    brandName: '', officialName: '', suspectName: '', officialWebsite: '', suspectWebsite: ''
  })
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const health = await fetch(`${API_URL}/api/health`)
        if (!health.ok) throw new Error('Backend is not available')
        if (!cancelled) setBackendStatus('online')
        const [socialRes, appsRes, brandsRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/social`), fetch(`${API_URL}/api/apps`), fetch(`${API_URL}/api/brands`), fetch(`${API_URL}/api/alerts`)
        ])
        if (socialRes.ok && appsRes.ok && brandsRes.ok) {
          const [socialData, appsData, brandsData] = await Promise.all([
            socialRes.json(), appsRes.json(), brandsRes.json()
          ])
          const alertData = alertsRes.ok ? await alertsRes.json() : []
          if (!cancelled) {
            setSocial(socialData)
            setApps(appsData)
            setScannedAlerts(Array.isArray(alertData) ? alertData : [])
            setBrands(brandsData.map((brand, index) => ({
              ...brand,
              initials: brand.name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(),
              color: index % 2 === 0 ? 'green' : 'blue',
              accounts: index === 0 ? 4 : 3,
              apps: index === 0 ? 2 : 1
            })))
          }
        }
      } catch (error) {
        if (!cancelled) setBackendStatus('offline')
        console.warn('BrandShield backend unavailable; showing demo records.', error)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  const alerts = [...social, ...apps].filter(item => item.risk >= 75).length + scannedAlerts.filter(item => item.risk >= 75).length
  const items = page === 'Social Monitoring' ? social : apps
  const filtered = items.filter(item =>
    `${item.name} ${item.handle || ''} ${item.publisher || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const navGroups = [
    { title: 'WORKSPACE', links: [
      { name: 'Overview', icon: LayoutDashboard },
      { name: 'Risk Scan', icon: ScanSearch },
      { name: 'Social Monitoring', icon: Users },
      { name: 'App Monitoring', icon: Smartphone },
      { name: 'Brand Profiles', icon: Building2 },
    ]},
    { title: 'MANAGE', links: [
      { name: 'All Alerts', icon: Bell },
      { name: 'Reports', icon: FileWarning },
    ]},
  ]

  const allRecords = useMemo(() => [
    ...social.map((item, index) => ({ ...item, kind: 'social', originalIndex: index })),
    ...apps.map((item, index) => ({ ...item, kind: 'app', originalIndex: index })),
    ...scannedAlerts.map(item => ({
      ...item, kind: 'scan', name: item.suspectName, handle: `Brand: ${item.brandName}`,
      platform: 'Risk Scan', risk: item.riskScore, reason: (item.reasons || []).map(reason => typeof reason === 'string' ? reason : reason.indicator || reason.message || '').filter(Boolean).join(' · ') || 'Rule-based assessment',
      status: item.status || 'New Alert', originalIndex: item.id
    }))
  ], [social, apps, scannedAlerts])

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2500)
  }
  function updateStatus(kind, index) {
    const setter = kind === 'social' ? setSocial : setApps
    setter(old => old.map((item, i) => i === index
      ? { ...item, status: item.status === 'Trusted' ? 'Under Review' : 'Trusted' }
      : item))
    showNotice('Case status updated')
  }
  function addBrand(event) {
    event.preventDefault()
    if (!brandName.trim()) return
    setBrands(old => [...old, {
      name: brandName.trim(), category: 'New brand profile',
      initials: brandName.trim().slice(0, 2).toUpperCase(),
      color: 'purple', accounts: 0, apps: 0
    }])
    setBrandName('')
    setShowBrandForm(false)
    showNotice('Brand profile added')
  }
  function changeScanField(field, value) {
    setScanForm(old => ({ ...old, [field]: value }))
  }
  async function runRiskScan(event) {
    event.preventDefault()
    setScanLoading(true)
    setScanError('')
    setScanResult(null)
    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanForm),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Risk scan failed')
      setScanResult(data)
      // Reload persisted-in-memory alerts so the All Alerts page updates immediately.
      const alertsResponse = await fetch(`${API_URL}/api/alerts`)
      if (alertsResponse.ok) {
        const savedAlerts = await alertsResponse.json()
        setScannedAlerts(Array.isArray(savedAlerts) ? savedAlerts : [])
      }
    } catch (error) {
      setScanError('Could not connect to the backend. Make sure the server is running in a separate terminal on port 5000.')
      console.error(error)
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-logo">
          <div className="logo-mark"><ShieldCheck size={23} /></div>
          <div><strong>BrandShield</strong><small>Digital Risk Protection</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switch">
          <span className="workspace-avatar">B</span>
          <span className="workspace-copy"><b>Brand Team</b><small>Demo workspace</small></span>
        </div>
        {navGroups.map(group => (
          <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.links.map(link => {
              const Icon = link.icon
              return <button key={link.name}
                className={`nav-link ${page === link.name ? 'active' : ''}`}
                onClick={() => { setPage(link.name); setSearch('') }}>
                <Icon size={18} strokeWidth={1.8} /><span>{link.name}</span>
                {link.name === 'All Alerts' && <span className="nav-count">{alerts}</span>}
              </button>
            })}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="protection-card">
            <div className="protection-icon"><ShieldCheck size={19} /></div>
            <b>Your brand, protected.</b>
            <p>Review lookalikes and investigate suspicious signals in one place.</p>
            <span><span className="live-dot" /> {backendStatus === 'online' ? 'Backend connected' : 'Demo monitoring'}</span>
          </div>
          <div className="user-profile"><div className="user-avatar">BT</div><div><b>Brand Team</b><small>Administrator</small></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span>/</span><b>{page}</b></div>
          <div className="top-actions">
            <span className="demo-label"><span className="live-dot" /> {backendStatus === 'online' ? 'BACKEND CONNECTED' : 'DEMO DATA'}</span>
            <button className="icon-button" aria-label="Notifications" onClick={() => setPage('All Alerts')}><Bell size={19} /></button>
            <div className="top-avatar">BT</div>
          </div>
        </header>

        <div className="page-content">
          {page === 'Overview' && <>
            <section className="welcome-row">
              <div><div className="eyebrow"><Activity size={14} /> BRAND INTELLIGENCE</div>
                <h1>Your brand. <span>Under protection.</span></h1>
                <p>Spot suspicious lookalikes, review risk signals, and protect customer trust.</p>
              </div>
              <button className="primary-button" onClick={() => { setPage('Brand Profiles'); setShowBrandForm(true) }}><Plus size={18} /> Add brand profile</button>
            </section>
            <section className="stats-grid">
              <div className="stat-card"><div className="stat-top"><span>Monitored brands</span><span className="stat-icon purple"><Building2 size={19} /></span></div><strong>{brands.length}</strong><small><span className="stat-positive">Active</span> brand profiles</small></div>
              <div className="stat-card"><div className="stat-top"><span>High-risk signals</span><span className="stat-icon red"><AlertTriangle size={19} /></span></div><strong>{alerts}</strong><small>Across sample social and app records</small></div>
              <div className="stat-card"><div className="stat-top"><span>Social profiles</span><span className="stat-icon blue"><Users size={19} /></span></div><strong>{social.length}</strong><small>Sample records loaded</small></div>
              <div className="stat-card"><div className="stat-top"><span>Mobile apps</span><span className="stat-icon orange"><Smartphone size={19} /></span></div><strong>{apps.length}</strong><small>Sample records loaded</small></div>
            </section>
            <section className="insight-banner"><div className="insight-symbol"><ShieldCheck size={25} /></div><div><b>Evidence-first monitoring</b><p>The risk scan checks the names and details you submit. Sample dashboard records are illustrative; high scores still need human review.</p></div><span className="banner-tag">PROTECTION INSIGHTS</span></section>
            <div className="section-heading"><div><h2>Recent risk signals</h2><p>Review sample detections and update their case status.</p></div><button className="text-button" onClick={() => setPage('All Alerts')}>View all alerts <ArrowUpRight size={16} /></button></div>
            <div className="table-card">
              <div className="table-toolbar"><div className="table-title"><span className="tiny-status" /> Latest findings <span className="record-count">{allRecords.length} records</span></div><button className="filter-button" onClick={() => setPage('All Alerts')}><Eye size={16} /> Review alerts</button></div>
              <div className="table-scroll"><table><thead><tr><th>ENTITY</th><th>SOURCE</th><th>RISK SCORE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
                {[...allRecords].sort((a, b) => b.risk - a.risk).slice(0, 5).map(item => <tr key={item.name + item.kind}>
                  <td><div className="entity-cell"><div className={`entity-icon ${item.kind}`}>{item.kind === 'social' ? <Users size={18} /> : <Smartphone size={18} />}</div><div><b>{item.name}</b><small>{item.handle || item.publisher}</small></div></div></td>
                  <td>{item.platform || item.store}</td><td><RiskBadge value={item.risk} /></td><td><StatusBadge status={item.status} /></td>
                  <td><button className="review-button" onClick={() => updateStatus(item.kind, item.originalIndex)}>Update status</button></td>
                </tr>)}
              </tbody></table></div>
              <div className="table-footer"><span>Illustrative sample records · not live scans</span><span>Prototype workspace</span></div>
            </div>
            <div className="bottom-grid">
              <section className="panel-card"><div className="panel-heading"><div><h3>Monitoring coverage</h3><p>Sample assets registered in your workspace</p></div><Globe size={19} /></div>
                <div className="coverage-row"><span><Users size={17} /> Social profiles</span><b>{social.length} <small>records</small></b></div>
                <div className="coverage-row"><span><Smartphone size={17} /> Mobile applications</span><b>{apps.length} <small>records</small></b></div>
                <div className="coverage-row"><span><Building2 size={17} /> Brand profiles</span><b>{brands.length} <small>brands</small></b></div>
                <div className="coverage-note"><CheckCircle2 size={16} /> Demo workspace is ready to explore.</div>
              </section>
              <section className="panel-card"><div className="panel-heading"><div><h3>Priority queue</h3><p>Highest-risk sample records</p></div><AlertTriangle size={19} /></div>
                {allRecords.filter(x => x.risk >= 75).sort((a, b) => b.risk - a.risk).slice(0, 3).map(x => <div className="priority-row" key={x.name}><span className="priority-dot" /><div><b>{x.name}</b><small>{x.reason}</small></div><RiskBadge value={x.risk} /></div>)}
                <button className="full-width-button" onClick={() => setPage('All Alerts')}>Open priority queue <ArrowUpRight size={16} /></button>
              </section>
            </div>
          </>}

          {page === 'Risk Scan' && <>
            <section className="welcome-row"><div><div className="eyebrow"><ScanSearch size={14} /> INTERACTIVE RISK CHECK</div><h1>Check a suspicious <span>lookalike.</span></h1><p>Compare a suspected account or app name with your official brand details.</p></div><span className="demo-label"><ShieldCheck size={15} /> RULE-BASED CHECK</span></section>
            <div className="monitoring-info"><ShieldCheck size={20} /><div><b>What this scan does</b><p>It sends the details below to your local backend and evaluates name similarity using the rules implemented in your API. It does not search Instagram, app stores, or the wider internet.</p></div></div>
            <div className="scan-layout">
              <form className="table-card scan-card" onSubmit={runRiskScan}>
                <div className="table-toolbar"><div className="table-title">Brand and suspected entity</div><span className={`backend-pill ${backendStatus}`}>{backendStatus === 'online' ? 'Backend online' : backendStatus === 'offline' ? 'Backend offline' : 'Checking backend'}</span></div>
                <div className="scan-form-body">
                  <Field label="Brand name" value={scanForm.brandName} onChange={e => changeScanField('brandName', e.target.value)} placeholder="e.g. MangoLeaf Naturals" required />
                  <Field label="Official brand name" value={scanForm.officialName} onChange={e => changeScanField('officialName', e.target.value)} placeholder="Name used by the real brand" required />
                  <Field label="Suspicious name" value={scanForm.suspectName} onChange={e => changeScanField('suspectName', e.target.value)} placeholder="e.g. MangoLeaf Naturals Support" required />
                  <div className="scan-two-cols">
                    <Field label="Official website (optional)" value={scanForm.officialWebsite} onChange={e => changeScanField('officialWebsite', e.target.value)} placeholder="https://official.example" />
                    <Field label="Suspicious website (optional)" value={scanForm.suspectWebsite} onChange={e => changeScanField('suspectWebsite', e.target.value)} placeholder="https://lookalike.example" />
                  </div>
                  <button className="primary-button scan-submit" type="submit" disabled={scanLoading}>{scanLoading ? <><Clock size={18} /> Checking…</> : <><ScanSearch size={18} /> Run risk check</>}</button>
                  {scanError && <div className="scan-error" role="alert"><AlertTriangle size={18} /><span>{scanError}</span></div>}
                </div>
              </form>
              <section className="table-card scan-result-card">
                <div className="table-toolbar"><div className="table-title">Assessment result</div></div>
                {!scanResult && !scanLoading && <div className="scan-empty"><div className="scan-empty-icon"><ShieldCheck size={28} /></div><b>Your result will appear here</b><p>Enter the brand and suspected name, then run the check.</p></div>}
                {scanLoading && <div className="scan-empty"><Clock size={28} /><b>Evaluating submitted details…</b><p>Please wait while the local API processes the request.</p></div>}
                {scanResult && <div className="result-body">
                  <div className="result-score-row"><div><span className="result-label">RISK SCORE</span><div className="result-score">{scanResult.riskScore ?? scanResult.score ?? '—'}<small>/100</small></div></div><span className={`result-level ${(scanResult.riskLevel || scanResult.level || 'unknown').toLowerCase()}`}>{scanResult.riskLevel || scanResult.level || 'Assessed'}</span></div>
                  <div className="risk-meter"><span style={{ width: `${Math.max(0, Math.min(100, Number(scanResult.riskScore ?? scanResult.score ?? 0)))}%` }} /></div>
                  <p className="result-disclaimer">This is an automated rule-based indicator, not proof of fraud. Verify evidence independently.</p>
                  <h3>Reasons and signals</h3>
                  {Array.isArray(scanResult.reasons) && scanResult.reasons.length > 0
                    ? <ul className="result-reasons">{scanResult.reasons.map((reason, index) => <li key={index}><AlertTriangle size={15} />{typeof reason === 'string' ? reason : reason.message || reason.reason || JSON.stringify(reason)}</li>)}</ul>
                    : <p className="muted-copy">The API returned no separate reason list.</p>}
                  {scanResult.checks && <><h3>Checks returned by API</h3><pre className="result-json">{JSON.stringify(scanResult.checks, null, 2)}</pre></>}
                  <button className="cancel-button" onClick={() => { setScanResult(null); setScanError('') }}>Clear result</button>
                </div>}
              </section>
            </div>
          </>}

          {(page === 'Social Monitoring' || page === 'App Monitoring' || page === 'All Alerts') && <>
            <section className="welcome-row"><div><div className="eyebrow"><Activity size={14} /> DETECTION CENTER</div><h1>{page === 'All Alerts' ? 'Risk & alert center' : page}</h1><p>{page === 'Social Monitoring' ? 'Review social profiles for impersonation signals and suspicious links.' : page === 'App Monitoring' ? 'Review app names, publishers, and possible mismatches.' : 'Review high-risk sample records across social profiles and apps.'}</p></div><span className="demo-label"><span className="live-dot" /> SAMPLE DATA</span></section>
            <div className="monitoring-info"><ShieldCheck size={20} /><div><b>Transparent risk indicators</b><p>These dashboard records are sample data, not live detections or verified fraud findings. Use evidence and manual review before taking action.</p></div></div>
            <div className="table-card monitoring-table"><div className="table-toolbar"><div className="table-title">Detected entities <span className="record-count">{filtered.length} shown</span></div><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, handles, publishers..." /></div></div>
              <div className="table-scroll"><table><thead><tr><th>ENTITY</th><th>SOURCE</th><th>INDICATORS</th><th>RISK</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
                {(page === 'All Alerts' ? allRecords.filter(x => (x.kind === 'scan' || x.risk >= 75) && `${x.name} ${x.handle || ''} ${x.publisher || ''}`.toLowerCase().includes(search.toLowerCase())) : filtered.map(x => ({ ...x, kind: page === 'Social Monitoring' ? 'social' : 'app', originalIndex: items.indexOf(x) }))).map(item => <tr key={item.name + item.kind}>
                  <td><div className="entity-cell"><div className={`entity-icon ${item.kind}`}>{item.kind === 'social' ? <Users size={18} /> : <Smartphone size={18} />}</div><div><b>{item.name}</b><small>{item.handle || item.publisher}</small></div></div></td>
                  <td>{item.platform || item.store}</td><td className="reason-cell">{item.reason}</td><td><RiskBadge value={item.risk} /></td><td><StatusBadge status={item.status} /></td>
                  <td><button className="review-button" onClick={() => setSelectedAlert(item)}>View evidence</button> {item.kind !== 'scan' && <button className="review-button" onClick={() => updateStatus(item.kind, item.originalIndex)}>Update status</button>}</td>
                </tr>)}
              </tbody></table></div>
              {(page === 'All Alerts' ? allRecords.filter(x => (x.kind === 'scan' || x.risk >= 75) && `${x.name} ${x.handle || ''} ${x.publisher || ''}`.toLowerCase().includes(search.toLowerCase())).length : filtered.length) === 0 && <div className="empty-state"><Search size={24} /><b>No matching records</b><span>Try another search term.</span></div>}
              <div className="table-footer"><span>Sample records only · no external accounts scanned</span><span>Verify evidence before reporting</span></div>
            </div>
          </>}

          {page === 'Brand Profiles' && <>
            <section className="welcome-row"><div><div className="eyebrow"><Building2 size={14} /> BRAND ASSET REGISTRY</div><h1>Brand profiles</h1><p>Register official assets so lookalike accounts and apps can be reviewed.</p></div><button className="primary-button" onClick={() => setShowBrandForm(!showBrandForm)}><Plus size={18} /> Add brand</button></section>
            {showBrandForm && <form className="add-brand-form" onSubmit={addBrand}><div><b>Create a brand profile</b><p>Demo-only form. Add a name to update this page.</p></div><input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Brand name" required /><button className="primary-button" type="submit">Save profile</button><button className="cancel-button" type="button" onClick={() => setShowBrandForm(false)}>Cancel</button></form>}
            <div className="brand-grid">{brands.map(brand => <div className="brand-card" key={brand.name}><div className="brand-card-top"><div className={`brand-initials ${brand.color}`}>{brand.initials}</div><span className="profile-ready"><CheckCircle2 size={14} /> Registered</span></div><h3>{brand.name}</h3><p>{brand.category}</p><div className="brand-metrics"><div><Users size={17} /><span>Social assets</span><b>{brand.accounts}</b></div><div><Smartphone size={17} /><span>Mobile apps</span><b>{brand.apps}</b></div></div><div className="brand-card-footer"><span><ShieldCheck size={16} /> Demo profile</span><button onClick={() => showNotice('Production setup should validate official URLs and publisher details.')}>View details <ArrowUpRight size={15} /></button></div></div>)}</div>
            <div className="monitoring-info brand-info"><AlertTriangle size={20} /><div><b>Important</b><p>Sample brands are fictional. A production system should validate official URLs, logos, and publisher details before treating an account as trusted.</p></div></div>
          </>}

          {page === 'Reports' && <>
            <section className="welcome-row"><div><div className="eyebrow"><FileWarning size={14} /> CASE SUMMARY</div><h1>Reports</h1><p>A summary of the current demo monitoring workspace.</p></div><button className="primary-button" onClick={() => window.print()}>Print report <ArrowUpRight size={17} /></button></section>
            <section className="stats-grid">
              <div className="stat-card"><div className="stat-top"><span>Total records</span><span className="stat-icon blue"><Activity size={19} /></span></div><strong>{social.length + apps.length}</strong><small>Social and app records</small></div>
              <div className="stat-card"><div className="stat-top"><span>High-risk</span><span className="stat-icon red"><AlertTriangle size={19} /></span></div><strong>{alerts}</strong><small>Score 75 or above</small></div>
              <div className="stat-card"><div className="stat-top"><span>Trusted records</span><span className="stat-icon green"><CheckCircle2 size={19} /></span></div><strong>{[...social, ...apps].filter(x => x.status === 'Trusted').length}</strong><small>Marked trusted in this demo</small></div>
              <div className="stat-card"><div className="stat-top"><span>Needs review</span><span className="stat-icon orange"><Clock size={19} /></span></div><strong>{[...social, ...apps].filter(x => x.status !== 'Trusted').length}</strong><small>Not yet trusted</small></div>
            </section>
            <div className="table-card"><div className="table-toolbar"><div className="table-title">Report records</div></div><div className="table-scroll"><table><thead><tr><th>ENTITY</th><th>SOURCE</th><th>RISK</th><th>STATUS</th></tr></thead><tbody>{allRecords.map(x => <tr key={x.name + x.kind}><td><b>{x.name}</b><small className="subline">{x.handle || x.publisher}</small></td><td>{x.platform || x.store}</td><td><RiskBadge value={x.risk} /></td><td><StatusBadge status={x.status} /></td></tr>)}</tbody></table></div><div className="table-footer"><span>Generated from illustrative sample data.</span><span>BrandShield · Demo report</span></div></div>
          </>}

          <footer className="page-footer"><span>© 2026 BrandShield</span><span><span className="live-dot" /> Prototype mode · sample data only</span><span>Privacy-first · Evidence-led</span></footer>
        </div>
      </main>

      {selectedAlert && <div className="evidence-overlay" role="dialog" aria-modal="true" aria-label="Alert evidence">
        <div className="table-card evidence-modal">
          <div className="section-heading"><div><h2>Alert evidence</h2><p>Review the signals before taking action.</p></div><button className="cancel-button" onClick={() => setSelectedAlert(null)}><X size={16} /> Close</button></div>
          <h3>{selectedAlert.name}</h3><p>{selectedAlert.handle || selectedAlert.publisher}</p>
          <p><strong>Source:</strong> {selectedAlert.platform || selectedAlert.store}</p>
          <p><strong>Risk score:</strong> {selectedAlert.risk}/100</p>
          <p><strong>Risk indicators:</strong> {selectedAlert.reason}</p>
          <p><strong>Current status:</strong> {selectedAlert.status}</p>
          <p><strong>Evidence type:</strong> Illustrative sample indicators</p>
          <p>These are demo records, not verified fraud findings. Manually verify the account or app before reporting it.</p>
        </div>
      </div>}
      {notice && <div className="toast"><CheckCircle2 size={18} />{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
    </div>
  )
}
export default App
