// app.jsx — SheetSync main view
// Connects to the Python backend via window.pywebview.api when running
// inside the desktop app. Falls back to mock data in plain-browser mode.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tab": "dashboard",
  "accent": "green",
  "showOnboarding": false
}/*EDITMODE-END*/;

// ── Mock data (browser / design mode fallback) ───────────────────────────────

const MOCK_PAIRS = [
  {
    id:"rev", name:"Q4 Revenue Pipeline",
    excel:"~/Documents/Finance/Q4 Pipeline.xlsx",
    sheet:"Q4 Revenue Pipeline · Finance team", sheetId:"1A2b…X9k",
    rows:4218, cols:38, sheets:3, direction:"both",
    lastSync:"32s ago", every:"on change", state:"live",
    owner:"Eli Marsh", lastEditor:"Maya Reyes", lastEditedSide:"sheet",
  },
  {
    id:"headcount", name:"Headcount roster",
    excel:"~/Documents/People/Headcount 2026.xlsx",
    sheet:"Headcount · People ops", sheetId:"7Hj…Q1m",
    rows:412, cols:22, sheets:2, direction:"both",
    lastSync:"2m ago", every:"5 min", state:"live",
    owner:"Eli Marsh", lastEditor:"Jules T.", lastEditedSide:"excel",
  },
  {
    id:"vendors", name:"Vendor contracts",
    excel:"~/Documents/Legal/Vendor matrix.xlsx",
    sheet:"Vendor contracts · Legal", sheetId:"9Mk…Z0p",
    rows:184, cols:14, sheets:1, direction:"sheetToExcel",
    lastSync:"12s ago", every:"1 min", state:"live",
    owner:"Legal team", lastEditor:"Priya N.", lastEditedSide:"sheet",
  },
  {
    id:"campaigns", name:"Campaign performance",
    excel:"~/Marketing/Campaigns FY26.xlsx",
    sheet:"Campaign performance", sheetId:"4Bn…W3r",
    rows:9220, cols:41, sheets:4, direction:"excelToSheet",
    lastSync:"8m ago", every:"hourly", state:"idle",
    owner:"Marketing", lastEditor:"Andre L.", lastEditedSide:"excel",
  },
];

const MOCK_ACTIVITY = [
  { t:"10:42:18", msg:"Pulled 418 row updates from Sheets → Q4 Pipeline.xlsx", state:"ok",     rows:"+418", side:"sheet" },
  { t:"10:41:52", msg:"Maya Reyes edited G14:H82 in Q4 Revenue Pipeline",       state:"blue",   rows:null,   side:"sheet" },
  { t:"10:40:03", msg:"Pushed Headcount 2026.xlsx → Sheets — schema OK",        state:"ok",     rows:"412",  side:"excel" },
  { t:"10:38:11", msg:"Pulled 14 new rows from Vendor contracts",                state:"ok",     rows:"+14",  side:"sheet" },
  { t:"10:35:47", msg:"Reconnected to Google after 4s network blip",            state:"yellow", rows:null,   side:null   },
  { t:"10:32:09", msg:"Pushed 32 deleted rows to Q4 Revenue Pipeline",          state:"ok",     rows:"−32",  side:"excel" },
  { t:"10:28:54", msg:"Campaign performance — watcher paused (manual)",         state:"idle",   rows:null,   side:null   },
  { t:"10:24:01", msg:"Resolved conflict in Headcount · I47 — kept Sheets",     state:"yellow", rows:null,   side:null   },
  { t:"10:18:33", msg:"Added column utm_campaign in Campaign performance",       state:"blue",   rows:null,   side:"excel" },
  { t:"10:12:00", msg:"Google OAuth refreshed",                                  state:"idle",   rows:null,   side:null   },
];

// ── API bridge ────────────────────────────────────────────────────────────────

let _api = null;

