// Lucide-style icons used throughout SheetSync. 14px, 1.5 stroke.
// All accept { size, color, className } and forward style.

const Ic = ({ children, size = 14, color = "currentColor", style, className }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcGrid       = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>;
const IcLayers     = (p) => <Ic {...p}><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/></Ic>;
const IcActivity   = (p) => <Ic {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Ic>;
const IcFolder     = (p) => <Ic {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Ic>;
const IcSettings   = (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>;
const IcPlay       = (p) => <Ic {...p}><polygon points="6 4 20 12 6 20 6 4"/></Ic>;
const IcPause      = (p) => <Ic {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Ic>;
const IcRefresh    = (p) => <Ic {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></Ic>;
const IcPlus       = (p) => <Ic {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>;
const IcSearch     = (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ic>;
const IcSun        = (p) => <Ic {...p}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"/></Ic>;
const IcMoon       = (p) => <Ic {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></Ic>;
const IcCheck      = (p) => <Ic {...p}><polyline points="4 12 9 17 20 6"/></Ic>;
const IcArrowRight = (p) => <Ic {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ic>;
const IcAlert      = (p) => <Ic {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ic>;
const IcZap        = (p) => <Ic {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Ic>;
const IcDatabase   = (p) => <Ic {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></Ic>;
const IcFile       = (p) => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ic>;
const IcCloud      = (p) => <Ic {...p}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></Ic>;
const IcCommand    = (p) => <Ic {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Ic>;
const IcMoreH      = (p) => <Ic {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Ic>;
const IcEye        = (p) => <Ic {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>;
const IcChevron    = (p) => <Ic {...p}><polyline points="9 18 15 12 9 6"/></Ic>;

// Extra utility icons used across screens.
const IcFilter   = (p) => <Ic {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Ic>;
const IcCalendar = (p) => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ic>;
const IcLink     = (p) => <Ic {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Ic>;
const IcUnlink   = (p) => <Ic {...p}><path d="M18.84 12.25 8.5 1.91"/><path d="m11.49 7.13 1.86-1.86a5 5 0 0 1 7.07 7.07l-1.86 1.86"/><path d="m12.51 16.87-1.86 1.86a5 5 0 0 1-7.07-7.07l1.86-1.86"/></Ic>;
const IcX        = (p) => <Ic {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ic>;
const IcLock     = (p) => <Ic {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>;
const IcGlobe    = (p) => <Ic {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Ic>;
const IcDownload = (p) => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ic>;
const IcUpload   = (p) => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Ic>;
const IcArrows   = (p) => <Ic {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></Ic>;
const IcBell     = (p) => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>;
const IcUser     = (p) => <Ic {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>;
const IcShield   = (p) => <Ic {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>;

// ── File-type tiles ─────────────────────────────────────────────────────────
// Stylized file-type representations for Microsoft Excel (.xlsx) and
// Google Sheets. Used as functional file-type indicators, not as UI surfaces.
const XlsxTile = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
    <defs>
      <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1e8449"/>
        <stop offset="1" stopColor="#0b6b3a"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="20" height="20" rx="4" fill="url(#xg)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
    <path d="M6.5 7l3.2 4-3.2 4M15.5 7l-3.2 4 3.2 4"
          stroke="#fff" strokeWidth="1.6" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SheetsTile = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#34c373"/>
        <stop offset="1" stopColor="#17924a"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="20" height="20" rx="4" fill="url(#sg)"
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
    <rect x="5.5" y="5.5" width="11" height="11" rx="1.2"
          fill="none" stroke="#fff" strokeWidth="1.1"/>
    <line x1="5.5" y1="9" x2="16.5" y2="9" stroke="#fff" strokeWidth="0.9"/>
    <line x1="5.5" y1="12.5" x2="16.5" y2="12.5" stroke="#fff" strokeWidth="0.9"/>
    <line x1="9" y1="5.5" x2="9" y2="16.5" stroke="#fff" strokeWidth="0.9"/>
    <line x1="12.5" y1="5.5" x2="12.5" y2="16.5" stroke="#fff" strokeWidth="0.9"/>
  </svg>
);

// Google brand mark — the multi-color G used in OAuth sign-in flows.
// Per Google brand guidelines, this glyph is reproduced unaltered for
// identification of the auth provider only.
const GoogleG = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 7 29.4 5 24 5c-7.7 0-14.4 4.4-17.7 10.7z"/>
    <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.8-5.3l-6.4-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 4-3.7 5.4l6.4 5.2C42.4 35.5 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

Object.assign(window, {
  Ic, IcGrid, IcLayers, IcActivity, IcFolder, IcSettings,
  IcPlay, IcPause, IcRefresh, IcPlus, IcSearch, IcSun, IcMoon,
  IcCheck, IcArrowRight, IcAlert, IcZap, IcDatabase, IcFile,
  IcCloud, IcCommand, IcMoreH, IcEye, IcChevron,
  IcFilter, IcCalendar, IcLink, IcUnlink, IcX, IcLock, IcGlobe,
  IcDownload, IcUpload, IcArrows, IcBell, IcUser, IcShield,
  XlsxTile, SheetsTile, GoogleG,
});
