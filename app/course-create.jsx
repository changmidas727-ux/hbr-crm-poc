// ─────────────────────────────────────────────────────────────────────────────
// 建立／複製課程：三步驟精靈
// ① 基本資訊 → ② 課程場次 → ③ 成本結構（學員不在此編輯，建課後於課程管理以後台訂單匯入）
// ─────────────────────────────────────────────────────────────────────────────

// 學員訂單編輯器：每位學員＝一筆訂單，加總即課程營收
//   importOnly：僅系統匯入（隱藏手動建立），供課程管理「新增學員」複用
const StudentOrdersEditor = ({ students, setStudents, importOnly }) => {
  const { BACKEND_ORDERS } = window.DATA;
  const [tab, setTab] = React.useState('import');
  const [productCode, setProductCode] = React.useState('');
  const [imported, setImported] = React.useState(() => {
    const names = new Set((students || []).map((s) => s.src));
    return new Set(BACKEND_ORDERS.filter((p) => names.has(p.product)).map((p) => p.code));
  });
  const [manual, setManual] = React.useState({ name: '', company: '', amount: '' });
  const product = BACKEND_ORDERS.find((p) => p.code === productCode);
  const total = students.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const importOrders = () => {
    if (!product) return;
    setStudents([...students, ...product.orders.map((o) => ({ ...o, src: product.product }))]);
    setImported(new Set([...imported, product.code]));
    setProductCode('');
  };
  const addManual = () => {
    if (!manual.name.trim() || !manual.amount) return;
    setStudents([...students, { name: manual.name.trim(), company: manual.company.trim(), amount: Number(manual.amount), src: '手動建立' }]);
    setManual({ name: '', company: '', amount: '' });
  };
  const removeAt = (i) => setStudents(students.filter((_, x) => x !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 加入方式（importOnly 時隱藏，僅系統匯入） */}
      {!importOnly &&
      <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8, alignSelf: 'flex-start' }}>
        {[['import', '系統匯入'], ['manual', '手動建立']].map(([id, label]) =>
        <button key={id} onClick={() => setTab(id)} style={{
          padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
          background: tab === id ? 'var(--bg-elev)' : 'transparent', boxShadow: tab === id ? 'var(--shadow-xs)' : 'none',
          color: tab === id ? 'var(--text)' : 'var(--text-3)', fontWeight: tab === id ? 600 : 400
        }}>{label}</button>
        )}
      </div>
      }

      {importOnly || tab === 'import' ?
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>從後台搜尋商品（＝課程），帶入該商品的全部訂購人與訂單金額。</div>
          <select className="input" value={productCode} onChange={(e) => setProductCode(e.target.value)}>
            <option value="">選擇後台商品…</option>
            {BACKEND_ORDERS.map((p) =>
          <option key={p.code} value={p.code} disabled={imported.has(p.code)}>
                {p.product}（{p.orders.length} 筆訂單）{imported.has(p.code) ? ' · 已匯入' : ''}
              </option>
          )}
          </select>
          {product &&
        <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>共 {product.orders.length} 筆訂單 · 合計 {fmtMoney(product.orders.reduce((s, o) => s + o.amount, 0))}</span>
                <button className="btn primary sm" onClick={importOrders}><Icon.Download size={12} /> 匯入這 {product.orders.length} 筆</button>
              </div>
              <div className="thin-scroll" style={{ maxHeight: 150, overflow: 'auto' }}>
                <table className="tbl" style={{ fontSize: 12 }}>
                  <tbody>
                    {product.orders.map((o, i) =>
                <tr key={i}>
                        <td style={{ paddingLeft: 12 }}>{o.name}</td>
                        <td style={{ color: 'var(--text-3)' }}>{o.company}</td>
                        <td style={{ textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(o.amount)}</td>
                      </tr>
                )}
                  </tbody>
                </table>
              </div>
            </div>
        }
        </div> :

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1.2 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>學員姓名 *</div>
            <input className="input" placeholder="王小明" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
          </div>
          <div style={{ flex: 1.2 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>公司</div>
            <input className="input" placeholder="（選填）" value={manual.company} onChange={(e) => setManual({ ...manual, company: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>訂單金額 *</div>
            <input className="input" type="number" min="0" step="1000" placeholder="168000" value={manual.amount}
          onChange={(e) => setManual({ ...manual, amount: e.target.value })}
          onKeyDown={(e) => {if (e.key === 'Enter') addManual();}} />
          </div>
          <button className="btn" disabled={!manual.name.trim() || !manual.amount} style={{ opacity: manual.name.trim() && manual.amount ? 1 : 0.5 }} onClick={addManual}><Icon.Plus size={13} /> 加入</button>
        </div>
      }

      {/* 已加入清單 + 營收加總 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {students.length === 0 ?
        <div style={{ padding: '18px 14px', fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>尚未加入任何學員訂單 — 營收將為 NT$ 0，也可先建立課程、之後再匯入</div> :

        <div className="thin-scroll" style={{ maxHeight: 170, overflow: 'auto' }}>
            <table className="tbl" style={{ fontSize: 12.5 }}>
              <thead><tr>
                <th style={{ paddingLeft: 12 }}>學員</th><th>來源</th><th style={{ textAlign: 'right' }}>訂單金額</th><th style={{ width: 36 }} />
              </tr></thead>
              <tbody>
                {students.map((s, i) =>
              <tr key={i}>
                    <td style={{ paddingLeft: 12 }}>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      {s.company && <span style={{ color: 'var(--text-3)', marginLeft: 6, fontSize: 11.5 }}>{s.company}</span>}
                    </td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s.src}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.amount)}</td>
                    <td style={{ textAlign: 'right', paddingRight: 8 }}>
                      <button className="btn icon sm ghost" title="移除" style={{ color: 'var(--danger-text)' }} onClick={() => removeAt(i)}><Icon.X size={13} /></button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
        <div style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', background: 'var(--bg-subtle)', borderTop: students.length ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{students.length} 位學員 · {students.length} 筆訂單</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>營收合計　{fmtMoney(total)}</span>
        </div>
      </div>
    </div>);

};

// ── 建立／複製／編輯課程（四步驟）──
const NewCourseModal = ({ courses = [], initial = null, mode, onClose, onSave }) => {
  const effMode = mode || (initial ? 'copy' : 'new');
  const isEdit = effMode === 'edit';
  const isCopy = effMode === 'copy';
  const suggestId = () => {
    if (!initial) return '';
    let n = 2,id = initial.id + '-' + n;
    while (courses.some((c) => c.id === id)) {n++;id = initial.id + '-' + n;}
    return id;
  };
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState(() => initial ?
  { id: isCopy ? suggestId() : initial.id, name: initial.name + (isCopy ? '（複本）' : ''), type: window.DATA.categoryOf(initial) || window.DATA.COURSE_CATEGORIES[0], recruitStart: initial.recruitStart || '', recruitEnd: initial.recruitEnd || '', startDate: initial.startDate || '', endDate: initial.endDate || '', statusMode: 'auto', seminarCount: initial.seminarCount != null ? initial.seminarCount : 4, recruitSources: Array.isArray(initial.recruitSources) ? initial.recruitSources : [] } :
  { id: '', name: '', type: window.DATA.COURSE_CATEGORIES[0], recruitStart: '', recruitEnd: '', startDate: '', endDate: '', statusMode: 'auto', seminarCount: 4, recruitSources: [] });
  // 狀態由系統依招生/開課日期自動判定（未到開課日٬招生中；開課期間٬上課中；結課後٬已結案）；停課為獨立手動旗標
  // 帶入原課程的場次與個案：複製清空日期、編輯保留日期
  const [sessions, setSessions] = React.useState(() => {
    const src = initial && (initial.sessionsList || window.DATA.sessionsOf(initial.id));
    if (!Array.isArray(src) || !src.length) return [];
    return src.map((s) => ({
      date: isCopy ? '' : s.date || '', time: s.time || '14:00–17:00',
      cases: Array.isArray(s.cases) && s.cases.length ?
      s.cases.map((c) => ({ title: c.title || '', subtitle: c.subtitle || '', facilitator: c.facilitator || '', org: c.org || '' })) :
      [{ title: s.topic || '', subtitle: '', facilitator: s.lecturer || '', org: '' }]
    }));
  });
  const [students, setStudents] = React.useState(() => isEdit && initial && Array.isArray(initial.orders) ? initial.orders.map((o) => ({ ...o })) : []); // 保留編輯模式原始訂單（精靈內不再編輯）
  const [costs, setCosts] = React.useState(() => initial ? { ...(initial.costs || {}) } : {});
  const [attempted, setAttempted] = React.useState(false); // 按過下一步才顯示必填提示
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ordersRevenue = students.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  // 新建課程尚無學員訂單→營收 0；編輯保留原營收（訂單改由課程管理「新增學員」匯入）
  const revenue = isEdit && initial ? initial.revenue || 0 : 0;
  const dupId = form.id.trim() && courses.some((c) => c.id === form.id.trim() && !(isEdit && initial && c.id === initial.id));
  // 必填驗證：代碼、名稱、起訖日期（狀態自動判定需要日期）
  const errors = {
    id: !form.id.trim() ? '請填寫課程代碼' : dupId ? '此代碼已存在' : null,
    name: !form.name.trim() ? '請填寫課程名稱' : null,
    startDate: !form.startDate ? '請選擇開始日期' : null,
    endDate: !form.endDate ? '請選擇結束日期' : form.startDate && form.endDate < form.startDate ? '結束日期需晚於開始日期' : null
  };
  const basicsValid = !errors.id && !errors.name && !errors.startDate && !errors.endDate;
  const showErr = (k) => attempted || k === 'id' && dupId ? errors[k] : null;
  const errStyle = (k) => showErr(k) ? { borderColor: 'var(--danger)' } : null;
  const ErrMsg = ({ k }) => showErr(k) ? <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 3 }}>{errors[k]}</div> : null;

  const next = () => {
    if (step === 1 && !basicsValid) {setAttempted(true);return;}
    setStep(step + 1);
  };

  const sessionList = buildSessionList(sessions);
  const isICL = form.type === '個案共學會';
  // 學員/訂單/營收：精靈不再編輯——新建一律為空（0，毛利＝−成本）；編輯原樣保留既有值
  const save = () => onSave({
    id: form.id.trim(), name: form.name.trim(), type: form.type, program: '', term: '',
    startDate: form.startDate, endDate: form.endDate,
    recruitStart: form.recruitStart || '', recruitEnd: form.recruitEnd || '',
    suspend: form.statusMode === 'suspend',
    seminarCount: isICL ? Number(form.seminarCount) || 0 : 0,
    recruitSources: form.recruitSources || [],
    sessions: sessionList.length, sessionsList: sessionList,
    students: isEdit && initial ? initial.students || 0 : 0,
    orders: isEdit && initial ? initial.orders || [] : [],
    revenue: isEdit && initial ? initial.revenue || 0 : 0,
    costs: { ...costs }
  }, isEdit && initial ? initial.id : null);

  return (
    <Modal title={isEdit ? '編輯課程' : initial ? '複製課程' : '新增課程'}
    subtitle={isEdit ? initial.id + ' · ' + initial.name + '｜調整基本資訊與場次' : initial ? '以「' + initial.id + ' · ' + initial.name + '」為基底，請確認並調整各欄位' : '基本資訊 → 課程場次'}
    onClose={onClose} width={660}
    footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <div style={{ flex: 1 }}></div>
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>上一步</button>}
        {step < 2 ?
      <button className="btn primary" onClick={next}>下一步</button> :
      <button className="btn primary" onClick={save}><Icon.Check size={13} /> {isEdit ? '儲存變更' : '建立課程'}</button>}
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Stepper step={step} steps={['基本資訊', '課程場次']} />

        {step === 1 &&
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {attempted && !basicsValid &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--danger-subtle)', color: 'var(--danger-text)', fontSize: 12 }}>
                <Icon.Info size={13} /> 請完成標示 * 的必填欄位後再繼續下一步。
              </div>
          }
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>課程代碼 *</div>
                <input className="input" placeholder="ICL-17" value={form.id} onChange={(e) => set('id', e.target.value)} style={errStyle('id')} />
                <ErrMsg k="id" />
                {isCopy && !showErr('id') && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>已自動帶入新代碼，可自行修改</div>}
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>課程名稱 *</div>
                <input className="input" placeholder="個案共學會・第17期" value={form.name} onChange={(e) => set('name', e.target.value)} style={errStyle('name')} />
                <ErrMsg k="name" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>類別 *</div>
                <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {(window.DATA.COURSE_CATEGORIES || []).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>招生期間</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>招生開始日</div>
                  <input className="input" type="date" value={form.recruitStart} onChange={(e) => set('recruitStart', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>招生截止日</div>
                  <input className="input" type="date" value={form.recruitEnd} onChange={(e) => set('recruitEnd', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>開課期間 *</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>開課日期 *</div>
                  <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} style={errStyle('startDate')} />
                  <ErrMsg k="startDate" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>結課日期 *</div>
                  <input className="input" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} style={errStyle('endDate')} />
                  <ErrMsg k="endDate" />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>狀態由系統依今日自動判定：未到開課日٬招生中·開課期間٬上課中·結課後٬已結案。需延長請於「編輯課程」修改日期。</div>
            </div>

            {/* 招生追蹤設定：個案共學會才需說明會場次；完成後自動帶入「期數成效管理」 */}
            <div style={{ marginTop: 2, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                <Icon.TrendingUp size={13} /> 招生追蹤設定
                <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 11 }}>建課時一次設定，自動帶入「期數成效管理」</span>
              </div>
              {isICL ?
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)', width: 92, flexShrink: 0 }}>說明會場次</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden', background: 'var(--bg-elev)' }}>
                    <button type="button" className="btn icon sm ghost" style={{ borderRadius: 0 }} disabled={Number(form.seminarCount) <= 1} onClick={() => set('seminarCount', Math.max(1, Number(form.seminarCount) - 1))}><Icon.Minus size={14} /></button>
                    <span style={{ minWidth: 38, textAlign: 'center', fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{form.seminarCount}</span>
                    <button type="button" className="btn icon sm ghost" style={{ borderRadius: 0 }} disabled={Number(form.seminarCount) >= 8} onClick={() => set('seminarCount', Math.min(8, Number(form.seminarCount) + 1))}><Icon.Plus size={14} /></button>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>每場獨立計算成效</span>
                </div> :

            <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon.Info size={12} /> 非個案共學會類別不設說明會場次（該分頁不顯示）。
                </div>
            }
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Icon.Info size={12} style={{ flexShrink: 0, marginTop: 1 }} /> 招生名單（潛客／舊客）於建課後在「期數成效管理 › 當期報名追蹤」匯入與管理。
              </div>
            </div>
          </div>
        }

        {step === 2 &&
        <SessionPlanEditor sessions={sessions} setSessions={setSessions} category={form.type} />
        }
      </div>
    </Modal>);

};

Object.assign(window, { NewCourseModal, StudentOrdersEditor });