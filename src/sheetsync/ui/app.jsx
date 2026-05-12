const googleLinks = {
  cloud: "https://console.cloud.google.com/",
  library: "https://console.cloud.google.com/apis/library",
  credentials: "https://console.cloud.google.com/apis/credentials",
  consent: "https://console.cloud.google.com/apis/credentials/consent",
  sheetsApi: "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
  driveApi: "https://console.cloud.google.com/apis/library/drive.googleapis.com",
  revoke: "https://myaccount.google.com/permissions",
};

const sync = {
  workbook: "Q2 pipeline.xlsx",
  excelPath: "C:\\Users\\Hen\\Documents\\Finance\\Q2 pipeline.xlsx",
  sheetUrl: "https://docs.google.com/spreadsheets/d/1SheetSyncDemo/edit",
  worksheet: "Pipeline",
  googleEmail: "hen@example.com",
  lastSync: "42 seconds ago",
};

const syncPairs = [
  {
    id: "pipeline",
    name: "Q2 Pipeline",
    workbook: "Q2 pipeline.xlsx",
    sheetName: "Q4 Revenue Pipeline",
    frequency: "on change",
    excelPath: "C:\\Users\\Hen\\Documents\\Finance\\Q2 pipeline.xlsx",
    sheetUrl: "https://docs.google.com/spreadsheets/d/1SheetSyncDemo/edit",
    worksheet: "Pipeline",
    lastSync: "42 seconds ago",
    state: "live",
    pinned: true,
    rows: 4218,
    conflicts: 0,
  },
  {
    id: "vendors",
    name: "Vendor Matrix",
    workbook: "Vendor matrix.xlsx",
    sheetName: "Vendor contracts",
    frequency: "1 min",
    excelPath: "C:\\Users\\Hen\\Documents\\Ops\\Vendor matrix.xlsx",
    sheetUrl: "https://docs.google.com/spreadsheets/d/2VendorDemo/edit",
    worksheet: "Vendors",
    lastSync: "3 minutes ago",
    state: "live",
    pinned: true,
    rows: 184,
    conflicts: 0,
  },
  {
    id: "inventory",
    name: "Inventory Audit",
    workbook: "Inventory audit.xlsx",
    sheetName: "Inventory Audit",
    frequency: "manual",
    excelPath: "C:\\Users\\Hen\\Documents\\Warehouse\\Inventory audit.xlsx",
    sheetUrl: "https://docs.google.com/spreadsheets/d/3InventoryDemo/edit",
    worksheet: "Audit",
    lastSync: "Paused",
    state: "idle",
    pinned: false,
    rows: 0,
    conflicts: 1,
  },
];

const events = [
  ["10:42", "check-circle-2", "Synced 214 rows from Excel to Google Sheets", "+214"],
  ["10:39", "file-spreadsheet", "Detected save in Q2 pipeline.xlsx", ""],
  ["10:31", "refresh-cw", "Manual sync completed for Pipeline worksheet", "+18"],
  ["09:58", "triangle-alert", "Conflict resolved with Excel wins", "1"],
  ["09:12", "key-round", "Google OAuth token refreshed locally", ""],
];

const onboardingSteps = [
  { title: "OAuth client", label: "Add your Desktop JSON", icon: "key-round" },
  { title: "Google account", label: "Sign in securely", icon: "badge-check" },
  { title: "Files", label: "Pick workbook and Sheet", icon: "folder-open" },
  { title: "Sync rules", label: "Confirm behavior", icon: "sliders-horizontal" },
];

function Icon({ name, size = 16 }) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}

