
import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck, LayoutDashboard, Users, Smartphone, Building2,
  Search, Bell, ArrowUpRight, AlertTriangle, CheckCircle2,
  Clock, Plus, Globe, Eye, FileWarning, Activity, X,
  ScanSearch, RefreshCw, Download, Filter, Menu, ExternalLink,
  TrendingUp, ChevronRight, Trash2
} from 'lucide-react'
import './App.css'

const API_URL = 'http://localhost:5000'

const demoSocial = [
  { name: 'MangoLeaf Naturals Support', handle: '@mangoleaf_help', platform: 'Instagram', risk: 92, reason: 'Similar name · Unverified account', status: 'Under Review' },
  { name: 'MangoLeaf Official', handle: '@mangoleaf.in', platform: 'Instagram', risk: 12, reason: 'Verified brand account', status: 'Trusted' },
  { name: 'MangoLeaf Rewards', handle: '@mangoleaf_rewards', platform: 'Facebook', risk: 84, reason: 'Suspicious links · Similar branding', status: 'New Alert' },
]

const demoApps = [
  { name: 'MangoLeaf Rewards', publisher: 'ML Rewards Studio', store: 'Google Play', risk: 89, reason: 'Publisher mismatch · Similar icon', status: 'New Alert' },
  { name: 'MangoLeaf Naturals', publisher: 'MangoLeaf Naturals Pvt Ltd', store: 'Google Play', risk: 8, reason: 'Matches official brand profile', status: 'Trusted' },
  { name: 'Mango Leaf Offers', publisher: 'Quick Apps Lab', store: 'App Store', risk: 76, reason: 'Similar name · Unverified publisher', status: 'Under Review' },
]

const demoBrands = [
  { name: 'MangoLeaf Naturals', category: 'Beauty & Personal Care', initials: 'ML', color: 'green', accounts: 4, apps: 2 },
  { name: 'AsterPay', category: 'Financial Services', initials: 'AP', color: 'blue', accounts: 3, apps: 1 },
]

const navigation = [
  {
    title: 'WORKSPACE',
    links: [
      { name: 'Overview', icon: LayoutDashboard },
      { name: 'Risk Scan', icon: ScanSearch },
      { name: 'Social Monitoring', icon: Users },
      { name: 'App Monitoring', icon: Smartphone },
      { name: 'Brand Profiles', icon: Building2 },
    ],
  },
  {
    title: 'MANAGE',
    links: [
      { name: 'All Alerts', icon: Bell },
      { name: 'Reports', icon: FileWarning },
    ],
  },
]

function getRisk(item) {
  return Number(item.risk ?? item.riskScore ?? item.score ?? 0)
}

function getReason(item) {
  if (typeof item.reason === 'string') return item.reason
  if (Array.isArray(item.reasons)) {
    return item.reasons
      .map(x => typeof x === 'string' ? x : x.indicator || x.message || x.reason || '')
      .filter(Boolean)
      .join(' · ')
  }
  return 'Rule-based assessment'
}

function RiskBadge({ value }) {
  const risk = Number(value) || 0
  const level = risk >= 75 ? 'high' : risk >= 40 ? 'medium' : 'low'
  return (
    <span className={`risk-badge ${level}`}>
      <span className="risk-dot" />
      {risk}/100
    </span>
  )
}

function StatusBadge({ status }) {
  const normalized = status || 'New Alert'
  const cls = normalized === 'Trusted'
    ? 'trusted'
    : normalized === 'New Alert'
      ? 'new'
      : 'review'

  return (
    <span className={`status-badge ${cls}`}>
      <span />
      {normalized}
    </span>
  )
}

function Field({ label, value, onChange, placeholder, required = false, help }) {
  return (
    <label className="scan-field">
      <span>{label}{required ? ' *' : ''}</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {help && <small>{help}</small>}
    </label>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Search size={25} />
      <b>{title}</b>
      <span>{description}</span>
    </div>
  )
}

