// ─────────────────────────────────────────────────────────────────────────────
// 帳號權限管理（僅 superuser 可進）
//   操作：新增 / 編輯 / 停用·啟用 / 重設密碼 / 刪除
//   安全規則：至少保留一個啟用中的 superuser；不可停用/降權/刪除「最後一個 superuser」；
//             superuser 不可停用/刪除自己；新建帳號預設為「課務人員」。
// ─────────────────────────────────────────────────────────────────────────────

const roleChip = (role) => role === 'superuser'
  ? <span className="chip" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}><Icon.Shield size={11}/> 系統管理員</span>
  : <span className="chip outline"><Icon.User size={11}/> 課務人員</span>;

// 表單欄位（本檔自帶，避免依賴他檔 babel 作用域的同名元件）
const Field = ({ label, hint, children }) => (
  <div>
    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6, fontSize: 11 }}>{hint}</span>}</div>
    {children}
  </div>
);

// 新增 / 編輯帳號表單
const AccountFormModal = ({ mode, user, onClose, onSave }) => {
  const isEdit = mode === 'edit';
  const [v, setV] = React.useState(() => user
    ? { ...user }
    : { name: '', email: '', password: '', role: 'staff', active: true });
  const [err, setErr] = React.useState({});
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  const lockRole = isEdit && user.role === 'superuser' && window.DATA.isLastActiveSuperuser(user.id);

  const validate = () => {
    const e = {};
    if (!v.name.trim()) e.name = '請輸入姓名';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) e.email = '請輸入有效 Email';
    else {
      const dup = window.DATA.loadUsers().find((u) => u.email.toLowerCase() === v.email.trim().toLowerCase() && (!isEdit || u.id !== user.id));
      if (dup) e.email = '此 Email 已被使用';
    }
    if (!isEdit && (!v.password || v.password.length < 6)) e.password = '初始密碼至少 6 碼';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const save = () => { if (validate()) onSave({ ...v, name: v.name.trim(), email: v.email.trim() }); };

  const fieldErr = (k) => err[k] ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px var(--danger-subtle)' } : {};

  return (
    <Modal title={isEdit ? '編輯帳號' : '新增帳號'} subtitle={isEdit ? user.email : '建立一個新的系統使用者'} onClose={onClose} width={480}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={save}><Icon.Check size={13}/> {isEdit ? '儲存變更' : '建立帳號'}</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="姓名">
          <input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="王小明" style={fieldErr('name')}/>
          {err.name && <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4 }}>{err.name}</div>}
        </Field>
        <Field label="Email（即登入帳號）">
          <input className="input" type="email" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="name@hbr.tw" style={fieldErr('email')}/>
          {err.email && <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4 }}>{err.email}</div>}
        </Field>
        {!isEdit && (
          <Field label="初始密碼" hint="使用者首次登入用，至少 6 碼">
            <input className="input" value={v.password} onChange={(e) => set('password', e.target.value)} placeholder="至少 6 碼" style={fieldErr('password')}/>
            {err.password && <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4 }}>{err.password}</div>}
          </Field>
        )}
        <Field label="角色權限">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(window.DATA.ROLES || []).map((r) => {
              const on = v.role === r.id;
              const disabled = lockRole && r.id !== 'superuser';
              return (
                <button key={r.id} type="button" disabled={disabled} onClick={() => set('role', r.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)', opacity: disabled ? 0.5 : 1,
                }}>
                  <span style={{ marginTop: 1, color: on ? 'var(--accent-text)' : 'var(--text-3)', display: 'flex' }}>{r.id === 'superuser' ? <Icon.Shield size={16}/> : <Icon.User size={16}/>}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: on ? 'var(--accent-text)' : 'var(--text)' }}>{r.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{r.desc}</div>
                  </div>
                  {on && <span style={{ color: 'var(--accent-text)' }}><Icon.Check size={15}/></span>}
                </button>
              );
            })}
          </div>
          {lockRole && <div style={{ fontSize: 11, color: 'var(--warning-text)', marginTop: 6, display: 'flex', gap: 5, alignItems: 'center' }}><Icon.Info size={12}/> 這是最後一個系統管理員，無法降權。</div>}
        </Field>
        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={v.active} onChange={(e) => set('active', e.target.checked)}/> 啟用此帳號（停用後無法登入）
          </label>
        )}
      </div>
    </Modal>
  );
};