function GoogleG() {
  return (
    <svg className="google-g" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 7 29.4 5 24 5c-7.7 0-14.4 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.8-5.3l-6.4-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 4-3.7 5.4l6.4 5.2C42.4 35.5 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function useLucide() {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

function VerticalNav({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme, onNavigate }) {
  const menu = [
    ["dashboard", "Dashboard", "layout-dashboard"],
    ["activity", "Activity", "message-square"],
    ["settings", "Settings", "settings"],
  ];
  const pinnedPairs = pairs.filter((pair) => pair.pinned).slice(0, 4);
  return (
    <div className="vertical-nav">
      <div className="brand-block">
        <div className="brand-mark"><Icon name="table-2" size={14} /></div>
        <div>
          <h2>SheetSync</h2>
          <p>Desktop sync</p>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <div className="nav-list">
        {menu.map(([id, label, icon]) => (
          <button
            className={`nav-btn ${tab === id ? "active" : ""}`}
            key={id}
            onClick={() => {
              setTab(id);
              onNavigate?.();
            }}
          >
            <Icon name={icon} />
            <span>{label}</span>
            {id === "dashboard" && <span className="nav-dot" />}
          </button>
        ))}
      </div>
      <div className="nav-label pinned-label">Pinned pairs</div>
      <div className="nav-list">
        {pinnedPairs.map((pair) => (
          <button
            className={`nav-btn pair-link ${activePairId === pair.id ? "active" : ""}`}
            key={pair.id}
            onClick={() => {
              setActivePairId(pair.id);
              setTab("dashboard");
              onNavigate?.();
            }}
          >
            <Icon name="file-spreadsheet" />
            <span>{pair.name}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-foot">
        <div className="avatar">H</div>
        <div className="avatar-meta">
          <strong>Hen</strong>
          <span>{sync.googleEmail}</span>
        </div>
        <button className="icon-toggle sidebar-theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle dark mode">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
        </button>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme }) {
  return (
    <aside className="sidebar">
      <VerticalNav tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} />
    </aside>
  );
}

function MobileNav({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="mobile-nav-trigger" onClick={() => setOpen(true)} aria-label="Open navigation">
        <Icon name="menu" size={20} />
      </button>
      {open && (
        <div className="mobile-sheet-layer">
          <div className="mobile-sheet-backdrop" onClick={() => setOpen(false)} />
          <aside className="mobile-sheet">
            <button className="mobile-sheet-close" onClick={() => setOpen(false)} aria-label="Close navigation">
              <Icon name="x" />
            </button>
            <VerticalNav tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

function Topbar() {
  const title = "Dashboard";
  return (
    <header className="topbar">
      <div className="crumbs">
        <span>Workspace</span>
        <span>/</span>
        <strong>{title}</strong>
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-search">
        <Icon name="search" size={13} />
        <input placeholder="Search pairs, files, runs..." />
        <span className="kbd">⌘K</span>
      </div>
      <button className="btn compact"><Icon name="plus" /> New</button>
    </header>
  );
}

function PairMiniCard({ pair, active, onSelect }) {
  return (
    <button className={`pair-row-card ${active ? "active" : ""}`} onClick={onSelect}>
      <div className="pair-row-main">
        <div className="pair-source-icons">
          <span className="pair-source excel"><Icon name="file-spreadsheet" size={13} /></span>
          <Icon name={pair.state === "idle" ? "arrow-right" : "arrow-left-right"} size={17} />
          <span className="pair-source sheet"><Icon name="table-2" size={13} /></span>
        </div>
        <div className="pair-row-title">
          <strong>{pair.name}</strong>
          <span>{pair.workbook} · {pair.sheetName}</span>
        </div>
        <span className={`state-pill ${pair.state}`}><span />{pair.state === "idle" ? "Paused" : "Live"}</span>
      </div>
      <div className="pair-row-stats">
        <div><strong>{pair.rows.toLocaleString()}</strong><span>Rows</span></div>
        <div><strong>{pair.frequency}</strong><span>Frequency</span></div>
        <div><strong>{pair.lastSync}</strong><span>Last sync</span></div>
      </div>
    </button>
  );
}

function Dashboard({ setTab, pairs, activePairId, setActivePairId }) {
  const activePair = pairs.find((pair) => pair.id === activePairId) || pairs[0];
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Monitor active Excel and Google Sheet pairs from a quiet desktop surface.</div>
        </div>
      </div>

      <section className="dashboard-grid essentials-grid">
        <div className="card stat-card primary">
          <div className="card-top">
            <h2 className="card-title">Last sync</h2>
            <span className="jump"><Icon name="clock-3" /></span>
          </div>
          <div className="stat-value">{activePair.lastSync === "Paused" ? "--" : "42s"}</div>
          <div className="stat-foot"><span className="tiny-badge"><Icon name="check" size={12} /> Successful</span> no action needed</div>
        </div>
        <div className="card stat-card">
          <div className="card-top"><h2 className="card-title">Pending changes</h2><span className="jump"><Icon name="inbox" /></span></div>
          <div className="stat-value">{pairs.filter((pair) => pair.state === "live").length}</div>
          <div className="stat-foot">Active watched pairs</div>
        </div>
        <div className="card stat-card">
          <div className="card-top"><h2 className="card-title">Conflicts</h2><span className="jump"><Icon name="git-merge" /></span></div>
          <div className="stat-value">{pairs.reduce((total, pair) => total + pair.conflicts, 0)}</div>
          <div className="stat-foot"><span className="tiny-badge"><Icon name="shield-check" size={12} /> Excel wins</span> current policy</div>
        </div>
      </section>

      <section className="card sync-hub">
        <div className="section-head sync-hub-head">
          <div>
            <h2>Sync pairs</h2>
            <p>Pick a pair to inspect its local workbook, Google Sheet, and current controls.</p>
          </div>
          <span className="count-pill">{pairs.length}</span>
        </div>

        <div className="sync-pair-strip">
          {pairs.map((pair) => (
            <PairMiniCard key={pair.id} pair={pair} active={pair.id === activePair.id} onSelect={() => setActivePairId(pair.id)} />
          ))}
        </div>

        <div className="sync-detail-panel">
          <div className="card-top">
            <div><h2 className="card-title">{activePair.name}</h2><p className="card-sub">Selected active pair</p></div>
            <span className="tiny-badge"><Icon name="repeat-2" size={12} /> Bidirectional</span>
          </div>
          <div className="sync-paths">
            <div className="path-box">
              <div className="project-logo" style={{ background: "#168451" }}><Icon name="file-spreadsheet" size={15} /></div>
              <div><strong>{activePair.workbook}</strong><span>{activePair.excelPath}</span></div>
            </div>
            <div className="path-arrow"><Icon name="arrow-left-right" /></div>
            <div className="path-box">
              <div className="project-logo" style={{ background: "#2a9d99" }}><Icon name="table-2" size={15} /></div>
              <div><strong>{activePair.worksheet}</strong><span>{activePair.sheetUrl}</span></div>
            </div>
          </div>
          <div className="control-row">
            <button className="btn primary"><Icon name="refresh-cw" /> Sync now</button>
            <button className="btn"><Icon name="pause" /> Pause watching</button>
            <button className="btn"><Icon name="folder-open" /> Change workbook</button>
          </div>
        </div>
      </section>

      <section className="lower-grid single-row">
        <div className="card activity-card">
          <div className="card-top"><h2 className="card-title">Recent activity</h2><button className="btn" style={{ height: 32, padding: "0 10px" }}>View all</button></div>
          <div className="project-list">
            {events.slice(0, 3).map(([time, icon, text, rows]) => (
              <div className="project-row" key={time + text}>
                <div className="project-logo" style={{ background: "#168451" }}><Icon name={icon} size={15} /></div>
                <div><strong>{text}</strong><span>{time} {rows ? "- " + rows + " rows" : ""}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Onboarding({ onClose }) {
  const [step, setStep] = React.useState(0);
  const data = onboardingSteps[step];
  return (
    <div className="overlay">
      <section className="glass-onboarding">
        <button className="overlay-close" onClick={onClose}><Icon name="x" /></button>
        <div className="overlay-head">
          <div>
            <span className="tiny-badge"><GoogleG /> First launch</span>
            <h2>Set up SheetSync</h2>
            <p>{data.label}</p>
          </div>
          <span className="pill">Step {step + 1} of {onboardingSteps.length}</span>
        </div>

        <div className="overlay-steps">
          {onboardingSteps.map((item, index) => (
            <button key={item.title} className={`overlay-step ${index === step ? "active" : index < step ? "done" : ""}`} onClick={() => setStep(index)}>
              <Icon name={index < step ? "check" : item.icon} />
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        <div className="overlay-body">
          {step === 0 && <OAuthStep />}
          {step === 1 && <GoogleStep />}
          {step === 2 && <FilesStep />}
          {step === 3 && <RulesStep />}
        </div>

        <div className="overlay-actions">
          <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="arrow-left" /> Back</button>
          <button className="btn primary" onClick={() => step === onboardingSteps.length - 1 ? onClose() : setStep(step + 1)}>
            {step === onboardingSteps.length - 1 ? "Finish setup" : "Continue"} <Icon name="arrow-right" />
          </button>
        </div>
      </section>
    </div>
  );
}

function OAuthStep() {
  return (
    <div className="simple-step">
      <Icon name="key-round" size={30} />
      <h3>Add your OAuth client JSON</h3>
      <p>Use a Google Cloud OAuth Client ID with application type <strong>Desktop app</strong>.</p>
      <ol>
        <li>Create or select a Google Cloud project.</li>
        <li>Enable Sheets API and Drive API.</li>
        <li>Create OAuth Client ID, choose Desktop app, download JSON.</li>
      </ol>
      <div className="compact-links">
        <a href={googleLinks.cloud} target="_blank" rel="noreferrer"><GoogleG /> Cloud Console</a>
        <a href={googleLinks.sheetsApi} target="_blank" rel="noreferrer">Sheets API</a>
        <a href={googleLinks.driveApi} target="_blank" rel="noreferrer">Drive API</a>
        <a href={googleLinks.credentials} target="_blank" rel="noreferrer">Credentials</a>
      </div>
      <div className="field">
        <label>OAuth Desktop client JSON</label>
        <div className="file-drop"><Icon name="upload" /> Choose credentials.json</div>
      </div>
    </div>
  );
}

function GoogleStep() {
  return (
    <div className="simple-step">
      <GoogleG />
      <h3>Connect Google</h3>
      <p>After the JSON is added, SheetSync opens the Google OAuth screen in your browser and stores the token locally on this PC.</p>
      <button className="btn google"><GoogleG /> Sign in with Google</button>
      <p className="fine-print">This app requests access to all your Google Sheets in order to sync the sheet you select. You can revoke access later from <a href={googleLinks.revoke} target="_blank" rel="noreferrer">Google Account permissions</a>.</p>
    </div>
  );
}

function FilesStep() {
  return (
    <div className="simple-step">
      <Icon name="folder-open" size={30} />
      <h3>Choose your files</h3>
      <p>Select one local Excel workbook and paste the Google Sheet URL it should sync with.</p>
      <div className="field"><label>Excel workbook</label><div className="file-drop"><Icon name="file-spreadsheet" /> Q2 pipeline.xlsx</div></div>
      <div className="field"><label>Google Sheet URL</label><input className="input" value={sync.sheetUrl} readOnly /></div>
    </div>
  );
}

function RulesStep() {
  return (
    <div className="simple-step">
      <Icon name="sliders-horizontal" size={30} />
      <h3>Confirm sync rules</h3>
      <p>Keep the first setup conservative. You can change these later in Settings.</p>
      <div className="field"><label>Direction</label><select className="select" defaultValue="Bidirectional"><option>Bidirectional</option><option>Excel -> Sheets</option><option>Sheets -> Excel</option></select></div>
      <div className="field"><label>Conflict policy</label><select className="select" defaultValue="Excel wins"><option>Excel wins</option><option>Sheets wins</option></select></div>
    </div>
  );
}

function Activity() {
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Activity</h1><div className="page-sub">Mock run log for sync, auth, and watcher events.</div></div>
      </div>
      <div className="card">
        <div className="project-list">
          {events.map(([time, icon, text, rows]) => (
            <div className="project-row" key={time + text}>
              <div className="project-logo" style={{ background: "#168451" }}><Icon name={icon} size={15} /></div>
              <div><strong>{text}</strong><span>{time} {rows ? "- " + rows + " rows" : ""}</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Settings({ pairs, activePairId, setActivePairId }) {
  const activePair = pairs.find((pair) => pair.id === activePairId) || pairs[0];
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Settings</h1><div className="page-sub">Manage sync pairs, Google access, and desktop behavior.</div></div>
        <div className="head-actions">
          <button className="btn primary"><Icon name="plus" /> Add pair</button>
        </div>
      </div>

      <section className="settings-layout">
        <div className="card settings-pairs">
          <div className="section-head"><h2>Sync pairs</h2><span className="count-pill">{pairs.length}</span></div>
          <div className="settings-pair-list">
            {pairs.map((pair) => (
              <button key={pair.id} className={`settings-pair ${pair.id === activePair.id ? "active" : ""}`} onClick={() => setActivePairId(pair.id)}>
                <span className={`state-dot ${pair.state}`} />
                <div>
                  <strong>{pair.name}</strong>
                  <span>{pair.workbook}</span>
                </div>
                {pair.pinned && <Icon name="pin" size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-main">
          <div className="card">
            <div className="card-top">
              <div><h2 className="card-title">{activePair.name}</h2><p className="card-sub">Pair-specific file, Sheet, and sync behavior.</p></div>
              <span className={`state-pill ${activePair.state}`}><span />{activePair.state === "idle" ? "Paused" : "Live"}</span>
            </div>
            <div className="settings-form-grid">
              <div className="field"><label>Pair name</label><input className="input" readOnly value={activePair.name} /></div>
              <div className="field"><label>Worksheet</label><input className="input" readOnly value={activePair.worksheet} /></div>
              <div className="field wide-field"><label>Excel workbook</label><div className="file-drop"><Icon name="file-spreadsheet" /> {activePair.excelPath}</div></div>
              <div className="field wide-field"><label>Google Sheet URL</label><input className="input" readOnly value={activePair.sheetUrl} /></div>
              <div className="field"><label>Sync direction</label><select className="select" defaultValue="Bidirectional"><option>Bidirectional</option><option>Excel -> Sheets</option><option>Sheets -> Excel</option></select></div>
              <div className="field"><label>Conflict policy</label><select className="select" defaultValue="Excel wins"><option>Excel wins</option><option>Sheets wins</option></select></div>
            </div>
            <div className="control-row">
              <button className="btn primary"><Icon name="save" /> Save pair</button>
              <button className="btn"><Icon name="pause" /> Pause pair</button>
              <button className="btn"><Icon name="pin" /> Toggle pin</button>
              <button className="btn danger"><Icon name="trash-2" /> Remove</button>
            </div>
          </div>

          <div className="settings-two-col">
            <div className="card">
              <h2 className="card-title">Google access</h2>
              <p className="card-sub">SheetSync uses your own Google Cloud Desktop OAuth client.</p>
              <div className="settings-status-row"><GoogleG /><div><strong>{sync.googleEmail}</strong><span>Connected locally on this PC</span></div></div>
              <div className="control-row">
                <button className="btn google"><GoogleG /> Replace JSON</button>
                <button className="btn"><Icon name="log-out" /> Disconnect</button>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">App behavior</h2>
              <div className="settings-toggle-row"><div><strong>Notifications</strong><span>Show desktop sync results</span></div><span className="switch on" /></div>
              <div className="settings-toggle-row"><div><strong>Minimize to tray</strong><span>Keep watchers running when closed</span></div><span className="switch on" /></div>
              <div className="field"><label>Watcher debounce</label><select className="select" defaultValue="1.5 seconds"><option>1.5 seconds</option><option>3 seconds</option><option>5 seconds</option></select></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  useLucide();
  const [tab, setTab] = React.useState("dashboard");
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [theme, setTheme] = React.useState("light");
  const [activePairId, setActivePairId] = React.useState(syncPairs[0].id);
  React.useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);
  return (
    <>
      <div className="frame">
        <MobileNav tab={tab} setTab={setTab} pairs={syncPairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} />
        <Sidebar tab={tab} setTab={setTab} pairs={syncPairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} />
        <main className="workspace">
          <Topbar />
          <section className="content">
            {tab === "dashboard" && <Dashboard setTab={setTab} pairs={syncPairs} activePairId={activePairId} setActivePairId={setActivePairId} />}
            {tab === "activity" && <Activity />}
            {tab === "settings" && <Settings pairs={syncPairs} activePairId={activePairId} setActivePairId={setActivePairId} />}
          </section>
        </main>
      </div>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