function waitForApi() {
  return new Promise((resolve) => {
    if (window.pywebview && window.pywebview.api) { resolve(); return; }
    window.addEventListener("pywebviewready", resolve, { once: true });
    setTimeout(resolve, 2500); // fallback: run in browser mode after 2.5s
  });
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function DirArrow({ direction, syncing, color }) {
  const c = color || "currentColor";
  if (syncing) return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" className="dir-arrow syncing">
      <path d="M3 5h17l-3-3" fill="none" stroke="#4B8EFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 9H8l3 3" fill="none" stroke="#4B8EFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (direction === "both") return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" className="dir-arrow">
      <path d="M3 5h17l-3-3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25 9H8l3 3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (direction === "excelToSheet") return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" className="dir-arrow">
      <path d="M3 7h21l-3-3M24 7l-3 3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" className="dir-arrow">
      <path d="M25 7H4l3-3M4 7l3 3" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatePill({ kind, label }) {
  return (
    <div className={`conn-state ${kind || ""}`}>
      <span className="d"></span>
      {label}
    </div>
  );
}

function resolveCardState({ pair, status }) {
  if (status === "syncing") return { state:"syncing", label:"Syncing", cls:"blue" };
  if (status === "error" && pair.state === "live") return { state:"error", label:"Error", cls:"red" };
  if (pair.state === "idle") return { state:"idle", label:"Paused", cls:"idle" };
  return { state:"live", label:"Live", cls:"" };
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ tab, onTab, status, pairs, config }) {
  const items = [
    { id:"dashboard", label:"Dashboard",  icon:<IcGrid />,     dot: status === "watching" || status === "syncing" },
    { id:"sheets",    label:"Sync pairs", icon:<IcLayers />,   count: pairs.length },
    { id:"activity",  label:"Activity",   icon:<IcActivity /> },
    { id:"library",   label:"Library",    icon:<IcFolder /> },
    { id:"settings",  label:"Settings",   icon:<IcSettings /> },
  ];
  const email    = config?.google_email || "";
  const initials = email ? email[0].toUpperCase() : "S";
  const name     = email ? email.split("@")[0] : "Not signed in";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div className="brand-name">SheetSync</div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Workspace</div>
        {items.map((it) => (
          <div key={it.id} className={`nav-item ${tab === it.id ? "active" : ""}`} onClick={() => onTab(it.id)}>
            <span className="ic">{it.icon}</span>
            <span>{it.label}</span>
            {it.dot   && <span className="dot" />}
            {it.count != null && <span className="count">{it.count}</span>}
          </div>
        ))}
      </div>

      {pairs.length > 0 && (
        <div className="nav-section">
          <div className="nav-label">Pinned pairs</div>
          {pairs.slice(0, 3).map((p) => (
            <div key={p.id} className="nav-item">
              <span className="ic"><XlsxTile size={14}/></span>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-foot">
        <div className="avatar">{initials}</div>
        <div className="avatar-meta">
          <div className="avatar-name">{name}</div>
          <div className="avatar-email">{email || "Not connected"}</div>
        </div>
        <div className="icon-btn" title="Settings" onClick={() => onTab("settings")}><IcSettings size={13} /></div>
      </div>
    </aside>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function Hero({ status, accent, pairs, onSync, onPause }) {
  const isSyncing = status === "syncing";
  const isError   = status === "error";
  const isIdle    = status === "idle";
  const count     = pairs.length;

  const badge = isError   ? { dot:"red",  text:"Error" }
              : isSyncing ? { dot:"blue", text:"Syncing…" }
              : isIdle    ? { dot:"red",  text:"Paused" }
              : { dot: accent === "blue" ? "blue" : "", text:"Watching" };

  const headline = isError
    ? <>Sync error. <span className="accent" style={{ color:"var(--error)" }}>Check activity log</span> for details.</>
    : isSyncing
    ? <><span className={`accent ${accent === "blue" ? "blue" : ""}`}>Syncing</span> {count} pair{count !== 1 ? "s" : ""}…</>
    : isIdle
    ? <>{count} pair{count !== 1 ? "s" : ""} <span className="accent" style={{ color:"var(--warning)" }}>paused.</span> Resume to continue watching.</>
    : <>{count} pair{count !== 1 ? "s" : ""} in sync. <span className={`accent ${accent === "blue" ? "blue" : ""}`}>Watching</span> Excel files and Google Sheets.</>;

  const sub = isError   ? "A sync failed. Check the activity log for details, then retry or reauthenticate."
            : isSyncing ? "Holding writes on both sides until the run completes."
            : isIdle    ? "Watcher is paused. No changes will be detected until you resume."
            : "SheetSync watches your local .xlsx files and matched Google Sheets. Changes propagate in under 4 seconds.";

  const totalRows = pairs.reduce((s, p) => s + (p.rows || 0), 0);

  return (
    <div className="glass hero">
      <div className={`glow ${isError ? "red" : isSyncing || accent === "blue" ? "blue" : "green"}`} />
      <div className="hero-inner">
        <div className="status-badge">
          <span className={`status-dot ${badge.dot}`}></span>
          {badge.text}
        </div>
        <h1>{headline}</h1>
        <p>{sub}</p>
        <div className="hero-actions">
          {isError ? (
            <button className="btn primary" onClick={onSync}><IcRefresh size={14}/> Retry sync</button>
          ) : isSyncing ? (
            <button className="btn"><IcPause size={14}/> Pause</button>
          ) : isIdle ? (
            <button className="btn primary" onClick={onPause}><IcPlay size={14}/> Resume watching</button>
          ) : (
            <>
              <button className="btn primary" onClick={onSync}>
                <IcRefresh size={14}/> Sync now <span className="kbd">⌘S</span>
              </button>
              <button className="btn" onClick={onPause}><IcPause size={14}/> Pause watching</button>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className={`num ${isError ? "" : "green"}`}>{count} / {count}</div>
            <div className="lbl">Pairs healthy</div>
          </div>
          <div className="stat">
            <div className="num">{totalRows.toLocaleString()}</div>
            <div className="lbl">Rows mirrored</div>
          </div>
          <div className="stat">
            <div className={`num ${isSyncing || accent === "blue" ? "blue" : "green"}`}>3.4s</div>
            <div className="lbl">Median sync time</div>
          </div>
          <div className="stat">
            <div className="num">0</div>
            <div className="lbl">Conflicts today</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pair card ─────────────────────────────────────────────────────────────────
function PairCard({ pair, status, accent }) {
  const rs = resolveCardState({ pair, status });
  return (
    <div className="glass glass-hover conn">
      <div className="conn-top">
        <div className="conn-icons pair-icons">
          <XlsxTile size={22} />
          <DirArrow direction={pair.direction} syncing={rs.state === "syncing"}
                    color={rs.cls === "red" ? "#FF6464" : rs.cls === "blue" || accent === "blue" ? "#9DC0FF" : "rgba(255,255,255,0.5)"} />
          <SheetsTile size={22} />
        </div>
        <div className="conn-title">
          <div className="name">{pair.name}</div>
          <div className="path">
            <span className="path-side">{pair.excel?.split(/[\\/]/).pop()}</span>
            <span className="path-sep">·</span>
            <span className="path-side path-cloud">{pair.sheet?.split(" · ")[0]}</span>
          </div>
        </div>
        <StatePill kind={rs.cls} label={rs.label} />
      </div>
      {rs.state === "syncing" && <div className="progress"><i></i></div>}
      <div className="conn-meta">
        <div className="meta-cell">
          <div className="v">{pair.rows?.toLocaleString() || "—"}</div>
          <div className="l">Rows</div>
        </div>
        <div className="meta-cell">
          <div className="v dim">{pair.every || "on change"}</div>
          <div className="l">Frequency</div>
        </div>
        <div className="meta-cell">
          <div className="v dim">{rs.state === "syncing" ? "now" : pair.lastSync}</div>
          <div className="l">Last sync</div>
        </div>
      </div>
    </div>
  );
}

// ── Activity list ─────────────────────────────────────────────────────────────
function ActivityList({ rows }) {
  if (!rows.length) return (
    <div className="glass activity">
      <div className="act-row" style={{ justifyContent:"center" }}>
        <span style={{ color:"var(--text-3)", fontSize:13 }}>No activity yet — make an edit to see syncs appear here.</span>
      </div>
    </div>
  );
  return (
    <div className="glass activity">
      {rows.map((r, i) => (
        <div key={i} className="act-row">
          <span className={`act-dot ${r.state === "ok" ? "" : r.state === "blue" ? "blue" : r.state === "red" ? "red" : r.state === "yellow" ? "yellow" : "idle"}`} />
          <span className="act-time">{r.t}</span>
          {r.side && (
            <span className="act-side">
              {r.side === "excel" ? <XlsxTile size={12}/> : <SheetsTile size={12}/>}
            </span>
          )}
          <span className="act-msg">{r.msg}</span>
          {r.rows && <span className="act-rows">{r.rows}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Onboarding overlay ────────────────────────────────────────────────────────
function Onboarding({ onClose, pushToast, credentialsConfigured }) {
  const steps = credentialsConfigured
    ? ["Connect", "Files", "Preferences"]
    : ["Credentials", "Connect", "Files", "Preferences"];
  const [step, setStep] = React.useState(0);

  const [signingIn, setSigningIn] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [email, setEmail]         = React.useState("");

  const [xlsxPath, setXlsxPath]   = React.useState("");
  const [xlsxName, setXlsxName]   = React.useState("");
  const [sheetUrl, setSheetUrl]   = React.useState("");
  const [fetching, setFetching]   = React.useState(false);
  const [fetched, setFetched]     = React.useState(null);

  const [direction, setDirection] = React.useState("both");
  const [conflict,  setConflict]  = React.useState("Last modified wins");
  const [startup,   setStartup]   = React.useState(true);
  const [notifs,    setNotifs]    = React.useState(true);
  const [tray,      setTray]      = React.useState(true);

  const currentStep = steps[step];

  React.useEffect(() => {
    setFetched(null);
    const looks = /docs\.google\.com\/spreadsheets/i.test(sheetUrl) || /^https?:\/\//i.test(sheetUrl);
    if (!looks || sheetUrl.length < 24) return;
    setFetching(true);
    if (!_api) {
      const id = setTimeout(() => { setFetching(false); setFetched({ name:"Q4 Revenue Pipeline", owner:"Finance team", sheets:3, rows:"4,218 rows" }); }, 700);
      return () => clearTimeout(id);
    }
    _api.validate_sheet_url(sheetUrl).then((res) => {
      setFetching(false);
      if (res.ok) setFetched({ name:res.title, owner:"", sheets:res.worksheets?.length || 1, rows:"" });
      else setFetched(null);
    });
  }, [sheetUrl]);

  function onSignIn() {
    setSigningIn(true);
    if (!_api) {
      setTimeout(() => { setSigningIn(false); setConnected(true); setEmail("demo@example.com"); }, 900);
      return;
    }
    _api.connect_google().then((res) => {
      setSigningIn(false);
      if (res.ok) { setConnected(true); setEmail(res.email); }
      else pushToast({ title:"Sign-in failed", msg:res.error, kind:"red" });
    });
  }

  async function pickXlsx() {
    if (!_api) { setXlsxPath("~/Documents/Finance/Q4 Pipeline.xlsx"); setXlsxName("Q4 Pipeline.xlsx"); return; }
    const res = await _api.pick_excel_file();
    if (res.ok) { setXlsxPath(res.path); setXlsxName(res.path.split(/[\\/]/).pop()); }
  }

  async function pickCredentials() {
    if (!_api) return;
    const res = await _api.pick_credentials_file();
    if (res.ok) pushToast({ title:"Credentials saved", msg:"Google OAuth client loaded." });
    else if (res.error) pushToast({ title:"Error", msg:res.error, kind:"red" });
  }

  async function finish() {
    const dirMap = { both:"Bidirectional", excelToSheet:"Excel -> Sheets", sheetToExcel:"Sheets -> Excel" };
    if (_api) {
      const res = await _api.complete_onboarding({
        excel_path:xlsxPath, sheet_url:sheetUrl,
        sync_direction:dirMap[direction] || "Bidirectional",
        conflict_resolution:conflict,
        notifications:notifs, start_on_boot:startup, minimize_to_tray:tray,
      });
      if (res.ok) {
        pushToast({ title:"Setup complete", msg:xlsxName + " ↔ " + (fetched?.name || "Sheet") });
        onClose(res.config, res.pairs);
      }
    } else {
      pushToast({ title:"Setup complete (demo)", msg:"Running in browser mode." });
      onClose(null, null);
    }
  }

  const canNext = currentStep === "Credentials" ? true
                : currentStep === "Connect"     ? connected
                : currentStep === "Files"       ? !!xlsxPath && !!fetched
                : true;

  return (
    <div className="onb-back">
      <div className="glass onb">
        <div className="onb-close" onClick={() => onClose(null, null)}><IcX size={13}/></div>

        <div className="onb-steps">
          {steps.map((_, i) => (
            <div key={i} className="onb-step">
              <div className={`onb-step-dot ${step === i ? "active" : ""} ${i < step ? "done" : ""}`}>
                {i < step ? <IcCheck size={11}/> : i + 1}
              </div>
            </div>
          ))}
        </div>

        {currentStep === "Credentials" && (
          <>
            <h2 className="onb-h">Google OAuth setup</h2>
            <p className="onb-p">SheetSync needs a Google OAuth Desktop client from Google Cloud Console to access your Sheets.</p>
            <button className="btn primary" style={{ width:"100%", justifyContent:"center", marginBottom:10 }} onClick={pickCredentials}>
              <IcFolder size={14}/> Choose credentials.json
            </button>
            <p className="onb-p" style={{ fontSize:11, marginBottom:0, color:"var(--text-3)" }}>
              Google Cloud → Credentials → Create OAuth Client ID → Desktop app → Download JSON.
            </p>
          </>
        )}

        {currentStep === "Connect" && (
          <>
            <div className="onb-pair">
              <XlsxTile size={44} />
              <svg width="36" height="14" viewBox="0 0 36 14" aria-hidden="true">
                <path d="M2 5h28l-4-3" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M34 9H6l4 3" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <SheetsTile size={44} />
            </div>
            <h2 className="onb-h">Connect your Google account</h2>
            <p className="onb-p">SheetSync mirrors your local Excel files with Google Sheets bidirectionally. Sign in so we can access the sheets you choose.</p>
            {!connected ? (
              <button onClick={onSignIn} className={`btn-google ${signingIn ? "disabled" : ""}`}>
                {signingIn
                  ? <><div className="spin" style={{ borderTopColor:"#4B8EFF" }}/><span>Opening Google…</span></>
                  : <><GoogleG size={18}/><span>Sign in with Google</span></>}
              </button>
            ) : (
              <div className="onb-acct">
                <div className="onb-acct-avatar">{email[0]?.toUpperCase()}</div>
                <div className="onb-acct-text">
                  <div className="onb-acct-name">{email.split("@")[0]}</div>
                  <div className="onb-acct-mail mono">{email}</div>
                </div>
                <div className="onb-acct-check"><IcCheck size={12}/></div>
              </div>
            )}
            <div className="onb-perms">
              <div className="onb-perms-h">SheetSync will be able to</div>
              {["Read & edit sheets you select","See basic profile info (name, email)","List sheets in folders you choose"].map((p,i) => (
                <div key={i} className="onb-perm"><span className="ic"><IcCheck size={11}/></span> {p}</div>
              ))}
            </div>
            <div className="onb-foot"><IcLock size={11}/><span>OAuth 2.0 · we never see your password</span></div>
          </>
        )}

        {currentStep === "Files" && (
          <>
            <h2 className="onb-h" style={{ marginTop:4 }}>Choose your files</h2>
            <p className="onb-p">Pick the local Excel file and the Google Sheet to keep in sync.</p>
            <div className="onb-field">
              <div className="onb-field-lbl">Excel file</div>
              <div className={`onb-file-input ${xlsxPath ? "filled" : ""}`} onClick={pickXlsx}>
                <XlsxTile size={22}/>
                {xlsxPath ? (
                  <>
                    <div className="onb-file-text">
                      <div className="onb-file-name">{xlsxName}</div>
                      <div className="onb-file-sub">{xlsxPath}</div>
                    </div>
                    <div className="onb-file-btn">Change</div>
                  </>
                ) : (
                  <><div className="onb-file-placeholder">Choose a .xlsx file</div><div className="onb-file-btn">Browse</div></>
                )}
              </div>
            </div>
            <div className="onb-field">
              <div className="onb-field-lbl">Google Sheet URL</div>
              <input className="onb-text-input mono" placeholder="https://docs.google.com/spreadsheets/d/…"
                     value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}/>
              {fetching && <div className="onb-fetching"><div className="spin"/><span>Resolving sheet…</span></div>}
              {fetched && (
                <div className="onb-fetched">
                  <SheetsTile size={22}/>
                  <div className="onb-fetched-text">
                    <div className="onb-fetched-name">{fetched.name}</div>
                    <div className="onb-fetched-meta">{[fetched.owner, fetched.sheets && `${fetched.sheets} tabs`, fetched.rows].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className="lib-paired"><IcCheck size={11}/> found</span>
                </div>
              )}
              {!sheetUrl && <div className="onb-fetching" style={{ color:"var(--text-3)" }}><span>Paste a link — we'll auto-fetch the sheet name.</span></div>}
            </div>
          </>
        )}

        {currentStep === "Preferences" && (
          <>
            <h2 className="onb-h" style={{ marginTop:4 }}>Sync preferences</h2>
            <p className="onb-p">Choose how this pair behaves. You can change all of this later in Settings.</p>
            <div className="onb-prefs-section">
              <div className="onb-prefs-h">Sync direction</div>
              <div className="onb-dir-grid">
                {[
                  { id:"both",         name:"Two-way",        sub:"Both edit",  arrows:"⇄" },
                  { id:"excelToSheet", name:"Excel → Sheets", sub:"Local wins", arrows:"→" },
                  { id:"sheetToExcel", name:"Sheets → Excel", sub:"Cloud wins", arrows:"←" },
                ].map((d) => (
                  <div key={d.id} className={`onb-dir ${direction === d.id ? "on" : ""}`} onClick={() => setDirection(d.id)}>
                    <div className="onb-dir-arrows" style={{ fontSize:16, fontWeight:600 }}>{d.arrows}</div>
                    <div className="onb-dir-name">{d.name}</div>
                    <div className="onb-dir-sub">{d.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="onb-prefs-section">
              <div className="onb-prefs-h">Conflict resolution</div>
              <select className="onb-select" value={conflict} onChange={(e) => setConflict(e.target.value)}>
                <option value="Last modified wins">Prefer the newer edit</option>
                <option value="Sheets wins">Prefer Google Sheets</option>
                <option value="Excel wins">Prefer Excel</option>
              </select>
            </div>
            <div className="onb-prefs-section">
              <div className="onb-prefs-h">App behavior</div>
              <div className="onb-toggles">
                {[
                  { lbl:"Start SheetSync at login",    help:"Sync resumes the moment your PC wakes up.", val:startup, set:setStartup },
                  { lbl:"Show notifications",           help:"System banners for completed syncs and conflicts.", val:notifs, set:setNotifs },
                  { lbl:"Minimize to tray on close",   help:"Closing the window keeps SheetSync running.", val:tray, set:setTray },
                ].map((tog, i) => (
                  <div key={i} className="onb-tog" onClick={() => tog.set(!tog.val)}>
                    <div className="onb-tog-text">
                      <div className="onb-tog-lbl">{tog.lbl}</div>
                      <div className="onb-tog-help">{tog.help}</div>
                    </div>
                    <button className="twk-toggle" data-on={tog.val ? "1" : "0"}
                            onClick={(e) => { e.stopPropagation(); tog.set(!tog.val); }}>
                      <i style={{ position:"absolute", top:2, left:2, width:14, height:14, borderRadius:"50%",
                                  background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.25)",
                                  transition:"transform 150ms ease",
                                  transform: tog.val ? "translateX(14px)" : "translateX(0)" }}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="onb-actions">
          {step > 0
            ? <span className="onb-back-btn" onClick={() => setStep(step - 1)}>← Back</span>
            : <span className="onb-back-btn" onClick={() => onClose(null, null)}>Skip for now</span>}
          <div className="spacer"/>
          <button className={`onb-next ${!canNext ? "disabled" : ""}`}
                  onClick={() => step < steps.length - 1 ? setStep(step + 1) : finish()}>
            {step < steps.length - 1 ? "Continue" : "Finish setup"}
            {step < steps.length - 1 ? <IcArrowRight size={13}/> : <IcCheck size={13}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────────────
function Toasts({ items }) {
  return (
    <div className="toasts">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind || ""}`}>
          <span className="toast-ic">
            {t.kind === "red" ? <IcAlert size={14}/> : <IcCheck size={14}/>}
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard screen ──────────────────────────────────────────────────────────
function ScreenDashboard({ status, accent, pairs, activity, onSync, onPause }) {
  return (
    <>
      <Hero status={status} accent={accent} pairs={pairs} onSync={onSync} onPause={onPause} />
      <div className="section-h">
        <h2>Active pairs</h2>
        <span className="count">{pairs.length}</span>
        <div className="spacer" />
        <span className="link">Open Sync pairs →</span>
      </div>
      {pairs.length > 0
        ? <div className="grid">{pairs.map((p) => <PairCard key={p.id} pair={p} status={status} accent={accent} />)}</div>
        : <div className="glass" style={{ padding:"32px", textAlign:"center", color:"var(--text-3)" }}>
            No pairs configured yet. Open Settings to add your first pair.
          </div>}
      <div className="section-h">
        <h2>Activity</h2>
        <span className="count">{activity.length}</span>
        <div className="spacer" />
        <span className="link">Open full log →</span>
      </div>
      <ActivityList rows={activity.slice(0, 8)} />
    </>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak]     = useTweaks(TWEAK_DEFAULTS);
  const tab               = t.tab;
  const accent            = t.accent;

  const [status, setStatus]     = React.useState("watching");
  const [pairs,  setPairs]      = React.useState(MOCK_PAIRS);
  const [activity, setActivity] = React.useState(MOCK_ACTIVITY);
  const [config, setConfig]     = React.useState(null);
  const [credsOk, setCredsOk]   = React.useState(true);
  const [toasts, setToasts]     = React.useState([]);
  const toastIdRef = React.useRef(1);

  // ── API init ────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    waitForApi().then(async () => {
      _api = window.pywebview?.api ?? null;
      if (!_api) return; // browser mode: keep mock data

      window.__ss_event = (event) => {
        if (event.type === "status")   setStatus(event.status);
        if (event.type === "toast")    pushToast({ title:event.title, msg:event.msg, kind:event.kind || "" });
        if (event.type === "activity") setActivity(event.entries);
        if (event.type === "pairs")    setPairs(event.pairs);
      };

      const data = await _api.get_initial_data();
      setStatus(data.status || "watching");
      if (data.pairs?.length)    setPairs(data.pairs);
      if (data.activity?.length) setActivity(data.activity);
      if (data.config)           setConfig(data.config);
      setCredsOk(data.credentials_configured ?? true);
      if (!data.setup_complete)  setTweak("showOnboarding", true);
    });
  }, []);

  // ── ⌘S shortcut ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); triggerSync(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // ── actions ──────────────────────────────────────────────────────────────────
  function pushToast(toast) {
    const id = toastIdRef.current++;
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
  }

  async function triggerSync() {
    if (status === "syncing") return;
    if (_api) {
      _api.sync_now(); // status updates arrive via __ss_event
    } else {
      setStatus("syncing");
      setTimeout(() => { setStatus("watching"); pushToast({ title:"Sync complete (demo)", msg:"Running in browser mode." }); }, 2200);
    }
  }

  async function togglePause() {
    if (_api) _api.toggle_pause();
    else setStatus(status === "idle" ? "watching" : "idle");
  }

  function onOnboardingClose(newConfig, newPairs) {
    setTweak("showOnboarding", false);
    if (newConfig) setConfig(newConfig);
    if (newPairs)  setPairs(newPairs);
  }

  const tabLabel = { dashboard:"Dashboard", sheets:"Sync pairs", activity:"Activity", library:"Library", settings:"Settings" }[tab];
  const titleStatus = { watching:"Watching", syncing:"Syncing…", error:"Error", idle:"Paused" }[status] || "Watching";

  return (
    <>
      <div className="stage">
        <div className="mac-window">
          <div className="titlebar">
            <div className="traffic">
              <div className="tl close"   onClick={() => _api?.window_action("close")}></div>
              <div className="tl min"     onClick={() => _api?.window_action("minimize")}></div>
              <div className="tl max"     onClick={() => _api?.window_action("maximize")}></div>
            </div>
            <div className="title">
              <span className="title-dot" style={{
                background: status === "syncing" ? "var(--syncing)" : status === "error" ? "var(--error)" : status === "idle" ? "var(--warning)" : "var(--success)",
                boxShadow: (status === "error" || status === "idle") ? "none" : `0 0 8px ${status === "syncing" ? "rgba(75,142,255,0.7)" : "rgba(57,255,20,0.7)"}`,
              }}/>
              SheetSync — {titleStatus}
            </div>
          </div>

          <div className="body">
            <Sidebar tab={tab} onTab={(id) => setTweak("tab", id)}
                     status={status} pairs={pairs} config={config} />
            <main className="main">
              <div className="toolbar">
                <div className="crumbs">
                  <span>Workspace</span><span className="sep">/</span><span className="here">{tabLabel}</span>
                </div>
                <div className="toolbar-spacer" />
                <div className="search">
                  <IcSearch size={12} />
                  <input placeholder="Search pairs, files, runs…" />
                  <span className="kbd">⌘K</span>
                </div>
                <button className="btn">
                  {tab === "library"  ? <><IcLink size={13}/> Pair files</>
                  : tab === "settings" ? <><IcShield size={13}/> Manage</>
                  : <><IcPlus size={13}/> New pair</>}
                </button>
              </div>

              <div className="scroll">
                {tab === "dashboard" && (
                  <ScreenDashboard status={status} accent={accent} pairs={pairs}
                    activity={activity} onSync={triggerSync} onPause={togglePause} />
                )}
                {tab === "sheets" && (
                  <ScreenSheets status={status} accent={accent} pairs={pairs}
                    pushToast={pushToast} api={_api} />
                )}
                {tab === "activity" && <ScreenActivity rows={activity} />}
                {tab === "library"  && <ScreenLibrary pushToast={pushToast} />}
                {tab === "settings" && (
                  <ScreenSettings config={config} pushToast={pushToast} api={_api}
                    onConfigSaved={(cfg, prs) => { setConfig(cfg); if (prs) setPairs(prs); }} />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      <Toasts items={toasts} />

      {t.showOnboarding && (
        <Onboarding onClose={onOnboardingClose} pushToast={pushToast} credentialsConfigured={credsOk} />
      )}

      <TweaksPanel>
        <TweakSection label="Navigation">
          <TweakSelect label="Active screen" value={tab}
            options={[
              { value:"dashboard", label:"Dashboard" }, { value:"sheets",   label:"Sync pairs" },
              { value:"activity",  label:"Activity" },  { value:"library",  label:"Library" },
              { value:"settings",  label:"Settings" },
            ]}
            onChange={(v) => setTweak("tab", v)} />
        </TweakSection>
        <TweakSection label="Accent">
          <TweakRadio label="Color" value={accent} options={["green","blue"]} onChange={(v) => setTweak("accent", v)} />
        </TweakSection>
        <TweakSection label="Onboarding">
          <TweakToggle label="Show overlay" value={t.showOnboarding} onChange={(v) => setTweak("showOnboarding", v)} />
        </TweakSection>
        <TweakSection label="Actions">
          <TweakButton label="Trigger sync (⌘S)" onClick={triggerSync} />
          <TweakButton label="Test toast" secondary
            onClick={() => pushToast({ title:"Pulled 14 new rows", msg:"Vendor contracts → xlsx · 1.2s" })} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

Object.assign(window, { DirArrow, StatePill, resolveCardState, ActivityList, PairCard });

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
