import React from 'react';
import * as LucideIcons from 'lucide-react';
import appIcon from './app_icon.png';

const googleLinks = {
  cloud: "https://console.cloud.google.com/",
  library: "https://console.cloud.google.com/apis/library",
  credentials: "https://console.cloud.google.com/apis/credentials",
  consent: "https://console.cloud.google.com/apis/credentials/consent",
  sheetsApi: "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
  driveApi: "https://console.cloud.google.com/apis/library/drive.googleapis.com",
  revoke: "https://myaccount.google.com/permissions",
};

const onboardingSteps = [
  { title: "OAuth client", label: "Add your Desktop JSON", icon: "key-round" },
  { title: "Google account", label: "Sign in securely", icon: "badge-check" },
  { title: "Files", label: "Pick workbook and Sheet", icon: "folder-open" },
  { title: "Sync rules", label: "Confirm behavior", icon: "sliders-horizontal" },
];

// ── dev mock (browser only, no pywebview) ────────────────────────────────────
if (typeof window !== "undefined" && !window.pywebview) {
  const _mockPairs = [
    { id: "pair1", name: "Q2 Sales", excel: "C:/Reports/Q2 Sales.xlsx", sheet: "https://docs.google.com/spreadsheets/d/abc123", sheetId: "abc123", worksheet: "Sheet1", rows: 1420, cols: 8, conflicts: 3, lastSync: "2m ago", every: "on change", state: "live", pinned: true, direction: "both", lastEditedSide: "excel", syncIntervalMinutes: 0, sheetsPollEnabled: false, sheetsPollInterval: 300, columnMappings: {} },
    { id: "pair2", name: "Inventory Master", excel: "C:/Data/Inventory.xlsx", sheet: "https://docs.google.com/spreadsheets/d/def456", sheetId: "def456", worksheet: "Main", rows: 842, cols: 12, conflicts: 0, lastSync: "1h ago", every: "on change", state: "live", pinned: true, direction: "both", lastEditedSide: "sheets", syncIntervalMinutes: 15, sheetsPollEnabled: true, sheetsPollInterval: 300, columnMappings: { "Item Code": "SKU" } },
    { id: "pair3", name: "HR Roster", excel: "C:/HR/Roster.xlsx", sheet: "https://docs.google.com/spreadsheets/d/ghi789", sheetId: "ghi789", worksheet: "Employees", rows: 214, cols: 6, conflicts: 0, lastSync: "3d ago", every: "on change", state: "idle", pinned: false, direction: "excelToSheet", lastEditedSide: "excel", syncIntervalMinutes: 0, sheetsPollEnabled: false, sheetsPollInterval: 300, columnMappings: {} },
  ];
  const _mockActivity = [
    { t: "2:14 PM", state: "ok", msg: "Synced 12 rows in Q2 Sales", rows: "+12" },
    { t: "1:58 PM", state: "yellow", msg: "Conflict resolved in Inventory Master — Excel wins", rows: "" },
    { t: "1:30 PM", state: "ok", msg: "Synced 3 rows in Inventory Master", rows: "+3" },
    { t: "12:05 PM", state: "red", msg: "Sync failed: Excel file locked by another process", rows: "" },
    { t: "11:47 AM", state: "ok", msg: "Synced 28 rows in Q2 Sales", rows: "+28" },
    { t: "10:22 AM", state: "blue", msg: "Watcher started for Q2 Sales", rows: "" },
  ];
  window.pywebview = {
    api: {
      get_initial_data: async () => ({ setup_complete: true, ready: true, active_pair_id: "pair1", pairs: _mockPairs, activity: _mockActivity, status: "watching", credentials_configured: true, config: { google_email: "you@gmail.com", notifications: true, minimize_to_tray: true, debounce_delay: 1.5, sync_direction: "Bidirectional", conflict_resolution: "Excel wins", pairs: [] } }),
      sync_now: async () => ({ ok: true }),
      toggle_pair_pause: async (id) => ({ ok: true, pairs: _mockPairs.map((p) => p.id === id ? { ...p, state: p.state === "live" ? "idle" : "live" } : p) }),
      toggle_pair_pin: async (id) => ({ ok: true, pairs: _mockPairs.map((p) => p.id === id ? { ...p, pinned: !p.pinned } : p) }),
      set_active_pair: async (id) => ({ ok: true, active_pair_id: id, pairs: _mockPairs }),
      save_settings: async () => ({ ok: true, pairs: _mockPairs, active_pair_id: "pair1", config: { google_email: "you@gmail.com", notifications: true, minimize_to_tray: true, debounce_delay: 1.5, sync_direction: "Bidirectional", conflict_resolution: "Excel wins", pairs: [] } }),
      delete_pair: async (id) => ({ ok: true, pairs: _mockPairs.filter((p) => p.id !== id), active_pair_id: "pair1" }),
      get_conflict_log: async () => ({ ok: true, conflicts: [{ key: "row_4", col: "Revenue", excel_val: "84200", sheet_val: "82000", resolved_to: "excel" }, { key: "row_7", col: "Status", excel_val: "Closed", sheet_val: "Open", resolved_to: "excel" }, { key: "row_12", col: "Owner", excel_val: "Alice", sheet_val: "Bob", resolved_to: "excel" }] }),
      pick_excel_file: async () => ({ ok: false, cancelled: true }),
      pick_credentials_file: async () => ({ ok: false, cancelled: true }),
      validate_sheet_url: async () => ({ ok: true, title: "Mock Sheet", worksheets: ["Sheet1"], sheet_id: "mock" }),
      open_url: async () => ({ ok: true }),
      reset_all: async () => ({ ok: false }),
      export_activity: async () => ({ ok: false, cancelled: true }),
      window_action: async () => {},
    }
  };
}
// ─────────────────────────────────────────────────────────────────────────────

