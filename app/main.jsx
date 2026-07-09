// ─────────────────────────────────────────────────────────────────────────────
// 主程式：路由 · 出缺勤狀態（持久化）· Tweaks 串接
// ─────────────────────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2f6fb3",
  "density": "標準",
  "custIdLabel": "會員編號"
}/*EDITMODE-END*/;

// hex → 衍生 accent 變數
function applyAccent(hex) {
  const r = document.documentElement.style;
  r.setProperty('--accent', hex);
  r.setProperty('--accent-hover', `color-mix(in oklab, ${hex}, black 14%)`);
  r.setProperty('--accent-text', `color-mix(in oklab, ${hex}, black 20%)`);
  r.setProperty('--accent-subtle', `color-mix(in oklab, ${hex}, white 88%)`);
  r.setProperty('--accent-border', `color-mix(in oklab, ${hex}, white 64%)`);
}

const App = () => {
  const { DATA } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [user, setUser] = React.useState(() => DATA.getSession());
  const [nav, setNav] = React.useState({ view: 'courses', courseId: null, focusSession: null });
  const [toastMsg, setToastMsg] = React.useState('');
  const [navTick, setNavTick] = React.useState(0);
  const toastTimer = React.useRef(null);

  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  };

  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  const density = t.density === '寬鬆' ? 'cozy' : t.density === '緊湊' ? 'compact' : 'regular';

  const goNav = (view) => { setNav({ view, courseId: null, focusSession: null }); setNavTick((n) => n + 1); };

  const onLogout = () => { DATA.clearSession(); setUser(null); setNav({ view: 'courses', courseId: null, focusSession: null }); };
  // 未登入 → 登入畫面；非 superuser 諌到 accounts 一律導回課程管理（雙重防護）
  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); setNav({ view: 'courses', courseId: null, focusSession: null }); }}/>;
  const isSuper = user.role === 'superuser';
  const activeView = (nav.view === 'accounts' && !isSuper) ? 'courses' : nav.view;

  return (
    <div data-density={density} className="screen" style={{ position: 'fixed', inset: 0 }}>
      <Sidebar active={activeView} onNav={goNav} user={user} onLogout={onLogout}/>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {activeView === 'courses'   && <CoursesModule nav={nav} setNav={setNav} toast={toast}/>}
        {activeView === 'performance' && <PerformanceModule key={navTick} toast={toast}/>}
        {activeView === 'prospects' && <ProspectsModule toast={toast} idLabel="潛客編號"/>}
        {activeView === 'customers' && <CustomersModule toast={toast} idLabel={t.custIdLabel || '會員編號'}/>}
        {activeView === 'accounts' && isSuper && <AccountsModule currentUser={user} toast={toast}/>}
      </main>

      <Toast msg={toastMsg}/>

      <TweaksPanel title="Tweaks · 課務 CRM">
        <TweakSection label="客戶管理"/>
        <TweakText label="編號欄位名稱" value={t.custIdLabel}
          onChange={(v) => setTweak('custIdLabel', v)}/>
        <TweakSection label="外觀"/>
        <TweakColor label="主色" value={t.accent}
          options={['#2f6fb3', '#1f8a5b', '#7a5ae0', '#c2643f']}
          onChange={(v) => setTweak('accent', v)}/>
        <TweakRadio label="密度" value={t.density}
          options={['寬鬆', '標準', '緊湊']}
          onChange={(v) => setTweak('density', v)}/>
        <TweakSection label="示範資料"/>
        <TweakButton label="重設示範資料" secondary onClick={() => {
          if (!window.confirm('將清除測試資料並回復為初始示範（課程/潛客/客戶/期數成效），確定？')) return;
          ['hbr_courses_v1', 'hbr_prospects_v1', 'hbr_customers_v2', 'hbr_perf_v2'].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
          location.reload();
        }}/>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
