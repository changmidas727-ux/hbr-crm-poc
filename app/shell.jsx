// ─────────────────────────────────────────────────────────────────────────────
// App 外殼：Sidebar（4 模組）、Topbar、共用元件、出缺勤計算工具
// ─────────────────────────────────────────────────────────────────────────────

// ── 出席率統計工具（已隨出缺勤模組移除）──

// ── Sidebar ── 課務 / CRM 模組
const NAV = [
  { section: '課務' },
  { id: 'courses',    label: '課程管理',   icon: 'Book' },
  { id: 'performance',label: '期數成效管理', icon: 'TrendingUp' },
  { section: 'CRM' },
  { id: 'prospects',  label: '潛客管理',   icon: 'User' },
  { id: 'customers',  label: '客戶管理',   icon: 'Users' },
  { section: '系統', super: true },
  { id: 'accounts',   label: '帳號權限管理', icon: 'Shield', super: true },
];

const Sidebar = ({ active, onNav, user, onLogout }) => {
  const [menu, setMenu] = React.useState(false);
  const isSuper = user && user.role === 'superuser';
  const initial = (user && user.name) ? user.name.slice(0, 1) : '?';
  const navItems = NAV.filter((it) => !it.super || isSuper);
  return (
  <aside className="app-sidebar" style={{
    flexShrink: 0, height: '100%',
    borderRight: '1px solid var(--border)', background: 'var(--sidebar-bg)',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', color: '#fff',
        display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
      }}>課</div>
      <div className="side-label" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>HBR 學院</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>課務系統 · 第一階段</div>
      </div>
    </div>

    <div style={{ height: 6 }}></div>

    <nav className="thin-scroll" style={{ flex: 1, overflow: 'auto', padding: '2px 8px 12px' }}>
      {navItems.map((it, i) => {
        if (it.section) return (
          <div key={i} className="side-label" style={{ padding: '12px 8px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em' }}>{it.section}</div>
        );
        const sel = it.id === active;
        const Ic = Icon[it.icon];
        return (
          <button key={it.id} onClick={() => onNav(it.id)} title={it.label} style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 30, padding: '0 8px',
            background: sel ? 'var(--bg-active)' : 'transparent',
            color: sel ? 'var(--text)' : 'var(--text-2)',
            fontSize: 13, fontWeight: sel ? 500 : 400,
            border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ color: sel ? 'var(--accent)' : 'var(--text-3)', display: 'flex' }}><Ic size={16}/></span>
            <span className="side-label" style={{ flex: 1 }}>{it.label}</span>
            {it.badge && <span className="side-label" style={{ fontSize: 10, color: 'var(--text-3)' }}>{it.badge}</span>}
          </button>
        );
      })}
    </nav>

    <div className="side-footer" style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <span className="avatar side-avatar" onClick={() => setMenu(m => !m)} title="帳號選單" style={{ width: 28, height: 28, background: 'oklch(90% 0.04 30)', color: 'oklch(40% 0.1 30)', cursor: 'pointer' }}>{initial}</span>
      <div className="side-label" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user ? user.name : '—'}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>{isSuper && <Icon.Shield size={9}/>}{user ? window.DATA.roleLabel(user.role) : ''}</div>
      </div>
      <button className="btn icon sm ghost side-gear" onClick={() => setMenu(m => !m)} style={menu ? { background: 'var(--bg-active)' } : undefined}><Icon.Settings size={14}/></button>
      {menu && (<>
        <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
        <div className="card" style={{ position: 'absolute', right: 10, bottom: 48, width: 168, zIndex: 41, boxShadow: 'var(--shadow-menu)', padding: 5 }}>
          <div style={{ padding: '6px 9px 7px', borderBottom: '1px solid var(--divider)', marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user ? user.name : ''}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user ? user.email : ''}</div>
          </div>
          <button onClick={() => { setMenu(false); onLogout && onLogout(); }} style={{ ...menuItem, color: 'var(--danger-text)' }}><Icon.LogOut size={14}/> 登出</button>
        </div>
      </>)}
    </div>
  </aside>
  );
};

const menuItem = {
  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 9px',
  border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer',
  textAlign: 'left', fontSize: 13, color: 'var(--text)',
};