function getApi() {
  return window.pywebview?.api;
}

function fileName(path) {
  if (!path) return "No workbook selected";
  return path.split(/[\\/]/).filter(Boolean).pop() || path;
}

function mapPair(pair) {
  return {
    id: pair.id,
    name: pair.name || fileName(pair.excel) || "Sync pair",
    workbook: fileName(pair.excel),
    sheetName: pair.worksheet || pair.sheetId || "Google Sheet",
    frequency: pair.every || "on change",
    excelPath: pair.excel || "",
    sheetUrl: pair.sheet || "",
    worksheet: pair.worksheet || "Sheet1",
    lastSync: pair.lastSync || "never",
    state: pair.state || "idle",
    pinned: Boolean(pair.pinned),
    rows: Number(pair.rows || 0),
    cols: Number(pair.cols || 0),
    conflicts: Number(pair.conflicts || 0),
    lastEditedSide: pair.lastEditedSide || "excel",
    syncIntervalMinutes: Number(pair.syncIntervalMinutes || 0),
    sheetsPollEnabled: Boolean(pair.sheetsPollEnabled || false),
    sheetsPollInterval: Number(pair.sheetsPollInterval || 300),
    columnMappings: pair.columnMappings || {},
  };
}

const ACTIVITY_ICON_BY_STATE = {
  red: "triangle-alert",
  yellow: "shield-alert",
  blue: "info",
  ok: "check-circle-2",
};

function mapActivity(entry) {
  const state = entry.state || "ok";
  const icon = ACTIVITY_ICON_BY_STATE[state] || "check-circle-2";
  return [entry.t || "", icon, entry.msg || "", entry.rows || "", state];
}

function parseDisplayName(email) {
  if (!email) return { name: "User", initial: "U" };
  const local = email.split("@")[0];
  const name = local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, " ");
  return { name, initial: local.charAt(0).toUpperCase() };
}

function Icon({ name, size = 16 }) {
  const iconName = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} strokeWidth={1.8} />;
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

function VerticalNav({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme, googleEmail, onNavigate }) {
  const menu = [
    ["dashboard", "Dashboard", "layout-dashboard"],
    ["activity", "Activity", "message-square"],
    ["settings", "Settings", "settings"],
  ];
  const pinnedPairs = pairs.filter((pair) => pair.pinned).slice(0, 4);
  const displayName = React.useMemo(() => parseDisplayName(googleEmail), [googleEmail]);
  return (
    <div className="vertical-nav">
      <div className="brand-block">
        <div className="brand-mark"><img src={appIcon} alt="SheetSync" /></div>
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
        <div className="avatar">{displayName.initial}</div>
        <div className="avatar-meta">
          <strong>{displayName.name}</strong>
          <span>{googleEmail || "Not connected"}</span>
        </div>
        <button className="icon-toggle sidebar-theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle dark mode">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
        </button>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme, googleEmail }) {
  return (
    <aside className="sidebar">
      <VerticalNav tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} googleEmail={googleEmail} />
    </aside>
  );
}