function App() {
  const [page, setPage] = useState('Overview')
  const [social, setSocial] = useState(demoSocial)
  const [apps, setApps] = useState(demoApps)
  const [brands, setBrands] = useState(demoBrands)
  const [scannedAlerts, setScannedAlerts] = useState([])
  const [backendStatus, setBackendStatus] = useState('checking')
  const [loadingData, setLoadingData] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [brandCategory, setBrandCategory] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  const [scanForm, setScanForm] = useState({
    brandName: '',
    officialName: '',
    suspectName: '',
    officialWebsite: '',
    suspectWebsite: '',
  })
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoadingData(true)
    try {
      const health = await fetch(`${API_URL}/api/health`)
      if (!health.ok) throw new Error('Backend unavailable')

      setBackendStatus('online')

      const [socialRes, appsRes, brandsRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/social`),
        fetch(`${API_URL}/api/apps`),
        fetch(`${API_URL}/api/brands`),
        fetch(`${API_URL}/api/alerts`),
      ])

      if (socialRes.ok) {
        const data = await socialRes.json()
        if (Array.isArray(data)) setSocial(data)
      }

      if (appsRes.ok) {
        const data = await appsRes.json()
        if (Array.isArray(data)) setApps(data)
      }

      if (brandsRes.ok) {
        const data = await brandsRes.json()
        if (Array.isArray(data)) {
          setBrands(data.map((brand, index) => ({
            ...brand,
            initials: brand.initials || brand.name
              .split(/\s+/)
              .map(word => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            color: brand.color || (index % 2 === 0 ? 'green' : 'blue'),
            category: brand.category || 'Registered brand',
            accounts: brand.accounts ?? 0,
            apps: brand.apps ?? 0,
          })))
        }
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setScannedAlerts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      setBackendStatus('offline')
      console.warn('Using demo records because the backend is unavailable.', error)
    } finally {
      setLoadingData(false)
    }
  }

  const allRecords = useMemo(() => {
    const socialRecords = social.map((item, index) => ({
      ...item,
      kind: 'social',
      originalIndex: index,
      risk: getRisk(item),
      reason: getReason(item),
      source: item.platform || 'Social platform',
      subtitle: item.handle || 'Social profile',
    }))

    const appRecords = apps.map((item, index) => ({
      ...item,
      kind: 'app',
      originalIndex: index,
      risk: getRisk(item),
      reason: getReason(item),
      source: item.store || 'App store',
      subtitle: item.publisher || 'Unknown publisher',
    }))

    const scanRecords = scannedAlerts.map((item, index) => ({
      ...item,
      kind: 'scan',
      originalIndex: index,
      name: item.suspectName || item.name || 'Scanned entity',
      risk: getRisk(item),
      reason: getReason(item),
      source: 'Risk Scan',
      subtitle: item.brandName ? `Brand: ${item.brandName}` : 'Local API assessment',
      status: item.status || 'New Alert',
    }))

    return [...socialRecords, ...appRecords, ...scanRecords]
  }, [social, apps, scannedAlerts])

  const highRiskRecords = allRecords.filter(item => item.risk >= 75)
  const highRiskCount = highRiskRecords.length
  const trustedCount = allRecords.filter(item => item.status === 'Trusted').length
  const reviewCount = allRecords.filter(item => item.status !== 'Trusted').length

  const visibleRecords = useMemo(() => {
    let records = allRecords

    if (page === 'Social Monitoring') {
      records = records.filter(item => item.kind === 'social')
    } else if (page === 'App Monitoring') {
      records = records.filter(item => item.kind === 'app')
    } else if (page === 'All Alerts') {
      records = records.filter(item => item.kind === 'scan' || item.risk >= 75)
    }

    const term = search.trim().toLowerCase()
    if (term) {
      records = records.filter(item =>
        `${item.name} ${item.subtitle} ${item.source} ${item.reason}`
          .toLowerCase()
          .includes(term)
      )
    }

    if (statusFilter !== 'All statuses') {
      records = records.filter(item => item.status === statusFilter)
    }

    return [...records].sort((a, b) => b.risk - a.risk)
  }, [allRecords, page, search, statusFilter])

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }

  function navigate(nextPage) {
    setPage(nextPage)
    setSearch('')
    setStatusFilter('All statuses')
    setMobileMenu(false)
  }

  function updateStatus(item) {
    if (item.kind === 'scan') {
      showNotice('Scan status changes need backend support.')
      return
    }

    const setter = item.kind === 'social' ? setSocial : setApps
    setter(old => old.map((record, index) => {
      if (index !== item.originalIndex) return record
      return {
        ...record,
        status: record.status === 'Trusted' ? 'Under Review' : 'Trusted',
      }
    }))

    setSelectedAlert(old => old && old.name === item.name
      ? { ...old, status: old.status === 'Trusted' ? 'Under Review' : 'Trusted' }
      : old)

    showNotice('Demo case status updated')
  }

  function addBrand(event) {
    event.preventDefault()

    const name = brandName.trim()
    if (!name) return

    if (brands.some(brand => brand.name.toLowerCase() === name.toLowerCase())) {
      showNotice('That brand already exists')
      return
    }

    setBrands(old => [...old, {
      name,
      category: brandCategory.trim() || 'New brand profile',
      initials: name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(),
      color: 'purple',
      accounts: 0,
      apps: 0,
    }])

    setBrandName('')
    setBrandCategory('')
    setShowBrandForm(false)
    showNotice('Brand added to this demo session')
  }

  function deleteBrand(name) {
    setBrands(old => old.filter(brand => brand.name !== name))
    showNotice('Brand removed from this demo session')
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

      const alertsResponse = await fetch(`${API_URL}/api/alerts`)
      if (alertsResponse.ok) {
        const saved = await alertsResponse.json()
        setScannedAlerts(Array.isArray(saved) ? saved : [])
      }

      showNotice('Risk assessment completed')
    } catch (error) {
      setScanError(
        'Cannot connect to the backend. Start server.js in a separate terminal and try again.'
      )
      console.error(error)
    } finally {
      setScanLoading(false)
    }
  }

  function exportReport() {
    const rows = [
      ['Entity', 'Source', 'Risk score', 'Status', 'Indicators'],
      ...allRecords.map(item => [
        item.name,
        item.source,
        item.risk,
        item.status,
        item.reason,
      ]),
    ]

    const csv = rows
      .map(row => row.map(value =>
        `"${String(value ?? '').replace(/"/g, '""')}"`
      ).join(','))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'brandshield-report.csv'
    link.click()
    URL.revokeObjectURL(url)
    showNotice('CSV report exported')
  }

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand-logo">
          <div className="logo-mark"><ShieldCheck size={24} /></div>
          <div>
            <strong>BrandShield</strong>
            <small>Digital Risk Protection</small>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switch">
          <span className="workspace-avatar">B</span>
          <span className="workspace-copy">
            <b>Brand Team</b>
            <small>Demo workspace</small>
          </span>
          <ChevronRight size={16} />
        </div>

        {navigation.map(group => (
          <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.links.map(link => {
              const Icon = link.icon
              return (
                <button
                  key={link.name}
                  className={`nav-link ${page === link.name ? 'active' : ''}`}
                  onClick={() => navigate(link.name)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{link.name}</span>
                  {link.name === 'All Alerts' && (
                    <span className="nav-count">{highRiskCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="protection-card">
            <div className="protection-icon"><ShieldCheck size={20} /></div>
            <b>Your brand, protected.</b>
            <p>Review lookalikes and investigate suspicious signals in one place.</p>
            <span>
              <span className={`live-dot ${backendStatus === 'offline' ? 'dot-offline' : ''}`} />
              {backendStatus === 'online' ? 'Backend connected' : backendStatus === 'checking' ? 'Connecting…' : 'Demo monitoring'}
            </span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">BT</div>
            <div><b>Brand Team</b><small>Administrator</small></div>
            <span className="profile-menu-dot">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu">
              <Menu size={21} />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span><span>/</span><b>{page}</b>
            </div>
          </div>
          <div className="top-actions">
            <span className={`connection-pill ${backendStatus}`}>
              <span className="live-dot" />
              {backendStatus === 'online' ? 'API CONNECTED' : backendStatus === 'checking' ? 'CONNECTING' : 'DEMO MODE'}
            </span>
            <button className="icon-button" aria-label="Refresh data" onClick={loadData} title="Refresh data">
              <RefreshCw size={18} className={loadingData ? 'spin-icon' : ''} />
            </button>
            <button className="icon-button" aria-label="Open alerts" onClick={() => navigate('All Alerts')}>
              <Bell size={19} />
              {highRiskCount > 0 && <span className="notification-dot" />}
            </button>
            <div className="top-avatar">BT</div>
          </div>
        </header>

        <div className="page-content">
          {page === 'Overview' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Activity size={14} /> BRAND INTELLIGENCE</div>
                  <h1>Your brand. <span>Under protection.</span></h1>
                  <p>Spot suspicious lookalikes, review risk signals, and protect customer trust.</p>
                </div>
                <button className="primary-button" onClick={() => { navigate('Brand Profiles'); setShowBrandForm(true) }}>
                  <Plus size={18} /> Add brand profile
                </button>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top"><span>Monitored brands</span><span className="stat-icon purple"><Building2 size={19} /></span></div>
                  <strong>{brands.length}</strong>
                  <small><span className="stat-positive">● Active</span> brand profiles</small>
                  <div className="stat-bottom"><span>Workspace registry</span><ArrowUpRight size={15} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>High-risk signals</span><span className="stat-icon red"><AlertTriangle size={19} /></span></div>
                  <strong>{highRiskCount}</strong>
                  <small>Records scoring 75 or above</small>
                  <div className="stat-bottom"><span>Requires manual review</span><Eye size={15} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Social profiles</span><span className="stat-icon blue"><Users size={19} /></span></div>
                  <strong>{social.length}</strong>
                  <small>Loaded dashboard records</small>
                  <div className="stat-bottom"><span>Social monitoring</span><ArrowUpRight size={15} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Mobile apps</span><span className="stat-icon orange"><Smartphone size={19} /></span></div>
                  <strong>{apps.length}</strong>
                  <small>Loaded dashboard records</small>
                  <div className="stat-bottom"><span>App monitoring</span><ArrowUpRight size={15} /></div>
                </div>
              </section>

              <section className="insight-banner">
                <div className="insight-symbol"><ShieldCheck size={25} /></div>
                <div>
                  <b>Evidence-first brand protection</b>
                  <p>Review risk indicators before taking action. Scores are signals for investigation, not proof of fraud.</p>
                </div>
                <span className="banner-tag">RISK INTELLIGENCE</span>
              </section>

              <div className="section-heading">
                <div><h2>Recent risk signals</h2><p>Your highest-scoring records, sorted by risk.</p></div>
                <button className="text-button" onClick={() => navigate('All Alerts')}>View all alerts <ArrowUpRight size={16} /></button>
              </div>

              <div className="table-card">
                <div className="table-toolbar">
                  <div className="table-title"><span className="tiny-status" /> Latest findings <span className="record-count">{allRecords.length} records</span></div>
                  <button className="filter-button" onClick={() => navigate('All Alerts')}><Filter size={16} /> Review alerts</button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>ENTITY</th><th>SOURCE</th><th>RISK SCORE</th><th>STATUS</th><th>ACTION</th></tr></thead>
                    <tbody>
                      {[...allRecords].sort((a, b) => b.risk - a.risk).slice(0, 5).map(item => (
                        <tr key={`${item.name}-${item.kind}`}>
                          <td><div className="entity-cell">
                            <div className={`entity-icon ${item.kind}`}>{item.kind === 'social' ? <Users size={18} /> : item.kind === 'app' ? <Smartphone size={18} /> : <ScanSearch size={18} />}</div>
                            <div><b>{item.name}</b><small>{item.subtitle}</small></div>
                          </div></td>
                          <td>{item.source}</td>
                          <td><RiskBadge value={item.risk} /></td>
                          <td><StatusBadge status={item.status} /></td>
                          <td><button className="review-button" onClick={() => setSelectedAlert(item)}>Investigate <ArrowUpRight size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer"><span>Sample records and local rule-based scans</span><span>Updated when refreshed</span></div>
              </div>

              <div className="bottom-grid">
                <section className="panel-card">
                  <div className="panel-heading"><div><h3>Monitoring coverage</h3><p>Records available in this workspace</p></div><Globe size={19} /></div>
                  <div className="coverage-row"><span><Users size={17} /> Social profiles</span><b>{social.length} <small>records</small></b></div>
                  <div className="coverage-row"><span><Smartphone size={17} /> Mobile applications</span><b>{apps.length} <small>records</small></b></div>
                  <div className="coverage-row"><span><Building2 size={17} /> Brand profiles</span><b>{brands.length} <small>brands</small></b></div>
                  <div className="coverage-note"><CheckCircle2 size={16} /> Workspace data loaded</div>
                </section>
                <section className="panel-card">
                  <div className="panel-heading"><div><h3>Priority queue</h3><p>Highest-risk records to investigate</p></div><AlertTriangle size={19} /></div>
                  {highRiskRecords.length === 0 && <EmptyState title="No high-risk records" description="No records currently meet the high-risk threshold." />}
                  {highRiskRecords.slice().sort((a, b) => b.risk - a.risk).slice(0, 3).map(item => (
                    <button className="priority-row priority-clickable" key={`${item.name}-${item.kind}`} onClick={() => setSelectedAlert(item)}>
                      <span className="priority-dot" /><div><b>{item.name}</b><small>{item.reason}</small></div><RiskBadge value={item.risk} />
                    </button>
                  ))}
                  <button className="full-width-button" onClick={() => navigate('All Alerts')}>Open priority queue <ArrowUpRight size={16} /></button>
                </section>
              </div>
            </>
          )}

          {page === 'Risk Scan' && (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow"><ScanSearch size={14} /> INTERACTIVE RISK CHECK</div><h1>Check a suspicious <span>lookalike.</span></h1><p>Compare a suspected entity against official brand details.</p></div>
                <span className="connection-pill online"><ShieldCheck size={15} /> RULE-BASED CHECK</span>
              </section>

              <div className="monitoring-info"><ShieldCheck size={20} /><div><b>Transparent assessment</b><p>This scan evaluates the details you submit through your local API. It does not search Instagram, app stores, or the wider internet.</p></div></div>

              <div className="scan-layout">
                <form className="table-card scan-card" onSubmit={runRiskScan}>
                  <div className="table-toolbar"><div className="table-title">Brand and suspected entity</div><span className={`backend-pill ${backendStatus}`}>{backendStatus === 'online' ? 'Backend online' : backendStatus === 'offline' ? 'Backend offline' : 'Connecting'}</span></div>
                  <div className="scan-form-body">
                    <Field label="Brand name" value={scanForm.brandName} onChange={e => changeScanField('brandName', e.target.value)} placeholder="e.g. MangoLeaf Naturals" required />
                    <Field label="Official brand name" value={scanForm.officialName} onChange={e => changeScanField('officialName', e.target.value)} placeholder="Name used by the real brand" required />
                    <Field label="Suspicious name" value={scanForm.suspectName} onChange={e => changeScanField('suspectName', e.target.value)} placeholder="e.g. MangoLeaf Naturals Support" required />
                    <div className="scan-two-cols">
                      <Field label="Official website (optional)" value={scanForm.officialWebsite} onChange={e => changeScanField('officialWebsite', e.target.value)} placeholder="https://official.example" />
                      <Field label="Suspicious website (optional)" value={scanForm.suspectWebsite} onChange={e => changeScanField('suspectWebsite', e.target.value)} placeholder="https://lookalike.example" />
                    </div>
                    <button className="primary-button scan-submit" type="submit" disabled={scanLoading}>
                      {scanLoading ? <><Clock size={18} /> Checking…</> : <><ScanSearch size={18} /> Run risk check</>}
                    </button>
                    {scanError && <div className="scan-error" role="alert"><AlertTriangle size={18} />{scanError}</div>}
                  </div>
                </form>

                <section className="table-card scan-result-card">
                  <div className="table-toolbar"><div className="table-title">Assessment result</div></div>
                  {!scanResult && !scanLoading && <div className="scan-empty"><div className="scan-empty-icon"><ShieldCheck size={28} /></div><b>Ready to assess</b><p>Enter the details and run the check to view the result.</p></div>}
                  {scanLoading && <div className="scan-empty"><Clock size={28} /><b>Evaluating submitted details…</b><p>Waiting for your local backend.</p></div>}
                  {scanResult && (
                    <div className="result-body">
                      <div className="result-score-row"><div><span className="result-label">RISK SCORE</span><div className="result-score">{scanResult.riskScore ?? scanResult.score ?? '—'}<small>/100</small></div></div><span className={`result-level ${(scanResult.riskLevel || scanResult.level || 'unknown').toLowerCase()}`}>{scanResult.riskLevel || scanResult.level || 'Assessed'}</span></div>
                      <div className="risk-meter"><span style={{ width: `${Math.max(0, Math.min(100, Number(scanResult.riskScore ?? scanResult.score ?? 0)))}%` }} /></div>
                      <p className="result-disclaimer">Automated rule-based indicator only; this is not proof of fraud.</p>
                      <h3>Reasons and signals</h3>
                      {Array.isArray(scanResult.reasons) && scanResult.reasons.length > 0
                        ? <ul className="result-reasons">{scanResult.reasons.map((reason, index) => <li key={index}><AlertTriangle size={15} />{typeof reason === 'string' ? reason : reason.message || reason.reason || JSON.stringify(reason)}</li>)}</ul>
                        : <p className="muted-copy">No separate reason list was returned by the API.</p>}
                      {scanResult.checks && <><h3>API checks</h3><pre className="result-json">{JSON.stringify(scanResult.checks, null, 2)}</pre></>}
                      <button className="cancel-button" onClick={() => { setScanResult(null); setScanError('') }}>Clear result</button>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {(page === 'Social Monitoring' || page === 'App Monitoring' || page === 'All Alerts') && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Activity size={14} /> DETECTION CENTER</div>
                  <h1>{page === 'All Alerts' ? 'Risk & alert center' : page}</h1>
                  <p>{page === 'Social Monitoring' ? 'Review social profile records and impersonation indicators.' : page === 'App Monitoring' ? 'Review application names, publishers, and possible mismatches.' : 'Investigate high-risk records and results from your local scans.'}</p>
                </div>
                <button className="primary-button" onClick={loadData}><RefreshCw size={16} /> Refresh data</button>
              </section>

              <div className="monitoring-info"><ShieldCheck size={20} /><div><b>Review before you report</b><p>Sample records are illustrative. Risk scores indicate possible signals and must be verified independently.</p></div></div>

              <div className="table-card monitoring-table">
                <div className="table-toolbar">
                  <div className="table-title">Detected entities <span className="record-count">{visibleRecords.length} shown</span></div>
                  <div className="table-filters">
                    <div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." /></div>
                    <select className="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                      <option>All statuses</option><option>New Alert</option><option>Under Review</option><option>Trusted</option>
                    </select>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>ENTITY</th><th>SOURCE</th><th>INDICATORS</th><th>RISK</th><th>STATUS</th><th>ACTION</th></tr></thead>
                    <tbody>
                      {visibleRecords.map(item => (
                        <tr key={`${item.name}-${item.kind}`}>
                          <td><div className="entity-cell"><div className={`entity-icon ${item.kind}`}>{item.kind === 'social' ? <Users size={18} /> : item.kind === 'app' ? <Smartphone size={18} /> : <ScanSearch size={18} />}</div><div><b>{item.name}</b><small>{item.subtitle}</small></div></div></td>
                          <td>{item.source}</td>
                          <td className="reason-cell">{item.reason}</td>
                          <td><RiskBadge value={item.risk} /></td>
                          <td><StatusBadge status={item.status} /></td>
                          <td><div className="action-buttons"><button className="review-button" onClick={() => setSelectedAlert(item)}>Evidence <Eye size={14} /></button>{item.kind !== 'scan' && <button className="review-button secondary-review" onClick={() => updateStatus(item)}>Update</button>}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleRecords.length === 0 && <EmptyState title="No matching records" description="Try changing your search or status filter." />}
                <div className="table-footer"><span>Sample records and local assessments</span><span>Verify before reporting</span></div>
              </div>
            </>
          )}

          {page === 'Brand Profiles' && (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow"><Building2 size={14} /> BRAND ASSET REGISTRY</div><h1>Brand profiles</h1><p>Organize brand identities and assets for your investigation workflow.</p></div>
                <button className="primary-button" onClick={() => setShowBrandForm(!showBrandForm)}><Plus size={18} /> Add brand</button>
              </section>

              {showBrandForm && (
                <form className="add-brand-form" onSubmit={addBrand}>
                  <div><b>Create a brand profile</b><p>Profiles added here remain in the current browser session.</p></div>
                  <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Brand name" required />
                  <input value={brandCategory} onChange={e => setBrandCategory(e.target.value)} placeholder="Category (optional)" />
                  <button className="primary-button" type="submit">Save profile</button>
                  <button className="cancel-button" type="button" onClick={() => setShowBrandForm(false)}>Cancel</button>
                </form>
              )}

              <div className="brand-summary">
                <div><span className="stat-icon purple"><Building2 size={20} /></span><div><small>Total profiles</small><b>{brands.length}</b></div></div>
                <div><span className="stat-icon blue"><Users size={20} /></span><div><small>Social assets listed</small><b>{brands.reduce((sum, brand) => sum + Number(brand.accounts || 0), 0)}</b></div></div>
                <div><span className="stat-icon orange"><Smartphone size={20} /></span><div><small>Apps listed</small><b>{brands.reduce((sum, brand) => sum + Number(brand.apps || 0), 0)}</b></div></div>
              </div>

              <div className="brand-grid">
                {brands.map(brand => (
                  <div className="brand-card" key={brand.name}>
                    <div className="brand-card-top"><div className={`brand-initials ${brand.color}`}>{brand.initials}</div><span className="profile-ready"><CheckCircle2 size={14} /> Registered</span></div>
                    <h3>{brand.name}</h3><p>{brand.category}</p>
                    <div className="brand-metrics"><div><Users size={17} /><span>Social assets</span><b>{brand.accounts}</b></div><div><Smartphone size={17} /><span>Mobile apps</span><b>{brand.apps}</b></div></div>
                    <div className="brand-card-footer"><span><ShieldCheck size={16} /> Workspace profile</span><button onClick={() => deleteBrand(brand.name)} title="Remove profile"><Trash2 size={15} /> Remove</button></div>
                  </div>
                ))}
              </div>

              {brands.length === 0 && <EmptyState title="No brand profiles yet" description="Add a brand to begin organizing your workspace." />}

              <div className="monitoring-info brand-info"><AlertTriangle size={20} /><div><b>Demo limitation</b><p>Adding and removing brands updates the current frontend session. Saving profiles permanently requires backend storage.</p></div></div>
            </>
          )}

          {page === 'Reports' && (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow"><FileWarning size={14} /> CASE SUMMARY</div><h1>Reports & insights</h1><p>Review the current workspace records and export a summary.</p></div>
                <div className="report-actions"><button className="filter-button" onClick={() => window.print()}><Download size={16} /> Print</button><button className="primary-button" onClick={exportReport}><Download size={16} /> Export CSV</button></div>
              </section>

              <section className="stats-grid">
                <div className="stat-card"><div className="stat-top"><span>Total records</span><span className="stat-icon blue"><Activity size={19} /></span></div><strong>{allRecords.length}</strong><small>Loaded workspace records</small></div>
                <div className="stat-card"><div className="stat-top"><span>High-risk</span><span className="stat-icon red"><AlertTriangle size={19} /></span></div><strong>{highRiskCount}</strong><small>Score 75 or above</small></div>
                <div className="stat-card"><div className="stat-top"><span>Trusted records</span><span className="stat-icon green"><CheckCircle2 size={19} /></span></div><strong>{trustedCount}</strong><small>Marked trusted</small></div>
                <div className="stat-card"><div className="stat-top"><span>Needs review</span><span className="stat-icon orange"><Clock size={19} /></span></div><strong>{reviewCount}</strong><small>Not marked trusted</small></div>
              </section>

              <div className="insight-banner"><div className="insight-symbol"><TrendingUp size={24} /></div><div><b>Risk overview</b><p>Use the exported report as a review aid. The dashboard includes illustrative sample records and local rule-based assessments.</p></div><span className="banner-tag">REPORT SUMMARY</span></div>

              <div className="table-card">
                <div className="table-toolbar"><div className="table-title">Workspace report <span className="record-count">{allRecords.length} records</span></div><button className="filter-button" onClick={exportReport}><Download size={16} /> Export CSV</button></div>
                <div className="table-scroll"><table><thead><tr><th>ENTITY</th><th>SOURCE</th><th>RISK</th><th>STATUS</th><th>INDICATORS</th></tr></thead><tbody>{allRecords.map(item => <tr key={`${item.name}-${item.kind}`}><td><b>{item.name}</b><small className="subline">{item.subtitle}</small></td><td>{item.source}</td><td><RiskBadge value={item.risk} /></td><td><StatusBadge status={item.status} /></td><td className="reason-cell">{item.reason}</td></tr>)}</tbody></table></div>
                <div className="table-footer"><span>Generated from current workspace data</span><span>BrandShield · Prototype report</span></div>
              </div>
            </>
          )}

          <footer className="page-footer"><span>© 2026 BrandShield</span><span><span className="live-dot" /> Prototype mode · sample data</span><span>Privacy-first · Evidence-led</span></footer>
        </div>
      </main>

      {selectedAlert && (
        <div className="evidence-overlay" role="dialog" aria-modal="true" aria-label="Alert evidence" onClick={event => { if (event.target === event.currentTarget) setSelectedAlert(null) }}>
          <div className="table-card evidence-modal">
            <div className="section-heading"><div><div className="eyebrow"><ShieldCheck size={14} /> INVESTIGATION DETAILS</div><h2>Alert evidence</h2><p>Review the available indicators before taking action.</p></div><button className="cancel-button" onClick={() => setSelectedAlert(null)}><X size={16} /> Close</button></div>
            <div className="evidence-title-row"><div><h3>{selectedAlert.name}</h3><p>{selectedAlert.subtitle || selectedAlert.handle || selectedAlert.publisher}</p></div><RiskBadge value={selectedAlert.risk} /></div>
            <div className="evidence-details">
              <div><small>Source</small><b>{selectedAlert.source || selectedAlert.platform || selectedAlert.store || 'Risk Scan'}</b></div>
              <div><small>Current status</small><StatusBadge status={selectedAlert.status} /></div>
              <div className="evidence-full"><small>Risk indicators</small><b>{selectedAlert.reason || getReason(selectedAlert)}</b></div>
              <div className="evidence-full"><small>Evidence type</small><b>{selectedAlert.kind === 'scan' ? 'Local rule-based assessment' : 'Illustrative sample record'}</b></div>
            </div>
            <div className="monitoring-info"><AlertTriangle size={20} /><div><b>Human review required</b><p>This score is not proof of fraud. Independently verify account ownership, URLs, publisher identity, and other available evidence before reporting.</p></div></div>
            {selectedAlert.kind !== 'scan' && <button className="primary-button evidence-update" onClick={() => updateStatus(selectedAlert)}><CheckCircle2 size={17} /> {selectedAlert.status === 'Trusted' ? 'Move to review' : 'Mark as trusted'}</button>}
          </div>
        </div>
      )}

      {notice && <div className="toast"><CheckCircle2 size={18} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  )
}

export default App