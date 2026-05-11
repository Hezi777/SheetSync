// screens.jsx — SheetSync inner screens
// Sync pairs · Activity · Library · Settings
// Receives pairs/config/api as props from App (no more globals).

// ── Sync pairs ────────────────────────────────────────────────────────────────
function ScreenSheets({ status, accent, pairs, pushToast, api }) {
  const [filter, setFilter]         = React.useState("all");
  const [selectedId, setSelectedId] = React.useState(pairs[0]?.id || null);

  React.useEffect(() => {
    if (pairs.length && !pairs.find((p) => p.id === selectedId)) setSelectedId(pairs[0].id);
  }, [pairs]);

  const filtered = pairs.filter((p) => {
    if (filter === "all")     return true;
    if (filter === "errors")  return p.state === "error";
    if (filter === "paused")  return p.state === "idle";
    if (filter === "healthy") return p.state === "live";
    return true;
  });

  const selected = pairs.find((p) => p.id === selectedId) || pairs[0] || null;
  const selRs    = selected ? resolveCardState({ pair: selected, status }) : null;
  const dirText  = (d) => d === "both" ? "Two-way" : d === "excelToSheet" ? "Excel → Sheets" : "Sheets → Excel";

  return (
    <>
      <div className="screen-h">
        <div>
          <h1 className="screen-title">Sync pairs</h1>
          <div className="screen-sub">Each pair mirrors one Excel file to one Google Sheet.</div>
        </div>
        <div className="screen-actions">
          <button className="btn"><IcDownload size={13}/> Export config</button>
          <button className="btn primary"><IcPlus size={13}/> New pair</button>
        </div>
      </div>

      <div className="filter-bar glass">
        {[
          { id:"all",     label:"All",     count: pairs.length },
          { id:"healthy", label:"Healthy", count: pairs.filter((p) => p.state === "live").length },
          { id:"errors",  label:"Errors",  count: pairs.filter((p) => p.state === "error").length },
          { id:"paused",  label:"Paused",  count: pairs.filter((p) => p.state === "idle").length },
        ].map((f) => (
          <div key={f.id} className={`filter-chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label}<span className="chip-count">{f.count}</span>
          </div>
        ))}
        <div style={{ flex:1 }} />
        <div className="filter-end"><IcFilter size={12}/> Sort: Last sync</div>
      </div>

      <div className="pairs-split">
        <div className="glass pairs-list">
          <div className="pairs-head">
            <div>Pair</div><div>Direction</div><div>Rows</div><div>Last sync</div><div>State</div>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding:"24px 16px", color:"var(--text-3)", fontSize:13 }}>No pairs match this filter.</div>
          )}
          {filtered.map((p) => {
            const rs = resolveCardState({ pair: p, status });
            return (
              <div key={p.id} className={`pairs-row ${selectedId === p.id ? "selected" : ""}`} onClick={() => setSelectedId(p.id)}>
                <div className="pr-name">
                  <div className="pr-tiles"><XlsxTile size={18}/><SheetsTile size={18}/></div>
                  <div className="pr-text">
                    <div className="pr-title">{p.name}</div>
                    <div className="pr-sub mono">{p.excel?.split(/[\\/]/).pop()}</div>
                  </div>
                </div>
                <div className="pr-dir">
                  <DirArrow direction={p.direction} syncing={rs.state === "syncing"}
                            color={rs.cls === "red" ? "#FF6464" : rs.cls === "blue" || accent === "blue" ? "#9DC0FF" : "rgba(255,255,255,0.55)"} />
                  <span>{dirText(p.direction)}</span>
                </div>
                <div className="pr-rows mono">{p.rows?.toLocaleString() || "—"}</div>
                <div className="pr-time mono">{rs.state === "syncing" ? "now" : p.lastSync}</div>
                <div className="pr-state"><StatePill kind={rs.cls} label={rs.label} /></div>
              </div>
            );
          })}
        </div>

        {selected && selRs ? (
          <div className="glass pairs-detail">
            <div className="pd-head">
              <div className="pd-tiles">
                <XlsxTile size={32}/>
                <DirArrow direction={selected.direction} syncing={selRs.state === "syncing"}
                          color={selRs.cls === "red" ? "#FF6464" : "rgba(255,255,255,0.6)"} />
                <SheetsTile size={32}/>
              </div>
              <div className="pd-title-block">
                <h3 className="pd-title">{selected.name}</h3>
                <StatePill kind={selRs.cls} label={selRs.label} />
              </div>
            </div>
            {[
              { lbl:"Local file",   val: selected.excel,  mono: true },
              { lbl:"Google Sheet", val: selected.sheet,  mono: true, extra: selected.sheetId },
              { lbl:"Direction",    val: dirText(selected.direction) },
              { lbl:"Frequency",    val: selected.every || "on change" },
              { lbl:"Last sync",    val: selected.lastSync },
            ].map((row, i) => (
              <div key={i} className="pd-row">
                <div className="pd-lbl">{row.lbl}</div>
                <div className={`pd-val${row.mono ? " mono" : ""}`}>
                  {row.val}{row.extra && <span className="pd-id">{row.extra}</span>}
                </div>
              </div>
            ))}
            <div className="pd-grid">
              <div className="meta-cell"><div className="v">{selected.rows?.toLocaleString() || "—"}</div><div className="l">Rows</div></div>
              <div className="meta-cell"><div className="v">{selected.cols || "—"}</div><div className="l">Columns</div></div>
              <div className="meta-cell"><div className="v">{selected.sheets || 1}</div><div className="l">Tabs</div></div>
            </div>
            <div className="pd-actions">
              <button className="btn primary"
                      onClick={() => api?.sync_now().then(() => pushToast({ title:"Force sync triggered", msg: selected.name }))}>
                <IcRefresh size={13}/> Force sync
              </button>
              <button className="btn"><IcEye size={13}/> Open in Sheets</button>
              <button className="btn"><IcFile size={13}/> Reveal .xlsx</button>
              <button className="btn" onClick={() => api?.toggle_pause()}>
                <IcPause size={13}/> Pause pair
              </button>
            </div>
          </div>
        ) : (
          <div className="glass pairs-detail" style={{ alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
            No pairs yet. Click "New pair" to get started.
          </div>
        )}
      </div>
    </>
  );
}

// ── Activity ──────────────────────────────────────────────────────────────────
function ScreenActivity({ rows }) {
  const [filter, setFilter] = React.useState("all");

  const visible = rows.filter((r) => {
    if (filter === "ok")    return r.state === "ok";
    if (filter === "warn")  return r.state === "yellow" || r.state === "red";
    if (filter === "edits") return r.state === "blue";
    return true;
  });

  const groups = [
    { label:"This morning", rows: visible.slice(0, 5) },
    { label:"Earlier today", rows: visible.slice(5) },
  ].filter((g) => g.rows.length > 0);

  return (
    <>
      <div className="screen-h">
        <div>
          <h1 className="screen-title">Activity</h1>
          <div className="screen-sub">Every read, write and conflict, in order.</div>
        </div>
        <div className="screen-actions">
          <button className="btn"><IcCalendar size={13}/> Today</button>
          <button className="btn"><IcDownload size={13}/> Export log</button>
        </div>
      </div>

      <div className="act-layout">
        <div className="glass act-side-panel">
          <div className="nav-label" style={{ padding:"8px 12px 6px" }}>Filter</div>
          {[
            { id:"all",   label:"All events",        n:rows.length,                                                        c:"" },
            { id:"ok",    label:"Successful syncs",  n:rows.filter((r) => r.state === "ok").length,                        c:"" },
            { id:"edits", label:"Edits & schema",    n:rows.filter((r) => r.state === "blue").length,                      c:"blue" },
            { id:"warn",  label:"Conflicts & errors",n:rows.filter((r) => r.state === "yellow" || r.state === "red").length, c:"yellow" },
          ].map((f) => (
            <div key={f.id} className={`side-filter ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
              <span className={`mini-dot ${f.c}`}/><span>{f.label}</span><span className="side-count">{f.n}</span>
            </div>
          ))}
        </div>

        <div className="act-main">
          {groups.length > 0
            ? groups.map((g, gi) => (
                <div key={gi} className="act-group">
                  <div className="act-group-head">
                    <span className="act-group-label">{g.label}</span>
                    <span className="act-group-count">{g.rows.length} events</span>
                  </div>
                  <ActivityList rows={g.rows} />
                </div>
              ))
            : <ActivityList rows={[]} />}
        </div>
      </div>
    </>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────
const LOCAL_FILES = [
  { name:"Q4 Pipeline.xlsx",        path:"~/Documents/Finance/Q4 Pipeline.xlsx",        size:"1.4 MB", paired:true,  ed:"32s ago"   },
  { name:"Headcount 2026.xlsx",     path:"~/Documents/People/Headcount 2026.xlsx",      size:"240 KB", paired:true,  ed:"2m ago"    },
  { name:"Vendor matrix.xlsx",      path:"~/Documents/Legal/Vendor matrix.xlsx",        size:"108 KB", paired:true,  ed:"12s ago"   },
  { name:"Campaigns FY26.xlsx",     path:"~/Marketing/Campaigns FY26.xlsx",             size:"8.2 MB", paired:true,  ed:"8m ago"    },
  { name:"Forecast model v3.xlsx",  path:"~/Documents/Finance/Forecast model v3.xlsx",  size:"3.1 MB", paired:false, ed:"1h ago"    },
  { name:"Inventory snapshot.xlsx", path:"~/Operations/Inventory snapshot.xlsx",        size:"660 KB", paired:false, ed:"4h ago"    },
];

const REMOTE_SHEETS = [
  { name:"Q4 Revenue Pipeline",    owner:"Finance team", shared:14, paired:true,  ed:"32s ago"   },
  { name:"Headcount",              owner:"People ops",   shared:6,  paired:true,  ed:"2m ago"    },
  { name:"Vendor contracts",       owner:"Legal",        shared:3,  paired:true,  ed:"12s ago"   },
  { name:"Campaign performance",   owner:"Marketing",    shared:22, paired:true,  ed:"8m ago"    },
  { name:"FY26 Roadmap",           owner:"Eli Marsh",    shared:8,  paired:false, ed:"yesterday" },
  { name:"Annual board deck data", owner:"Operations",   shared:5,  paired:false, ed:"2d ago"    },
  { name:"Customer NPS responses", owner:"CX team",      shared:11, paired:false, ed:"5d ago"    },
];

function ScreenLibrary({ pushToast }) {
  const [pickedLocal,  setPickedLocal]  = React.useState(null);
  const [pickedRemote, setPickedRemote] = React.useState(null);

  function tryPair() {
    if (!pickedLocal || !pickedRemote) return;
    pushToast({ title:"Paired", msg: pickedLocal.name + " ↔ " + pickedRemote.name + " · two-way" });
    setPickedLocal(null); setPickedRemote(null);
  }

  return (
    <>
      <div className="screen-h">
        <div>
          <h1 className="screen-title">Library</h1>
          <div className="screen-sub">Pick one local Excel file and one Google Sheet, then connect them.</div>
        </div>
        <div className="screen-actions">
          <button className="btn"><IcFolder size={13}/> Add folder</button>
          <button className="btn"><GoogleG size={13}/> Refresh Drive</button>
        </div>
      </div>

      <div className="lib-pair-bar glass">
        <div className="lib-slot">
          <div className="lib-slot-lbl">Local file</div>
          {pickedLocal
            ? <div className="lib-slot-val"><XlsxTile size={20}/><span>{pickedLocal.name}</span><span className="lib-slot-x" onClick={() => setPickedLocal(null)}><IcX size={11}/></span></div>
            : <div className="lib-slot-empty">Choose an .xlsx</div>}
        </div>
        <div className="lib-link">
          <svg width="44" height="14" viewBox="0 0 44 14" aria-hidden="true">
            <path d="M3 5h38l-3-3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M41 9H6l3 3"  fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="lib-slot">
          <div className="lib-slot-lbl">Google Sheet</div>
          {pickedRemote
            ? <div className="lib-slot-val"><SheetsTile size={20}/><span>{pickedRemote.name}</span><span className="lib-slot-x" onClick={() => setPickedRemote(null)}><IcX size={11}/></span></div>
            : <div className="lib-slot-empty">Choose a sheet</div>}
        </div>
        <button className={`btn primary lib-cta ${(!pickedLocal || !pickedRemote) ? "disabled" : ""}`} onClick={tryPair}>
          <IcLink size={13}/> Connect
        </button>
      </div>

      <div className="lib-grid">
        <div className="lib-col">
          <div className="lib-col-head"><XlsxTile size={18}/><div className="lib-col-title">Excel files</div><span className="count">{LOCAL_FILES.length}</span></div>
          <div className="glass lib-list">
            {LOCAL_FILES.map((f, i) => (
              <div key={i} className={`lib-item ${pickedLocal?.path === f.path ? "picked" : ""}`} onClick={() => setPickedLocal(f)}>
                <XlsxTile size={20}/>
                <div className="lib-item-text">
                  <div className="lib-item-name">{f.name}</div>
                  <div className="lib-item-sub mono">{f.path}</div>
                </div>
                <div className="lib-item-meta">
                  <span className="lib-item-size mono">{f.size}</span>
                  {f.paired ? <span className="lib-paired"><IcLink size={11}/> paired</span> : <span className="lib-unpaired">unpaired</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lib-col">
          <div className="lib-col-head">
            <SheetsTile size={18}/><div className="lib-col-title">Google Sheets</div>
            <span className="count">{REMOTE_SHEETS.length}</span>
            <div style={{ flex:1 }}/>
            <div className="lib-account"><GoogleG size={12}/> connected</div>
          </div>
          <div className="glass lib-list">
            {REMOTE_SHEETS.map((f, i) => (
              <div key={i} className={`lib-item ${pickedRemote?.name === f.name ? "picked" : ""}`} onClick={() => setPickedRemote(f)}>
                <SheetsTile size={20}/>
                <div className="lib-item-text">
                  <div className="lib-item-name">{f.name}</div>
                  <div className="lib-item-sub">{f.owner} · shared with {f.shared}</div>
                </div>
                <div className="lib-item-meta">
                  <span className="lib-item-size mono">{f.ed}</span>
                  {f.paired ? <span className="lib-paired"><IcLink size={11}/> paired</span> : <span className="lib-unpaired">unpaired</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function ScreenSettings({ config, pushToast, api, onConfigSaved }) {
  const [section,   setSection]   = React.useState("account");
  const [direction, setDirection] = React.useState(config?.sync_direction || "Bidirectional");
  const [conflict,  setConflict]  = React.useState(config?.conflict_resolution || "Last modified wins");
  const [throttle,  setThrottle]  = React.useState(Math.round((config?.debounce_delay || 1.5) * 1000));
  const [auto,      setAuto]      = React.useState(true);
  const [hotkey,    setHotkey]    = React.useState(true);
  const [notif,     setNotif]     = React.useState(config?.notifications !== false);

  React.useEffect(() => {
    if (!config) return;
    setDirection(config.sync_direction || "Bidirectional");
    setConflict(config.conflict_resolution || "Last modified wins");
    setThrottle(Math.round((config.debounce_delay || 1.5) * 1000));
    setNotif(config.notifications !== false);
  }, [config]);

  async function saveField(updates) {
    if (!api) { pushToast({ title:"Saved (demo)", msg:"Running in browser mode." }); return; }
    const res = await api.save_settings(updates);
    if (res.ok) { onConfigSaved(res.config, res.pairs); pushToast({ title:"Settings saved", msg:"Changes applied." }); }
  }

  async function reconnectGoogle() {
    if (!api) return;
    const res = await api.connect_google();
    if (res.ok) { onConfigSaved({ ...config, google_email: res.email }, null); pushToast({ title:"Connected", msg: res.email }); }
    else pushToast({ title:"Sign-in failed", msg: res.error, kind:"red" });
  }

  async function disconnectGoogle() {
    if (!api) return;
    const res = await api.disconnect_google();
    if (res.ok) { onConfigSaved({ ...config, google_email:"" }, null); pushToast({ title:"Disconnected", msg:"Google account removed." }); }
  }

  async function resetAll() {
    if (!api) { pushToast({ title:"Nothing reset", msg:"Demo only — your data is safe." }); return; }
    await api.reset_all();
    window.location.reload();
  }

  const Toggle = ({ on, onToggle }) => (
    <button className="twk-toggle" data-on={on ? "1" : "0"} onClick={onToggle}>
      <i style={{ position:"absolute", top:2, left:2, width:14, height:14, borderRadius:"50%",
                  background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.25)", transition:"transform 150ms ease",
                  transform: on ? "translateX(14px)" : "translateX(0)" }}/>
    </button>
  );

  const sections = [
    { id:"account",   label:"Account",   icon:<IcUser /> },
    { id:"sync",      label:"Sync",      icon:<IcRefresh /> },
    { id:"conflicts", label:"Conflicts", icon:<IcArrows /> },
    { id:"network",   label:"Network",   icon:<IcGlobe /> },
    { id:"advanced",  label:"Advanced",  icon:<IcCommand /> },
  ];

  return (
    <>
      <div className="screen-h">
        <div>
          <h1 className="screen-title">Settings</h1>
          <div className="screen-sub">Connection, sync behaviour and conflict policy.</div>
        </div>
      </div>

      <div className="set-layout">
        <div className="glass set-side">
          {sections.map((s) => (
            <div key={s.id} className={`set-side-item ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>
              <span className="ic">{s.icon}</span><span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="set-main">

          {section === "account" && (<>
            <div className="glass set-card">
              <div className="set-card-h">
                <div><div className="set-card-title">Google account</div><div className="set-card-sub">Connected to your Drive for Google Sheets access.</div></div>
              </div>
              {config?.google_email ? (
                <div className="set-acct">
                  <div className="set-acct-avatar">{config.google_email[0]?.toUpperCase()}</div>
                  <div className="set-acct-text">
                    <div className="set-acct-name">{config.google_email.split("@")[0]}</div>
                    <div className="set-acct-mail mono">{config.google_email}</div>
                    <div className="set-acct-meta">Connected · OAuth 2.0</div>
                  </div>
                  <button className="btn" onClick={reconnectGoogle}><IcRefresh size={13}/> Refresh token</button>
                  <button className="btn" onClick={disconnectGoogle}><IcUnlink size={13}/> Disconnect</button>
                </div>
              ) : (
                <div style={{ padding:"12px 0" }}>
                  <button className="btn primary" onClick={reconnectGoogle}><GoogleG size={14}/> Sign in with Google</button>
                </div>
              )}
              <div className="set-perms">
                <div className="set-perm"><IcCheck size={12}/> Read & edit selected Sheets</div>
                <div className="set-perm"><IcCheck size={12}/> Read folder structure</div>
                <div className="set-perm muted"><IcX size={12}/> No access to other Drive files</div>
              </div>
            </div>

            <div className="glass set-card">
              <div className="set-card-h">
                <div><div className="set-card-title">Local Excel file</div><div className="set-card-sub">The .xlsx file SheetSync watches for changes.</div></div>
              </div>
              <div className="set-folders">
                {config?.excel_path
                  ? <div className="set-folder"><IcFile size={12}/><span className="mono">{config.excel_path}</span><span className="muted">watched</span></div>
                  : <div className="set-folder" style={{ color:"var(--text-3)" }}>No Excel file configured yet.</div>}
              </div>
            </div>
          </>)}

          {section === "sync" && (
            <div className="glass set-card">
              <div className="set-card-h"><div><div className="set-card-title">Sync behaviour</div><div className="set-card-sub">Defaults applied to all pairs.</div></div></div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Auto-sync on change</div><div className="set-field-help">React within ~2s of an edit on either side.</div></div>
                <Toggle on={auto} onToggle={() => setAuto(!auto)} />
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Default direction</div><div className="set-field-help">What new pairs use unless overridden.</div></div>
                <div className="seg-control">
                  {[
                    { id:"Bidirectional",   label:"Two-way" },
                    { id:"Excel -> Sheets", label:"Excel → Sheets" },
                    { id:"Sheets -> Excel", label:"Sheets → Excel" },
                  ].map((o) => (
                    <button key={o.id} className={direction === o.id ? "on" : ""}
                            onClick={() => { setDirection(o.id); saveField({ sync_direction: o.id }); }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Debounce delay</div><div className="set-field-help">Wait after a burst of edits before pushing.</div></div>
                <div className="set-throttle">
                  <input type="range" min={500} max={30000} step={500} value={throttle}
                         onChange={(e) => setThrottle(Number(e.target.value))}
                         onMouseUp={() => saveField({ debounce_delay: throttle / 1000 })} />
                  <span className="mono">{(throttle / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Keyboard shortcut</div><div className="set-field-help">Press <span className="kbd">⌘S</span> to force a sync.</div></div>
                <Toggle on={hotkey} onToggle={() => setHotkey(!hotkey)} />
              </div>
            </div>
          )}

          {section === "conflicts" && (
            <div className="glass set-card">
              <div className="set-card-h"><div><div className="set-card-title">Conflict resolution</div><div className="set-card-sub">When both sides edit the same cell within a sync window.</div></div></div>
              {[
                { id:"Last modified wins", title:"Prefer the newer edit",  help:"Use the side that wrote most recently. Subject to clock skew." },
                { id:"Sheets wins",        title:"Prefer Google Sheets",   help:"Treat the cloud as the source of truth." },
                { id:"Excel wins",         title:"Prefer Excel",           help:"Treat the local .xlsx as the source of truth." },
              ].map((opt) => (
                <div key={opt.id} className={`set-opt ${conflict === opt.id ? "selected" : ""}`}
                     onClick={() => { setConflict(opt.id); saveField({ conflict_resolution: opt.id }); }}>
                  <div className={`set-opt-radio ${conflict === opt.id ? "on" : ""}`}>{conflict === opt.id && <span/>}</div>
                  <div><div className="set-opt-title">{opt.title}</div><div className="set-opt-help">{opt.help}</div></div>
                </div>
              ))}
              <div className="set-field-row" style={{ marginTop:6 }}>
                <div className="set-field"><div className="set-field-lbl">Notify on conflict</div><div className="set-field-help">Surfaces a toast and a row in Activity.</div></div>
                <Toggle on={notif} onToggle={() => { const v = !notif; setNotif(v); saveField({ notifications: v }); }} />
              </div>
            </div>
          )}

          {section === "network" && (
            <div className="glass set-card">
              <div className="set-card-h"><div><div className="set-card-title">Network</div><div className="set-card-sub">Proxy, bandwidth, and quota.</div></div></div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Google Sheets API quota</div><div className="set-field-help">Reads and writes used this minute.</div></div>
                <div className="set-quota"><div className="set-quota-bar"><i style={{ width:"34%" }}/></div><span className="mono">34 / 100 req/min</span></div>
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Proxy</div><div className="set-field-help">Route all Google traffic through a corporate proxy.</div></div>
                <input className="set-input mono" placeholder="https://proxy.corp:8080" />
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Status</div><div className="set-field-help">Last 5 minutes.</div></div>
                <div className="set-net-status"><span className="status-badge"><span className="status-dot"/> Online · 42 ms</span></div>
              </div>
            </div>
          )}

          {section === "advanced" && (
            <div className="glass set-card">
              <div className="set-card-h"><div><div className="set-card-title">Advanced</div><div className="set-card-sub">Power-user knobs.</div></div></div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Cache directory</div><div className="set-field-help">Where SheetSync stores snapshots between runs.</div></div>
                <input className="set-input mono" defaultValue="%APPDATA%\\SheetSync" />
              </div>
              <div className="set-field-row">
                <div className="set-field"><div className="set-field-lbl">Log level</div><div className="set-field-help">Verbosity of the run log.</div></div>
                <div className="seg-control">
                  {["error","info","debug"].map((o) => <button key={o} className={o === "info" ? "on" : ""}>{o}</button>)}
                </div>
              </div>
              <div className="set-field-row">
                <div className="set-field">
                  <div className="set-field-lbl">Reset SheetSync</div>
                  <div className="set-field-help">Removes all pairs, tokens, and cached snapshots. Files on disk and in Drive are untouched.</div>
                </div>
                <button className="btn" style={{ color:"var(--error)", borderColor:"rgba(255,100,100,0.4)" }} onClick={resetAll}>Reset…</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

Object.assign(window, { ScreenSheets, ScreenActivity, ScreenLibrary, ScreenSettings });