function MobileNav({ tab, setTab, pairs, activePairId, setActivePairId, theme, setTheme, googleEmail }) {
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
            <VerticalNav tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={setActivePairId} theme={theme} setTheme={setTheme} googleEmail={googleEmail} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

function Topbar({ tab, onAddPair, syncStatus, searchQuery, setSearchQuery }) {
  const titles = { dashboard: "Dashboard", activity: "Activity", settings: "Settings" };
  const title = titles[tab] || "Dashboard";
  const dotClassMap = { watching: "live", syncing: "syncing", error: "error" };
  const dotClass = dotClassMap[syncStatus] || "idle";
  const searchRef = React.useRef(null);
  React.useEffect(() => {
    const handler = (event) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
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
        <input ref={searchRef} placeholder="Search pairs, files, runs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <span className="kbd">Ctrl+K</span>
      </div>
      <span className={`state-dot ${dotClass}`} title={syncStatus} style={{ flexShrink: 0 }} />
      <button className="btn compact" onClick={onAddPair}><Icon name="plus" /> New</button>
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

function Dashboard({ setTab, pairs, events, activePairId, setActivePairId, onSyncNow, onTogglePairPause, onChangeWorkbook, searchQuery, onOpenConflicts }) {
  const query = (searchQuery || "").toLowerCase();
  const visiblePairs = query
    ? pairs.filter((pair) => pair.name.toLowerCase().includes(query) || pair.workbook.toLowerCase().includes(query))
    : pairs;
  // Prefer the active pair even when it doesn't match the search, so context isn't lost mid-filter.
  const activePair =
    visiblePairs.find((pair) => pair.id === activePairId) ||
    pairs.find((pair) => pair.id === activePairId) ||
    visiblePairs[0] ||
    pairs[0] ||
    null;
  const livePairs = pairs.filter((pair) => pair.state === "live").length;
  const totalConflicts = pairs.reduce((total, pair) => total + pair.conflicts, 0);
  const conflictsClickable = totalConflicts > 0;
  return (
    <div className="dashboard-page">
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
          </div>
          <div className="stat-value">{activePair && activePair.lastSync !== "never" ? activePair.lastSync : "--"}</div>
          <div className="stat-foot"><span className="tiny-badge"><Icon name="check" size={12} /> Ready</span>{activePair ? "watching configured pair" : "complete setup to start"}</div>
          <div className="stat-ghost"><Icon name="clock-3" size={128} /></div>
        </div>
        <div className="card stat-card">
          <div className="card-top"><h2 className="card-title">Active watchers</h2></div>
          <div className="stat-value">{livePairs}</div>
          <div className="stat-foot">of {pairs.length} sync pairs</div>
          <div className="stat-ghost"><Icon name="inbox" size={128} /></div>
        </div>
        <div
          className={`card stat-card${conflictsClickable ? " clickable" : ""}`}
          onClick={conflictsClickable ? () => onOpenConflicts(activePair?.id) : undefined}
          style={conflictsClickable ? { cursor: "pointer" } : undefined}
        >
          <div className="card-top"><h2 className="card-title">Conflicts {conflictsClickable && <span className="tiny-badge" style={{ marginLeft: 4 }}>View</span>}</h2></div>
          <div className="stat-value">{totalConflicts}</div>
          <div className="stat-foot"><span className="tiny-badge"><Icon name="shield-check" size={12} /> Excel wins</span> current policy</div>
          <div className="stat-ghost"><Icon name="git-merge" size={128} /></div>
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
          {pairs.length === 0 && <div className="empty-state">No sync pairs yet. Finish onboarding to connect an Excel workbook and Google Sheet.</div>}
          {pairs.length > 0 && visiblePairs.length === 0 && <div className="empty-state compact">No pairs match your search.</div>}
          {visiblePairs.map((pair) => (
            <PairMiniCard key={pair.id} pair={pair} active={activePair && pair.id === activePair.id} onSelect={() => setActivePairId(pair.id)} />
          ))}
        </div>

        {activePair && <div className="sync-detail-panel">
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
            <button className="btn primary" onClick={() => onSyncNow(activePair.id)}><Icon name="refresh-cw" /> Sync now</button>
            <button className="btn" onClick={() => onTogglePairPause(activePair.id)}><Icon name={activePair.state === "idle" ? "play" : "pause"} /> {activePair.state === "idle" ? "Resume watching" : "Pause watching"}</button>
            <button className="btn" onClick={() => onChangeWorkbook(activePair.id)}><Icon name="folder-open" /> Change workbook</button>
          </div>
        </div>}
      </section>

      <section className="lower-grid single-row">
        <div className="card activity-card">
          <div className="card-top"><h2 className="card-title">Recent activity</h2><button className="btn" style={{ height: 32, padding: "0 10px" }} onClick={() => setTab("activity")}>View all</button></div>
          <div className="project-list">
            {events.length === 0 && <div className="empty-state compact">No activity yet.</div>}
            {events.slice(0, 3).map(([time, icon, text, rows, state]) => (
              <div className="project-row" key={time + text}>
                <div className={`project-logo activity-icon ${state || "ok"}`}><Icon name={icon} size={15} /></div>
                <div><strong>{text}</strong><span>{time} {rows ? "- " + rows + " rows" : ""}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Onboarding({ mode = "setup", onComplete }) {
  const [step, setStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    excel_path: "",
    sheet_url: "",
    worksheet_name: "Sheet1",
    sync_direction: "Bidirectional",
    conflict_resolution: "Excel wins",
  });
  const [message, setMessage] = React.useState("");
  const isCreateMode = mode === "create";
  const update = (patch) => setFormData((current) => ({ ...current, ...patch }));
  const callApi = async (name, ...args) => {
    const bridge = getApi();
    if (!bridge?.[name]) {
      setMessage("Desktop bridge is not ready yet.");
      return null;
    }
    const result = await bridge[name](...args);
    if (result && result.ok === false && !result.cancelled) setMessage(result.error || "Action failed.");
    else setMessage("");
    return result;
  };
  const finish = async () => {
    const result = await callApi(isCreateMode ? "create_pair" : "complete_onboarding", formData);
    if (result?.ok) onComplete(result);
  };
  const continueNext = async () => {
    if (step !== 2) {
      setStep(step + 1);
      return;
    }
    if (!formData.excel_path) {
      setMessage("Choose an Excel workbook first.");
      return;
    }
    if (!formData.sheet_url) {
      setMessage("Paste a Google Sheet URL first.");
      return;
    }
    const result = await callApi("validate_sheet_url", formData.sheet_url);
    if (!result?.ok) return;
    const firstWorksheet = result.worksheets?.[0];
    if (firstWorksheet && !formData.worksheet_name) update({ worksheet_name: firstWorksheet });
    setStep(step + 1);
  };
  return (
    <div className="overlay">
      <section className="glass-onboarding">
        {isCreateMode && <button className="overlay-close" onClick={() => onComplete(null)} aria-label="Close add pair"><Icon name="x" /></button>}
        <div className="overlay-head">
          <div>
            <span className="tiny-badge"><GoogleG /> {isCreateMode ? "New pair" : "First launch"}</span>
            <h2>{isCreateMode ? "Add Sync Pair" : "Set up SheetSync"}</h2>
            <p>{onboardingSteps[step].label}</p>
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
          {step === 0 && <OAuthStep callApi={callApi} />}
          {step === 1 && <GoogleStep callApi={callApi} />}
          {step === 2 && <FilesStep data={formData} update={update} callApi={callApi} />}
          {step === 3 && <RulesStep data={formData} update={update} />}
          {message && <p className="form-error">{message}</p>}
        </div>

        <div className="overlay-actions">
          <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="arrow-left" /> Back</button>
          <button className="btn primary" onClick={() => step === onboardingSteps.length - 1 ? finish() : continueNext()}>
            {step === onboardingSteps.length - 1 ? (isCreateMode ? "Add pair" : "Finish setup") : "Continue"} <Icon name="arrow-right" />
          </button>
        </div>
      </section>
    </div>
  );
}

function OAuthStep({ callApi }) {
  const open = (url) => callApi("open_url", url);
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
        <button type="button" onClick={() => open(googleLinks.cloud)}><GoogleG /> Cloud Console</button>
        <button type="button" onClick={() => open(googleLinks.sheetsApi)}>Sheets API</button>
        <button type="button" onClick={() => open(googleLinks.driveApi)}>Drive API</button>
        <button type="button" onClick={() => open(googleLinks.credentials)}>Credentials</button>
      </div>
      <div className="field">
        <label>OAuth Desktop client JSON</label>
        <button className="file-drop" type="button" onClick={() => callApi("pick_credentials_file")}><Icon name="upload" /> Choose credentials.json</button>
      </div>
    </div>
  );
}

function GoogleStep({ callApi }) {
  return (
    <div className="simple-step">
      <GoogleG />
      <h3>Connect Google</h3>
      <p>After the JSON is added, SheetSync opens the Google OAuth screen in your browser and stores the token locally on this PC.</p>
      <button className="btn google" onClick={() => callApi("connect_google")}><GoogleG /> Sign in with Google</button>
      <p className="fine-print">This app requests access to all your Google Sheets in order to sync the sheet you select. You can revoke access later from <button className="text-link" type="button" onClick={() => callApi("open_url", googleLinks.revoke)}>Google Account permissions</button>.</p>
    </div>
  );
}

function FilesStep({ data, update, callApi }) {
  const pickWorkbook = async () => {
    const result = await callApi("pick_excel_file");
    if (result?.ok) update({ excel_path: result.path, name: fileName(result.path) });
  };
  return (
    <div className="simple-step">
      <Icon name="folder-open" size={30} />
      <h3>Choose your files</h3>
      <p>Select one local Excel workbook and paste the Google Sheet URL it should sync with.</p>
      <div className="field"><label>Excel workbook</label><button className="file-drop" type="button" onClick={pickWorkbook}><Icon name="file-spreadsheet" /> {data.excel_path ? fileName(data.excel_path) : "Choose workbook"}</button></div>
      <div className="field"><label>Google Sheet URL</label><input className="input" value={data.sheet_url} onChange={(event) => update({ sheet_url: event.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." /></div>
      <div className="field"><label>Worksheet</label><input className="input" value={data.worksheet_name} onChange={(event) => update({ worksheet_name: event.target.value })} placeholder="Sheet1" /></div>
    </div>
  );
}

function RulesStep({ data, update }) {
  return (
    <div className="simple-step">
      <Icon name="sliders-horizontal" size={30} />
      <h3>Confirm sync rules</h3>
      <p>Keep the first setup conservative. You can change these later in Settings.</p>
      <div className="field"><label>Direction</label><select className="select" value={data.sync_direction} onChange={(event) => update({ sync_direction: event.target.value })}><option>Bidirectional</option><option>Excel -&gt; Sheets</option><option>Sheets -&gt; Excel</option></select></div>
      <div className="field"><label>Conflict policy</label><select className="select" value={data.conflict_resolution} onChange={(event) => update({ conflict_resolution: event.target.value })}><option>Excel wins</option><option>Sheets wins</option></select></div>
    </div>
  );
}

function Activity({ events, searchQuery }) {
  const query = (searchQuery || "").toLowerCase();
  const visibleEvents = query ? events.filter(([, , text]) => text.toLowerCase().includes(query)) : events;
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Activity</h1><div className="page-sub">Sync, auth, and watcher events.</div></div>
      </div>
      <div className="card">
        <div className="project-list">
          {events.length === 0 && <div className="empty-state compact">No activity yet.</div>}
          {events.length > 0 && visibleEvents.length === 0 && <div className="empty-state compact">No matching activity.</div>}
          {visibleEvents.map(([time, icon, text, rows, state]) => (
            <div className="project-row" key={time + text}>
              <div className={`project-logo activity-icon ${state || "ok"}`}><Icon name={icon} size={15} /></div>
              <div><strong>{text}</strong><span>{time} {rows ? "- " + rows + " rows" : ""}</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Settings({
  pairs,
  activePairId,
  setActivePairId,
  googleEmail,
  config,
  onAddPair,
  onSavePair,
  onTogglePairPause,
  onTogglePairPin,
  onDeletePair,
  onPickCredentials,
  onDisconnect,
  onSaveAppSettings,
}) {
  const activePair = pairs.find((pair) => pair.id === activePairId) || pairs[0] || null;
  const [pairDraft, setPairDraft] = React.useState({});
  const [appDraft, setAppDraft] = React.useState({});
  React.useEffect(() => {
    if (!activePair) return;
    setPairDraft({
      name: activePair.name || "",
      worksheet_name: activePair.worksheet || "",
      excel_path: activePair.excelPath || "",
      sheet_url: activePair.sheetUrl || "",
      sync_direction: config?.sync_direction || "Bidirectional",
      conflict_resolution: config?.conflict_resolution || "Excel wins",
      sync_interval_minutes: activePair.syncIntervalMinutes ?? 0,
      sheets_poll_enabled: activePair.sheetsPollEnabled ?? false,
      sheets_poll_interval: activePair.sheetsPollInterval ?? 300,
      column_mappings: activePair.columnMappings ?? {},
    });
  }, [activePair, config]);
  React.useEffect(() => {
    setAppDraft({
      notifications: config?.notifications ?? true,
      minimize_to_tray: config?.minimize_to_tray ?? true,
      debounce_delay: String(config?.debounce_delay ?? 1.5),
    });
  }, [config]);
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Settings</h1><div className="page-sub">Manage sync pairs, Google access, and desktop behavior.</div></div>
        <div className="head-actions">
          <button className="btn primary" onClick={onAddPair}><Icon name="plus" /> Add pair</button>
        </div>
      </div>

      <section className="settings-layout">
        <div className="card settings-pairs">
          <div className="section-head"><h2>Sync pairs</h2><span className="count-pill">{pairs.length}</span></div>
          <div className="settings-pair-list">
            {pairs.length === 0 && <div className="empty-state compact">No sync pairs configured.</div>}
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
          {!activePair && <div className="card"><div className="empty-state compact">Finish onboarding to configure your first sync pair.</div></div>}
          {activePair && <>
          <div className="card">
            <div className="card-top">
              <div><h2 className="card-title">{activePair.name}</h2><p className="card-sub">Pair-specific file, Sheet, and sync behavior.</p></div>
              <span className={`state-pill ${activePair.state}`}><span />{activePair.state === "idle" ? "Paused" : "Live"}</span>
            </div>
            <div className="settings-form-grid">
              <div className="field"><label>Pair name</label><input className="input" value={pairDraft.name || ""} onChange={(event) => setPairDraft({ ...pairDraft, name: event.target.value })} /></div>
              <div className="field"><label>Worksheet</label><input className="input" value={pairDraft.worksheet_name || ""} onChange={(event) => setPairDraft({ ...pairDraft, worksheet_name: event.target.value })} /></div>
              <div className="field wide-field"><label>Excel workbook</label><input className="input" value={pairDraft.excel_path || ""} onChange={(event) => setPairDraft({ ...pairDraft, excel_path: event.target.value })} /></div>
              <div className="field wide-field"><label>Google Sheet URL</label><input className="input" value={pairDraft.sheet_url || ""} onChange={(event) => setPairDraft({ ...pairDraft, sheet_url: event.target.value })} /></div>
              <div className="field"><label>Sync direction</label><select className="select" value={pairDraft.sync_direction || "Bidirectional"} onChange={(event) => setPairDraft({ ...pairDraft, sync_direction: event.target.value })}><option>Bidirectional</option><option>Excel -&gt; Sheets</option><option>Sheets -&gt; Excel</option></select></div>
              <div className="field"><label>Conflict policy</label><select className="select" value={pairDraft.conflict_resolution || "Excel wins"} onChange={(event) => setPairDraft({ ...pairDraft, conflict_resolution: event.target.value })}><option>Excel wins</option><option>Sheets wins</option></select></div>
              <div className="field"><label>Interval sync</label><select className="select" value={String(pairDraft.sync_interval_minutes ?? 0)} onChange={(e) => setPairDraft({ ...pairDraft, sync_interval_minutes: Number(e.target.value) })}><option value="0">Off</option><option value="5">Every 5 min</option><option value="15">Every 15 min</option><option value="30">Every 30 min</option><option value="60">Every 60 min</option></select></div>
              <div className="field"><label>Poll Sheets for changes</label><select className="select" value={pairDraft.sheets_poll_enabled ? String(pairDraft.sheets_poll_interval ?? 300) : "off"} onChange={(e) => { const v = e.target.value; setPairDraft({ ...pairDraft, sheets_poll_enabled: v !== "off", sheets_poll_interval: v !== "off" ? Number(v) : 300 }); }}><option value="off">Off</option><option value="60">Every 1 min</option><option value="300">Every 5 min</option><option value="900">Every 15 min</option><option value="1800">Every 30 min</option></select></div>
            </div>
            <ColumnMappingsEditor mappings={pairDraft.column_mappings || {}} onChange={(m) => setPairDraft({ ...pairDraft, column_mappings: m })} />
            <div className="control-row">
              <button className="btn primary" onClick={() => onSavePair(activePair.id, pairDraft)}><Icon name="save" /> Save pair</button>
              <button className="btn" onClick={() => onTogglePairPause(activePair.id)}><Icon name={activePair.state === "idle" ? "play" : "pause"} /> {activePair.state === "idle" ? "Resume pair" : "Pause pair"}</button>
              <button className="btn" onClick={() => onTogglePairPin(activePair.id)}><Icon name="pin" /> {activePair.pinned ? "Unpin" : "Pin"}</button>
              <button className="btn danger" onClick={() => onDeletePair(activePair.id)}><Icon name="trash-2" /> Remove</button>
            </div>
          </div>
          </>}

          <div className="settings-two-col">
            <div className="card">
              <h2 className="card-title">Google access</h2>
              <p className="card-sub">SheetSync uses your own Google Cloud Desktop OAuth client.</p>
              <div className="settings-status-row"><GoogleG /><div><strong>{googleEmail || "Not connected"}</strong><span>{googleEmail ? "Connected locally on this PC" : "Complete Google sign-in during onboarding"}</span></div></div>
              <div className="control-row">
                <button className="btn google" onClick={onPickCredentials}><GoogleG /> Replace JSON</button>
                <button className="btn" onClick={onDisconnect}><Icon name="log-out" /> Disconnect</button>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">App behavior</h2>
              <button className="settings-toggle-row" onClick={() => setAppDraft({ ...appDraft, notifications: !appDraft.notifications })}><div><strong>Notifications</strong><span>Show desktop sync results</span></div><span className={`switch ${appDraft.notifications ? "on" : ""}`} /></button>
              <button className="settings-toggle-row" onClick={() => setAppDraft({ ...appDraft, minimize_to_tray: !appDraft.minimize_to_tray })}><div><strong>Minimize to tray</strong><span>Keep watchers running when closed</span></div><span className={`switch ${appDraft.minimize_to_tray ? "on" : ""}`} /></button>
              <div className="field"><label>Watcher debounce</label><select className="select" value={appDraft.debounce_delay || "1.5"} onChange={(event) => setAppDraft({ ...appDraft, debounce_delay: event.target.value })}><option value="1.5">1.5 seconds</option><option value="3">3 seconds</option><option value="5">5 seconds</option></select></div>
              <button className="btn primary" onClick={() => onSaveAppSettings(appDraft)}><Icon name="save" /> Save behavior</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ColumnMappingsEditor({ mappings, onChange }) {
  const entries = Object.entries(mappings);
  const addRow = () => onChange({ ...mappings, "": "" });
  const removeRow = (excelCol) => {
    const next = { ...mappings };
    delete next[excelCol];
    onChange(next);
  };
  // Rebuild via entries so the row's position in the list stays put when the Excel key changes.
  const updateExcelCol = (oldKey, newKey) => {
    const next = {};
    for (const [excelCol, sheetsCol] of Object.entries(mappings)) {
      next[excelCol === oldKey ? newKey : excelCol] = sheetsCol;
    }
    onChange(next);
  };
  const updateSheetsCol = (excelCol, sheetsCol) => onChange({ ...mappings, [excelCol]: sheetsCol });
  return (
    <div className="field wide-field" style={{ marginTop: 12 }}>
      <label>Column mappings <span style={{ fontWeight: 400, opacity: 0.6 }}>(Excel col → Sheets col)</span></label>
      {entries.map(([excelCol, sheetsCol], index) => (
        <div key={excelCol || `new-${index}`} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input className="input" placeholder="Excel column" value={excelCol} onChange={(event) => updateExcelCol(excelCol, event.target.value)} style={{ flex: 1 }} />
          <span style={{ alignSelf: "center", opacity: 0.5 }}>→</span>
          <input className="input" placeholder="Sheets column" value={sheetsCol} onChange={(event) => updateSheetsCol(excelCol, event.target.value)} style={{ flex: 1 }} />
          <button className="btn" style={{ padding: "0 8px" }} onClick={() => removeRow(excelCol)}><Icon name="x" size={13} /></button>
        </div>
      ))}
      <button className="btn" style={{ marginTop: 4 }} onClick={addRow}><Icon name="plus" size={13} /> Add mapping</button>
    </div>
  );
}

function ConflictModal({ pairId, onClose }) {
  const [conflicts, setConflicts] = React.useState(null);
  React.useEffect(() => {
    if (!pairId) return;
    let cancelled = false;
    getApi()?.get_conflict_log?.(pairId).then((result) => {
      if (!cancelled) setConflicts(result?.conflicts || []);
    });
    return () => { cancelled = true; };
  }, [pairId]);
  const cellStyle = { padding: "4px 8px" };
  return (
    <div className="overlay" onClick={onClose}>
      <section className="glass-onboarding" style={{ maxWidth: 720, maxHeight: "80vh", overflow: "auto" }} onClick={(event) => event.stopPropagation()}>
        <button className="overlay-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        <div className="overlay-head">
          <div>
            <span className="tiny-badge"><Icon name="git-merge" size={12} /> Conflicts</span>
            <h2>Conflict log</h2>
            <p>Cells where Excel and Sheets disagreed this session.</p>
          </div>
        </div>
        <div className="overlay-body">
          {conflicts === null && <div className="empty-state compact loading-row"><span className="spin"><Icon name="loader-circle" size={14} /></span>Loading conflicts…</div>}
          {conflicts !== null && conflicts.length === 0 && <div className="empty-state compact">No conflicts recorded this session.</div>}
          {conflicts !== null && conflicts.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.6 }}>
                  <th style={cellStyle}>Row key</th>
                  <th style={cellStyle}>Column</th>
                  <th style={cellStyle}>Excel value</th>
                  <th style={cellStyle}>Sheets value</th>
                  <th style={cellStyle}>Resolved to</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((conflict, index) => (
                  <tr key={index} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ ...cellStyle, opacity: 0.7 }}>{conflict.key}</td>
                    <td style={cellStyle}>{conflict.col}</td>
                    <td style={cellStyle}>{conflict.excel_val || <em style={{ opacity: 0.4 }}>empty</em>}</td>
                    <td style={cellStyle}>{conflict.sheet_val || <em style={{ opacity: 0.4 }}>empty</em>}</td>
                    <td style={cellStyle}><span className="tiny-badge">{conflict.resolved_to}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      <Icon name={toast.type === "error" ? "triangle-alert" : "check-circle-2"} size={14} />
      {toast.msg}
    </div>
  );
}

function App() {
  const [tab, setTab] = React.useState("dashboard");
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [onboardingMode, setOnboardingMode] = React.useState("setup");
  const [theme, setTheme] = React.useState("dark");
  const [pairs, setPairs] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [googleEmail, setGoogleEmail] = React.useState("");
  const [config, setConfig] = React.useState({});
  const [activePairId, setActivePairId] = React.useState("");
  const [syncStatus, setSyncStatus] = React.useState("idle");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [conflictPairId, setConflictPairId] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const showToast = React.useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const applyInitialData = React.useCallback((payload) => {
    const nextPairs = (payload?.pairs || []).map(mapPair);
    const nextEvents = (payload?.activity || []).map(mapActivity);
    setPairs(nextPairs);
    setEvents(nextEvents);
    setConfig(payload?.config || {});
    setGoogleEmail(payload?.config?.google_email || "");
    setActivePairId(payload?.active_pair_id || nextPairs[0]?.id || "");
    setShowOnboarding(!(payload?.setup_complete && payload?.ready !== false));
  }, []);

  const refresh = React.useCallback(async () => {
    const payload = await getApi()?.get_initial_data?.();
    if (payload) applyInitialData(payload);
    return payload;
  }, [applyInitialData]);

  const applyPairsResult = React.useCallback((result) => {
    if (!result?.ok) return;
    if (result.pairs) setPairs(result.pairs.map(mapPair));
    if (result.config) {
      setConfig(result.config);
      setGoogleEmail(result.config.google_email || "");
    }
    if (result.active_pair_id !== undefined) setActivePairId(result.active_pair_id || "");
    else if (result.pair?.id) setActivePairId(result.pair.id);
  }, []);

  const selectPair = React.useCallback(async (pairId) => {
    const result = await getApi()?.set_active_pair?.(pairId);
    if (result?.ok) applyPairsResult(result);
    else setActivePairId(pairId);
  }, [applyPairsResult]);

  const syncNow = React.useCallback(async (pairId) => {
    await getApi()?.sync_now?.(pairId);
  }, []);

  const togglePairPause = React.useCallback(async (pairId) => {
    const result = await getApi()?.toggle_pair_pause?.(pairId);
    if (result?.ok) applyPairsResult(result);
  }, [applyPairsResult]);

  const changeWorkbook = React.useCallback(async (pairId) => {
    const picked = await getApi()?.pick_excel_file?.();
    if (!picked?.ok) return;
    const result = await getApi()?.save_settings?.({ excel_path: picked.path, name: fileName(picked.path) }, pairId);
    if (result?.ok) applyPairsResult(result);
  }, [applyPairsResult]);

  const savePair = React.useCallback(async (pairId, updates) => {
    const result = await getApi()?.save_settings?.(updates, pairId);
    if (result?.ok) { applyPairsResult(result); showToast("Pair saved"); }
  }, [applyPairsResult, showToast]);

  const togglePairPin = React.useCallback(async (pairId) => {
    const result = await getApi()?.toggle_pair_pin?.(pairId);
    if (result?.ok) applyPairsResult(result);
  }, [applyPairsResult]);

  const deletePair = React.useCallback(async (pairId) => {
    const result = await getApi()?.delete_pair?.(pairId);
    if (result?.ok) {
      applyPairsResult(result);
      if (!result.pairs?.length) {
        setOnboardingMode("setup");
        setShowOnboarding(true);
      }
    }
  }, [applyPairsResult]);

  const pickCredentials = React.useCallback(async () => {
    const result = await getApi()?.pick_credentials_file?.();
    if (result?.ok) await refresh();
  }, [refresh]);

  const disconnectAndReset = React.useCallback(async () => {
    const result = await getApi()?.reset_all?.();
    if (result?.ok) {
      applyInitialData(result);
      setOnboardingMode("setup");
      setShowOnboarding(true);
      setTab("dashboard");
    }
  }, [applyInitialData]);

  const saveAppSettings = React.useCallback(async (updates) => {
    const result = await getApi()?.save_settings?.({
      notifications: Boolean(updates.notifications),
      minimize_to_tray: Boolean(updates.minimize_to_tray),
      debounce_delay: Number(updates.debounce_delay || 1.5),
    }, activePairId || null);
    if (result?.ok) { applyPairsResult(result); showToast("Settings saved"); }
  }, [activePairId, applyPairsResult, showToast]);

  const openAddPair = React.useCallback(() => {
    setOnboardingMode(pairs.length ? "create" : "setup");
    setShowOnboarding(true);
  }, [pairs.length]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const bridge = getApi();
      if (!bridge?.get_initial_data) {
        window.setTimeout(load, 100);
        return;
      }
      const payload = await bridge.get_initial_data();
      if (!cancelled) applyInitialData(payload);
    };
    load();
    window.__ss_event = (event) => {
      if (event.type === "pairs") setPairs((event.pairs || []).map(mapPair));
      if (event.type === "activity") setEvents((event.entries || []).map(mapActivity));
      if (event.type === "status") setSyncStatus(event.status || "idle");
    };
    return () => {
      cancelled = true;
      window.__ss_event = null;
    };
  }, [applyInitialData]);

  React.useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);
  return (
    <>
      <div className="frame">
        <MobileNav tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={selectPair} theme={theme} setTheme={setTheme} googleEmail={googleEmail} />
        <Sidebar tab={tab} setTab={setTab} pairs={pairs} activePairId={activePairId} setActivePairId={selectPair} theme={theme} setTheme={setTheme} googleEmail={googleEmail} />
        <main className="workspace">
          <Topbar tab={tab} onAddPair={openAddPair} syncStatus={syncStatus} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <section className="content">
            {tab === "dashboard" && <Dashboard setTab={setTab} pairs={pairs} events={events} activePairId={activePairId} setActivePairId={selectPair} onSyncNow={syncNow} onTogglePairPause={togglePairPause} onChangeWorkbook={changeWorkbook} searchQuery={searchQuery} onOpenConflicts={setConflictPairId} />}
            {tab === "activity" && <Activity events={events} searchQuery={searchQuery} />}
            {tab === "settings" && <Settings pairs={pairs} activePairId={activePairId} setActivePairId={selectPair} googleEmail={googleEmail} config={config} onAddPair={openAddPair} onSavePair={savePair} onTogglePairPause={togglePairPause} onTogglePairPin={togglePairPin} onDeletePair={deletePair} onPickCredentials={pickCredentials} onDisconnect={disconnectAndReset} onSaveAppSettings={saveAppSettings} />}
          </section>
        </main>
      </div>
      {conflictPairId !== null && <ConflictModal pairId={conflictPairId} onClose={() => setConflictPairId(null)} />}
      <Toast toast={toast} />
      {showOnboarding && <Onboarding mode={onboardingMode} onComplete={async (result) => {
        if (!result?.ok) {
          if (onboardingMode === "create") setShowOnboarding(false);
          return;
        }
        await refresh();
        setShowOnboarding(false);
      }} />}
    </>
  );
}

export default App;
