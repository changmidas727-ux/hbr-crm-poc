// ─────────────────────────────────────────────────────────────────────────────
// 登入畫面（前端 mock 驗證）+ 側欄使用者選單（登出）
//   驗證走 window.DATA.authenticate；工作階段走 getSession/setSession/clearSession
//   「記住我」勾選→localStorage（跨關閉保留），否則 sessionStorage（關閉即失效）
// ─────────────────────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = (e) => {
    e && e.preventDefault();
    setError('');
    const res = window.DATA.authenticate(email, password);
    if (!res.ok) {
      setError(res.reason === 'disabled' ? '此帳號已停用，請聯絡系統管理員。' :
      res.reason === 'notfound' ? '查無此帳號，請確認 Email。' :
      '密碼錯誤，請再試一次。');
      return;
    }
    setBusy(true);
    window.DATA.setSession(res.user.id, remember);
    setTimeout(() => onLogin(res.user), 250);
  };

  const fill = (em, pw) => {setEmail(em);setPassword(pw);setError('');};

  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '1fr', placeItems: 'center', background: 'var(--bg)', overflow: 'auto' }}>
      <div style={{ width: 380, maxWidth: '92vw', padding: '32px 0' }}>
        {/* 品牌 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>課</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>HBR· 課務系統</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>請登入以繼續</div>
          </div>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-elev)' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Email 帳號</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><Icon.Mail size={15} /></span>
              <input className="input" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hbr.tw" style={{ width: '100%', height: 38, paddingLeft: 32 }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>密碼</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}><Icon.Lock size={15} /></span>
              <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="輸入密碼" style={{ width: '100%', height: 38, paddingLeft: 32, paddingRight: 38 }} />
              <button type="button" onClick={() => setShow((s) => !s)} title={show ? '隱藏密碼' : '顯示密碼'} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', padding: 4, display: 'flex' }}>{show ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}</button>
            </div>
          </div>

          {error &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', borderRadius: 7, background: 'var(--danger-subtle)', color: 'var(--danger-text)', fontSize: 12.5 }}>
              <Icon.Info size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          }

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 記住我（在此裝置保持登入）
          </label>

          <button type="submit" className="btn primary" disabled={busy || !email || !password} style={{ height: 40, justifyContent: 'center', opacity: busy || !email || !password ? 0.6 : 1 }}>
            {busy ? '登入中…' : <><Icon.LogOut size={14} style={{ transform: 'rotate(180deg)' }} /> 登入</>}
          </button>
        </form>

        {/* 示範帳號提示 */}
        <div className="card" style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Icon.Info size={13} /> 示範帳號（點擊一鍵帶入）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['admin@hbr.tw', 'admin123', '系統管理員', 'superuser'], ['chen@hbr.tw', 'staff123', '課務人員', 'staff']].map(([em, pw, label, role]) =>
            <button key={em} type="button" onClick={() => fill(em, pw)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-elev)', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ color: role === 'superuser' ? 'var(--accent-text)' : 'var(--text-3)', display: 'flex' }}>{role === 'superuser' ? <Icon.Shield size={15} /> : <Icon.User size={15} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{em}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label} · 密碼 {pw}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent-text)' }}>帶入</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 18 }}>原型為前端示範驗證；正式版將串接後端帳號系統。</div>
      </div>
    </div>);

};

window.LoginScreen = LoginScreen;