// ── Topbar：麵包屑可點擊導覽 ──
const Topbar = ({ crumbs = [], actions, tabs, activeTab, onTab }) => (
  <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elev)', flexShrink: 0 }}>
    <div className="topbar-row" style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', minHeight: 46, gap: 12, flexWrap: 'wrap', rowGap: 8 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, minWidth: 140 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon.ChevronRight size={12}/>}
            <span onClick={c.onClick} style={{
              color: i === crumbs.length - 1 ? 'var(--text)' : 'var(--text-2)',
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              fontSize: i === crumbs.length - 1 ? 15 : 13,
              cursor: c.onClick ? 'pointer' : 'default', whiteSpace: 'nowrap',
            }}>{c.label != null ? c.label : c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {actions}
      </div>
    </div>
    {tabs && (
      <div className="topbar-tabs" style={{ display: 'flex', gap: 2, padding: '0 16px', minHeight: 38, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTab?.(t.id)} style={{
            padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${activeTab === t.id ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === t.id ? 'var(--text)' : 'var(--text-2)',
            fontSize: 13, fontWeight: activeTab === t.id ? 500 : 400, cursor: 'pointer', marginBottom: -1,
          }}>
            {t.icon}{t.label}
            {t.count != null && (
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ── 共用小元件 ──
const PageHead = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px 14px' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h1>
      {subtitle && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>{subtitle}</div>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
  </div>
);

const ToolBar = ({ children, right }) => (
  <div className="toolbar-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>{children}</div>
    {right && <div style={{ display: 'flex', gap: 6 }}>{right}</div>}
  </div>
);

const SearchBox = ({ value, onChange, placeholder, width = 240 }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6, width, height: 28, padding: '0 8px',
    border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-elev)',
  }}>
    <Icon.Search size={13}/>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, background: 'transparent', color: 'var(--text)' }}/>
  </div>
);

const KPI = ({ label, value, hint, accent }) => (
  <div className="card kpi-card" style={{ padding: '13px 15px', minWidth: 0, flex: 1 }}>
    <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 3, color: accent || 'var(--text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
    {hint && <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-3)' }}>{hint}</div>}
  </div>
);

const Avatar = ({ name, size = 24 }) => {
  const palette = [
    ['oklch(90% 0.05 30)','oklch(40% 0.12 30)'], ['oklch(90% 0.05 180)','oklch(40% 0.12 180)'],
    ['oklch(90% 0.05 280)','oklch(40% 0.12 280)'], ['oklch(92% 0.05 130)','oklch(40% 0.12 130)'],
    ['oklch(90% 0.05 60)','oklch(40% 0.12 60)'], ['oklch(90% 0.05 340)','oklch(40% 0.12 340)'],
  ];
  const i = (name?.charCodeAt(0) || 0) % palette.length;
  const [bg, fg] = palette[i];
  return <span className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}>{(name||'?').slice(0,1)}</span>;
};

const StatusChip = ({ status }) => {
  const map = { '上課中':'success', '招生中':'info', '準備開課':'warn', '停課':'danger', '已結案':'', '草稿':'warn' };
  const cls = map[status] ?? '';
  return <span className={`chip ${cls}`}>{cls === 'success' && <span className="dot"/>}{status}</span>;
};

// 半圓環形進度（出席率）
const Donut = ({ value, size = 64, stroke = 7, color = 'var(--accent)' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (value || 0));
  return (
    <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-active)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .4s ease' }}/>
    </svg>
  );
};

// 簡單橫條（分佈）
const StackBar = ({ segments, height = 8 }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div style={{ display: 'flex', height, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-active)' }}>
      {segments.filter(s => s.value > 0).map((s, i) => (
        <div key={i} title={`${s.label} ${s.value}`} style={{ width: `${s.value/total*100}%`, background: s.color }}/>
      ))}
    </div>
  );
};

// 狀態色→CSS 變數
const statusVar = (color) => ({
  success: 'var(--success)', warn: 'var(--warning)', danger: 'var(--danger)',
  info: 'var(--info)', purple: 'var(--purple)',
}[color] || 'var(--text-3)');
const statusTextVar = (color) => ({
  success: 'var(--success-text)', warn: 'var(--warning-text)', danger: 'var(--danger-text)',
  info: 'var(--info-text)', purple: 'var(--purple-text)',
}[color] || 'var(--text-3)');
const statusSubtleVar = (color) => ({
  success: 'var(--success-subtle)', warn: 'var(--warning-subtle)', danger: 'var(--danger-subtle)',
  info: 'var(--info-subtle)', purple: 'var(--purple-subtle)',
}[color] || 'var(--bg-subtle)');

// 簡易 Modal
const Modal = ({ title, subtitle, onClose, children, footer, width = 560 }) => (
  <div onClick={onClose} className="modal-overlay" style={{
    position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.32)', zIndex: 1000,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 20px',
  }}>
    <div onClick={e => e.stopPropagation()} className="card" style={{
      width, maxWidth: '100%', maxHeight: '84vh', boxShadow: 'var(--shadow-lg)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{subtitle}</div>}
        </div>
        <button className="btn icon sm ghost" onClick={onClose}><Icon.X size={15}/></button>
      </div>
      <div className="thin-scroll" style={{ padding: 20, overflow: 'auto', flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-subtle)' }}>{footer}</div>}
    </div>
  </div>
);

// Toast
const Toast = ({ msg }) => msg ? (
  <div className="toast-pop" style={{
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1100,
    background: 'var(--text)', color: 'var(--text-invert)', padding: '9px 16px',
    borderRadius: 999, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)',
    display: 'flex', alignItems: 'center', gap: 8,
  }}><Icon.Check size={14}/>{msg}</div>
) : null;

// 課程狀態：停課為手動設定，其餘依今天與起訖日自動判定
// 課程狀態：停課為手動旗標；其餘依今天與「招生／開課」日期自動判定
const deriveCourseStatus = (c, suspendedSet) => {
  if (suspendedSet && suspendedSet.has(c.id)) return '停課';
  const today = new Date().toISOString().slice(0, 10);
  if (c.endDate && today > c.endDate) return '已結案';
  if (c.startDate && today >= c.startDate) return '上課中';
  // 招生已截止但尚未開課 → 準備開課
  if (c.recruitEnd && today > c.recruitEnd && (!c.startDate || today < c.startDate)) return '準備開課';
  return '招生中';
};
// 距開課天數（尚未開課才有值；今天=0）
const daysToStart = (c) => {
  if (!c || !c.startDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(c.startDate);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const diff = Math.round((d - today) / 86400000);
  return diff >= 0 ? diff : null;
};

Object.assign(window, {
  Sidebar, Topbar, PageHead, ToolBar, SearchBox, KPI, Avatar, StatusChip, deriveCourseStatus, daysToStart,
  Donut, StackBar, statusVar, statusTextVar, statusSubtleVar, Modal, Toast,
});