// 重設密碼
const ResetPasswordModal = ({ user, onClose, onSave }) => {
  const [pw, setPw] = React.useState('');
  const valid = pw.length >= 6;
  return (
    <Modal title="重設密碼" subtitle={`${user.name} · ${user.email}`} onClose={onClose} width={420}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }} onClick={() => onSave(pw)}><Icon.Key size={13}/> 設定新密碼</button></>}>
      <Field label="新密碼" hint="至少 6 碼；使用者下次以此密碼登入">
        <input className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="輸入新密碼"/>
      </Field>
    </Modal>
  );
};

const DeleteAccountConfirm = ({ user, onClose, onConfirm }) => (
  <Modal title="刪除帳號" onClose={onClose} width={400}
    footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={onConfirm}><Icon.Trash size={13}/> 確認刪除</button></>}>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>確定要刪除 <b>{user.name}</b>（{user.email}）的帳號嗎？此動作無法復原，該使用者將無法再登入。</p>
  </Modal>
);

const AccountsModule = ({ currentUser, toast }) => {
  const [users, setUsers] = React.useState(() => window.DATA.loadUsers());
  const [q, setQ] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('全部');
  const [modal, setModal] = React.useState(null);

  const persist = (next) => { setUsers(next); window.DATA.saveUsers(next); };
  const refresh = () => setUsers(window.DATA.loadUsers().slice());

  const counts = {
    全部: users.length,
    superuser: users.filter((u) => u.role === 'superuser').length,
    staff: users.filter((u) => u.role === 'staff').length,
  };
  const list = users.filter((u) =>
    (roleFilter === '全部' || u.role === roleFilter) &&
    (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  );

  const addUser = (v) => {
    const next = [{ ...v, id: window.DATA.nextUserId(users), createdAt: new Date().toISOString().slice(0, 10) }, ...users];
    persist(next); setModal(null); toast('已新增帳號 ' + v.name);
  };
  const editUser = (v) => {
    // 安全：若把最後一個 superuser 降權或停用 → 阻擋
    if (v.role !== 'superuser' && modal.user.role === 'superuser' && window.DATA.isLastActiveSuperuser(modal.user.id)) { toast('無法降權：至少需保留一個系統管理員'); return; }
    if (!v.active && v.role === 'superuser' && window.DATA.isLastActiveSuperuser(modal.user.id)) { toast('無法停用：至少需保留一個啟用中的系統管理員'); return; }
    if (!v.active && v.id === currentUser.id) { toast('無法停用自己的帳號'); return; }
    persist(users.map((u) => u.id === v.id ? { ...v } : u)); setModal(null); toast('已儲存帳號變更');
  };
  const toggleActive = (u) => {
    if (u.active && u.id === currentUser.id) { toast('無法停用自己的帳號'); return; }
    if (u.active && u.role === 'superuser' && window.DATA.isLastActiveSuperuser(u.id)) { toast('無法停用：至少需保留一個啟用中的系統管理員'); return; }
    persist(users.map((x) => x.id === u.id ? { ...x, active: !x.active } : x));
    toast(u.active ? '已停用 ' + u.name : '已啟用 ' + u.name);
  };
  const resetPw = (pw) => { persist(users.map((u) => u.id === modal.user.id ? { ...u, password: pw } : u)); setModal(null); toast('已重設 ' + modal.user.name + ' 的密碼'); };
  const delUser = (u) => {
    if (u.id === currentUser.id) { toast('無法刪除自己的帳號'); return; }
    if (u.role === 'superuser' && window.DATA.isLastActiveSuperuser(u.id)) { toast('無法刪除：至少需保留一個系統管理員'); return; }
    persist(users.filter((x) => x.id !== u.id)); setModal(null); toast('已刪除帳號 ' + u.name);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar crumbs={[{ label: '帳號權限管理' }]}
        tabs={[{ id: '全部', label: '全部', count: counts.全部 }, { id: 'superuser', label: '系統管理員', count: counts.superuser }, { id: 'staff', label: '課務人員', count: counts.staff }]}
        activeTab={roleFilter} onTab={setRoleFilter}
        actions={<button className="btn primary sm" onClick={() => setModal({ kind: 'new' })}><Icon.UserPlus size={14}/> 新增帳號</button>}/>

      <ToolBar right={<span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{q || roleFilter !== '全部' ? `${list.length} / ${users.length} 個帳號` : `${users.length} 個帳號`}</span>}>
        <SearchBox value={q} onChange={setQ} placeholder="姓名、Email…" width={240}/>
        {(q || roleFilter !== '全部') && <button className="btn sm ghost" onClick={() => { setQ(''); setRoleFilter('全部'); }} style={{ color: 'var(--text-3)' }}><Icon.X size={12}/> 清除篩選</button>}
      </ToolBar>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 20px 0', padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, lineHeight: 1.6 }}>
        <Icon.Shield size={15} style={{ flexShrink: 0 }}/>
        <span>此頁僅「系統管理員」可進入。系統至少保留一個啟用中的管理員，且無法停用或刪除自己的帳號。</span>
      </div>

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 760 }}>
          <thead><tr>
            <th style={{ paddingLeft: 20, minWidth: 160 }}>使用者</th>
            <th style={{ minWidth: 180 }}>Email（帳號）</th>
            <th style={{ width: 140 }}>角色權限</th>
            <th style={{ width: 90 }}>狀態</th>
            <th style={{ width: 110 }}>建立日期</th>
            <th style={{ width: 140, textAlign: 'right', paddingRight: 20 }}>操作</th>
          </tr></thead>
          <tbody>
            {list.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <tr key={u.id} className="cust-row">
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={u.name} size={28}/>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                      {isSelf && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'var(--bg-active)', color: 'var(--text-3)' }}>你</span>}
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{u.email}</td>
                  <td>{roleChip(u.role)}</td>
                  <td>{u.active ? <span className="chip success"><span className="dot"/>啟用</span> : <span className="chip" style={{ color: 'var(--text-muted)' }}>停用</span>}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{u.createdAt}</td>
                  <td style={{ paddingRight: 20 }}>
                    <div className="row-actions" style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <button className="btn icon sm ghost" title="編輯" onClick={() => setModal({ kind: 'edit', user: u })}><Icon.Edit size={14}/></button>
                      <button className="btn icon sm ghost" title="重設密碼" onClick={() => setModal({ kind: 'reset', user: u })}><Icon.Key size={14}/></button>
                      <button className="btn icon sm ghost" title={u.active ? '停用' : '啟用'} onClick={() => toggleActive(u)}><Icon.Lock size={14}/></button>
                      <button className="btn icon sm ghost" title="刪除" onClick={() => setModal({ kind: 'delete', user: u })} style={{ color: 'var(--danger-text)' }}><Icon.Trash size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && (
          <div style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>沒有符合條件的帳號</div>
        )}
      </div>

      {modal?.kind === 'new' && <AccountFormModal mode="new" onClose={() => setModal(null)} onSave={addUser}/>}
      {modal?.kind === 'edit' && <AccountFormModal mode="edit" user={modal.user} onClose={() => setModal(null)} onSave={editUser}/>}
      {modal?.kind === 'reset' && <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} onSave={resetPw}/>}
      {modal?.kind === 'delete' && <DeleteAccountConfirm user={modal.user} onClose={() => setModal(null)} onConfirm={() => delUser(modal.user)}/>}
    </div>
  );
};

window.AccountsModule = AccountsModule;
