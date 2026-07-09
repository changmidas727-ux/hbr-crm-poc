// ─────────────────────────────────────────────────────────────────────────────
// 客戶 — 表單 / 新增 / 修改 / 匯入（系統・手動）/ 批次修改 / 刪除
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ['學員', 'VIP'];
const ASSIGNEES = ['謝孟潔', '陳庭宇'];
const courseNames = () => (window.DATA.loadCourses() || []).map(c => c.name);

// 多選課程下拉
const CoursePicker = ({ value = [], onChange }) => {
  const [open, setOpen] = React.useState(false);
  const opts = courseNames();
  const toggle = (n) => onChange(value.includes(n) ? value.filter(x => x !== n) : [...value, n]);
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" className="input" onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', cursor: 'pointer', minHeight: 'var(--control-h)', height: 'auto', flexWrap: 'wrap', padding: '5px 10px' }}>
        {value.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>選擇課程…</span> :
          value.map(v => <span key={v} className="chip accent" style={{ height: 20 }}>{v}</span>)}
        <span style={{ flex: 1 }}/><Icon.ChevronDown size={13}/>
      </button>
      {open && (<>
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}/>
        <div className="card" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 41, boxShadow: 'var(--shadow-menu)', padding: 5, maxHeight: 200, overflow: 'auto' }}>
          {opts.map(n => {
            const on = value.includes(n);
            return (
              <button key={n} type="button" onClick={() => toggle(n)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', borderRadius: 6,
                border: 'none', background: on ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ width: 15, height: 15, borderRadius: 4, border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`, background: on ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', color: '#fff' }}>{on && <Icon.Check size={11}/>}</span>
                <span style={{ fontSize: 13 }}>{n}</span>
              </button>
            );
          })}
        </div>
      </>)}
    </div>
  );
};

// 共用：備註標籤 + 自由文字編輯器
//  - onChange(note, tags)：受控模式（內嵌表單，由外層按鈕儲存）
//  - onConfirm(note, tags) + onCancel：確認模式（列表彈窗／抽屜，附「確定」鈕）
const NoteEditor = ({ note = '', tags = [], pool = [], onChange, onConfirm, onCancel, autoFocus, compact, onDeletePool }) => {
  const [text, setText] = React.useState(note);
  const [sel, setSel] = React.useState(Array.isArray(tags) ? tags : []);
  const [adding, setAdding] = React.useState('');
  const taRef = React.useRef(null);
  React.useEffect(() => { if (autoFocus && taRef.current) taRef.current.focus(); }, [autoFocus]);
  const emit = (t, s) => { if (onChange) onChange(t, s); };
  const available = Array.from(new Set([...(window.DATA.NOTE_TAGS || []), ...pool, ...sel]));
  const toggle = (t) => { const s = sel.includes(t) ? sel.filter(x => x !== t) : [...sel, t]; setSel(s); emit(text, s); };
  const setTxt = (v) => { setText(v); emit(v, sel); };
  const addTag = () => { const v = adding.trim(); if (!v) return; const s = sel.includes(v) ? sel : [...sel, v]; setSel(s); setAdding(''); emit(text, s); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {available.map(t => {
          const on = sel.includes(t);
          const custom = !(window.DATA.NOTE_TAGS || []).includes(t);
          return (
            <button key={t} type="button" onClick={() => toggle(t)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
              fontSize: 12, fontWeight: on ? 600 : 400, lineHeight: 1.6,
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
              color: on ? 'var(--accent-text)' : 'var(--text-2)',
            }}>{on && <Icon.Check size={11}/>}{t}
              {custom && onDeletePool && !on && (
                <span title="從標籤池刪除（所有客戶一併移除）" onClick={(e) => { e.stopPropagation(); onDeletePool(t); }}
                  style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Icon.X size={11}/>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="input" value={adding} onChange={e => setAdding(e.target.value)} placeholder="自訂標籤…"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} style={{ flex: 1, height: 30, fontSize: 12.5 }}/>
        <button type="button" className="btn sm" disabled={!adding.trim()} style={{ opacity: adding.trim() ? 1 : 0.5 }} onClick={addTag}><Icon.Plus size={12}/> 加入標籤</button>
      </div>
      <textarea ref={taRef} value={text} onChange={e => setTxt(e.target.value)} placeholder="輸入備註文字…（選填）"
        rows={compact ? 2 : 3} style={{ width: '100%', fontSize: 12.5, lineHeight: 1.55, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elev)', resize: 'vertical', font: 'inherit', color: 'var(--text)', outline: 'none' }}/>
      {(onConfirm || onCancel) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {onCancel && <button type="button" className="btn sm" onClick={onCancel}>取消</button>}
          {onConfirm && <button type="button" className="btn primary sm" onClick={() => onConfirm(text.trim(), sel)}><Icon.Check size={13}/> 確定</button>}
        </div>
      )}
    </div>
  );
};

// 共用表單欄位
const CustomerForm = ({ value, onChange }) => {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="姓名"><input className="input" value={value.name} onChange={e => set('name', e.target.value)} placeholder="王小明"/></Field></div>
        <div style={{ flex: 1 }}><Field label="客戶類型"><select className="input" value={value.type} onChange={e => set('type', e.target.value)}>{TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="公司"><input className="input" value={value.company} onChange={e => set('company', e.target.value)} placeholder="○○股份有限公司"/></Field></div>
        <div style={{ flex: 1 }}><Field label="職稱"><input className="input" value={value.title} onChange={e => set('title', e.target.value)} placeholder="總經理"/></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Email"><input className="input" type="email" value={value.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com"/></Field></div>
        <div style={{ flex: 1 }}><Field label="電話"><input className="input" value={value.phone} onChange={e => set('phone', e.target.value)} placeholder="0912-345-678"/></Field></div>
      </div>
      <Field label="購買課程" hint="由後台系統依報名資料自動帶入，不可手動編輯">
        {(value.purchased && value.purchased.length) ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            {value.purchased.map(p => <span key={p} className="chip outline">{p}</span>)}
          </div>
        ) : (
          <div style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            尚無購買記錄 · 報名後由系統自動帶入
          </div>
        )}
      </Field>
      <Field label="備註" hint="可點選標籤快速標記，並可自訂標籤或自由填寫">
        <NoteEditor note={value.note || ''} tags={value.noteTags || []}
          onChange={(note, tags) => onChange({ ...value, note, noteTags: tags })}/>
      </Field>
    </div>
  );
};

const EMPTY_CUSTOMER = { name: '', type: '學員', company: '', title: '', email: '', phone: '', purchased: [], assignee: '謝孟潔', note: '', noteTags: [] };

const NewCustomerModal = ({ onClose, onSave }) => {
  const [v, setV] = React.useState(EMPTY_CUSTOMER);
  return (
    <Modal title="新增客戶" onClose={onClose} width={540}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => onSave(v)}><Icon.Check size={13}/> 建立客戶</button></>}>
      <CustomerForm value={v} onChange={setV}/>
    </Modal>
  );
};

const EditCustomerModal = ({ customer, onClose, onSave }) => {
  const [v, setV] = React.useState({ ...customer });
  return (
    <Modal title="修改客戶" subtitle={`${customer.id} · ${customer.name}`} onClose={onClose} width={540}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => onSave(v)}><Icon.Check size={13}/> 儲存變更</button></>}>
      <CustomerForm value={v} onChange={setV}/>
    </Modal>
  );
};

// ── 刪除確認 ──
const DeleteConfirm = ({ customer, onClose, onConfirm }) => (
  <Modal title="刪除客戶" onClose={onClose} width={400}
    footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={onConfirm}><Icon.Trash size={13}/> 確認刪除</button></>}>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
      確定要刪除 <b>{customer.name}</b>（{customer.company}）嗎？此動作無法復原。
    </p>
  </Modal>
);

// ── 匯入：系統匯入 / 手動匯入 ──
const ImportCustomerModal = ({ onClose, onImport }) => {
  const [mode, setMode] = React.useState('system');
  return (
    <Modal title="匯入客戶" subtitle="從後台系統匯入，或手動填寫批次新增" onClose={onClose} width={680}
      footer={null}>
      {/* 模式切換 */}
      <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8, marginBottom: 18 }}>
        {[['system', '系統匯入', <Icon.Zap size={13}/>], ['manual', '手動匯入', <Icon.Edit size={13}/>]].map(([id, label, ic]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: mode === id ? 'var(--bg-elev)' : 'transparent', boxShadow: mode === id ? 'var(--shadow-xs)' : 'none',
            color: mode === id ? 'var(--text)' : 'var(--text-3)', fontWeight: mode === id ? 600 : 400, fontSize: 13,
          }}>{ic}{label}</button>
        ))}
      </div>
      {mode === 'system' ? <SystemImport onClose={onClose} onImport={onImport}/> : <ManualImport onClose={onClose} onImport={onImport}/>}
    </Modal>
  );
};

// 系統匯入 — 保留彈性、標明待 RD 串接
const SystemImport = ({ onClose, onImport }) => {
  const [src, setSrc] = React.useState('後台會員系統');
  const [fetched, setFetched] = React.useState(false);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, marginBottom: 16 }}>
        <Icon.Info size={15}/><span>實際連線方式（API／DB）由 RD 後續串接；此處為示意流程，欄位與資料來源可彈性調整。</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="資料來源" hint="可由 RD 依實際後台系統擴充選項">
          <select className="input" value={src} onChange={e => { setSrc(e.target.value); setFetched(false); }}>
            <option>後台會員系統</option><option>報名系統</option><option>電子報名單</option><option>其他（自訂）</option>
          </select>
        </Field>
        <Field label="同步範圍">
          <select className="input"><option>全部客戶</option><option>近 30 天更新</option><option>指定條件…</option></select>
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setFetched(true)}><Icon.Repeat size={13}/> 測試連線並預覽</button>
          {fetched && <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--success-text)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Check size={13}/> 連線成功，讀取到 248 筆</span>}
        </div>
        {fetched && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>預覽（前 3 筆）· 欄位對應可由 RD 設定</div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead><tr><th style={{ paddingLeft: 12 }}>姓名</th><th>公司</th><th>類型</th><th>Email</th></tr></thead>
              <tbody>
                <tr><td style={{ paddingLeft: 12 }}>趙永誠</td><td>友達光電</td><td>學員</td><td>chao@auo.com</td></tr>
                <tr><td style={{ paddingLeft: 12 }}>孫雅婷</td><td>遠傳電信</td><td>學員</td><td>sun@fetnet.net</td></tr>
                <tr><td style={{ paddingLeft: 12 }}>錢柏均</td><td>緯創資通</td><td>VIP</td><td>chien@wistron.com</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!fetched} onClick={() => onImport('system', null)} style={{ opacity: fetched ? 1 : 0.5 }}><Icon.Download size={13}/> 匯入 248 筆</button>
      </div>
    </div>
  );
};

// 手動匯入 — 開欄位填寫（可多列）
const ManualImport = ({ onClose, onImport }) => {
  const blank = () => ({ name: '', company: '', title: '', type: '學員', email: '', phone: '' });
  const [rows, setRows] = React.useState([blank(), blank()]);
  const setCell = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const valid = rows.filter(r => r.name.trim());
  const cellStyle = { width: '100%', border: 'none', background: 'transparent', font: 'inherit', fontSize: 12, outline: 'none', color: 'var(--text)', padding: '0 4px', height: 30 };
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>逐列填寫客戶資料，按「新增一列」可繼續加入；空白列會自動略過。</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="thin-scroll" style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ fontSize: 12, minWidth: 620 }}>
            <thead><tr>
              <th style={{ paddingLeft: 12, width: 30 }}>#</th>
              <th style={{ minWidth: 90 }}>姓名 *</th><th style={{ minWidth: 110 }}>公司</th><th style={{ minWidth: 90 }}>職稱</th>
              <th style={{ minWidth: 78 }}>類型</th><th style={{ minWidth: 150 }}>Email</th><th style={{ minWidth: 110 }}>電話</th><th style={{ width: 34 }}/>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 12, color: 'var(--text-3)' }}>{i + 1}</td>
                  <td><input style={cellStyle} value={r.name} onChange={e => setCell(i, 'name', e.target.value)} placeholder="姓名"/></td>
                  <td><input style={cellStyle} value={r.company} onChange={e => setCell(i, 'company', e.target.value)} placeholder="公司"/></td>
                  <td><input style={cellStyle} value={r.title} onChange={e => setCell(i, 'title', e.target.value)} placeholder="職稱"/></td>
                  <td><select style={{ ...cellStyle, cursor: 'pointer' }} value={r.type} onChange={e => setCell(i, 'type', e.target.value)}>{TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></td>
                  <td><input style={cellStyle} value={r.email} onChange={e => setCell(i, 'email', e.target.value)} placeholder="email"/></td>
                  <td><input style={cellStyle} value={r.phone} onChange={e => setCell(i, 'phone', e.target.value)} placeholder="電話"/></td>
                  <td>{rows.length > 1 && <button className="btn icon sm ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Icon.X size={13}/></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--divider)' }}>
          <button className="btn sm ghost" onClick={() => setRows([...rows, blank()])}><Icon.Plus size={13}/> 新增一列</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>將匯入 {valid.length} 筆</span>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!valid.length} onClick={() => onImport('manual', valid)} style={{ opacity: valid.length ? 1 : 0.5 }}><Icon.Check size={13}/> 匯入 {valid.length} 筆</button>
      </div>
    </div>
  );
};

// ── 批次修改 ──
const BATCH_FIELDS = [
  { id: 'type', label: '客戶類型', kind: 'select', options: TYPE_OPTIONS },
  { id: 'assignee', label: '負責人', kind: 'select', options: ASSIGNEES },
  { id: 'lastContact', label: '最近聯繫日期', kind: 'date' },
];

const BatchEditModal = ({ count, onClose, onApply }) => {
  const [field, setField] = React.useState('type');
  const def = BATCH_FIELDS.find(f => f.id === field);
  const [val, setVal] = React.useState(TYPE_OPTIONS[0]);
  React.useEffect(() => {
    if (def.kind === 'select') setVal(def.options[0]);
    else if (def.kind === 'course') setVal([]);
    else setVal('');
  }, [field]);

  return (
    <Modal title="批次修改" subtitle={`將套用至已選取的 ${count} 位客戶`} onClose={onClose} width={480}
      footer={<><button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={def.kind === 'course' ? !val.length : !val} onClick={() => onApply(field, val)}><Icon.Check size={13}/> 套用至 {count} 位</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="要修改的欄位">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {BATCH_FIELDS.map(f => {
              const on = field === f.id;
              return (
                <button key={f.id} onClick={() => setField(f.id)} style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
                  color: on ? 'var(--accent-text)' : 'var(--text)', fontWeight: on ? 600 : 400,
                }}>{f.label}</button>
              );
            })}
          </div>
        </Field>
        <Field label="設定新值">
          {def.kind === 'select' && <select className="input" value={val} onChange={e => setVal(e.target.value)}>{def.options.map(o => <option key={o}>{o}</option>)}</select>}
          {def.kind === 'course' && <CoursePicker value={Array.isArray(val) ? val : []} onChange={setVal}/>}
          {def.kind === 'date' && <input className="input" type="date" value={val} onChange={e => setVal(e.target.value)}/>}
        </Field>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <Icon.Info size={14}/><span>此欄位將以新值覆蓋所選客戶的原值。</span>
        </div>
      </div>
    </Modal>
  );
};

// ── 期別歷程時間軸（客戶/潛客抽屜共用；掛 window 供潛客模組使用）──
const StatusTimeline = ({ refId, name }) => {
  const [showAll, setShowAll] = React.useState(false);
  const hist = React.useMemo(() => (window.DATA.statusHistoryFor ? window.DATA.statusHistoryFor({ refId, name }) : []), [refId, name]);
  const kc = (k) => k === '新潛客' ? 'accent' : k === '舊潛客' ? 'warn' : 'outline';
  if (!hist.length) return <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 0' }}>尚無期別追蹤紀錄</div>;
  const shown = showAll ? hist : hist.slice(0, 3);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {shown.map((h, i) => (
          <div key={h.courseId} style={{ display: 'flex', gap: 10, paddingBottom: i === shown.length - 1 ? 0 : 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: h.signup === '已報名' ? 'var(--success)' : 'var(--accent)', marginTop: 4 }}/>
              {i !== shown.length - 1 && <span style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 3 }}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{h.term}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                <span className={`chip ${kc(h.klass)}`} style={{ height: 18, fontSize: 11 }}>{h.klass}</span>
                <span className={`chip ${h.signup === '已報名' ? 'success' : ''}`} style={{ height: 18, fontSize: 11 }}>{h.signup}</span>
              </div>
              {h.note && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 5, lineHeight: 1.55, padding: '6px 9px', background: 'var(--bg-subtle)', borderRadius: 6 }}>{h.note}</div>}
            </div>
          </div>
        ))}
      </div>
      {hist.length > 3 && <button className="btn sm ghost" style={{ marginTop: 10, color: 'var(--text-3)' }} onClick={() => setShowAll((s) => !s)}>{showAll ? '收合' : `顯示更早的 ${hist.length - 3} 期紀錄`}</button>}
    </div>
  );
};
window.StatusTimeline = StatusTimeline;

// ── 客戶詳細抽屜（右側滑出）──
const CustomerDetailDrawer = ({ customer, onClose, onEdit, onExport, onSaveNote, onMarkContacted, onDeletePool, notePool = [], idLabel = '會員編號' }) => {
  const c = customer;
  // 購買課程依類別分組（個案共學會／實戰班／領導者俱樂部／其他）；超過 3 堂時區塊內部上下捲動
  const purchasedGroups = React.useMemo(() => {
    const all = window.DATA.loadCourses();
    const byName = new Map(all.map((x) => [x.name, window.DATA.categoryOf(x)]));
    const cats = window.DATA.COURSE_CATEGORIES || [];
    const order = [...cats, '其他'];
    const groups = {};
    (c.purchased || []).forEach((name) => {
      const cat = byName.get(name) || cats.find((t) => name.includes(t)) || '其他';
      (groups[cat] = groups[cat] || []).push(name);
    });
    return order.filter((k) => groups[k]).map((k) => [k, groups[k]]);
  }, [c.id, c.purchased]);
  const purchasedTotal = (c.purchased || []).length;
  const [purchTab, setPurchTab] = React.useState(0);
  React.useEffect(() => { setPurchTab(0); }, [c.id]);
  const activeIdx = Math.min(purchTab, Math.max(0, purchasedGroups.length - 1));
  const activeNames = (purchasedGroups[activeIdx] && purchasedGroups[activeIdx][1]) || [];
  // 進場改用 transition：基底即定位態，mount 後下一幀才切換，任何環境下最終都貼齊右緣
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ width: 76, flexShrink: 0, fontSize: 12.5, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{children}</div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.28)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} className="cust-drawer" style={{
        width: 420, maxWidth: '92vw', height: '100%', background: 'var(--bg-elev)',
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transform: entered ? 'none' : 'translateX(16px)',
        transition: 'transform .2s cubic-bezier(.3,.7,.4,1)',
      }}>
        {/* header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={c.name} size={44}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</span>
              <span className={`chip ${c.type === 'VIP' ? 'purple' : c.type === '潛客' ? 'warn' : 'accent'}`}><span className="dot"/>{c.type}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{c.id} · {c.company}{c.title ? ' · ' + c.title : ''}</div>
          </div>
          <button className="btn icon sm ghost" onClick={onClose}><Icon.X size={16}/></button>
        </div>

        <div className="thin-scroll" style={{ flex: 1, overflow: 'auto', padding: '6px 20px 20px' }}>
          <Section title="基本資料"/>
          <Row label={idLabel}><span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.id}</span></Row>
          <Row label="公司">{c.company || '—'}</Row>
          <Row label="職稱">{c.title || '—'}</Row>
          <Row label="產業">{c.industry || '—'}</Row>

          <Section title="聯絡方式"/>
          <Row label="Email"><a href={`mailto:${c.email}`} style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>{c.email || '—'}</a></Row>
          <Row label="電話">{c.phone || '—'}</Row>
          <Row label="最近聯繫">{c.lastContact || '—'}</Row>

          <Section title="期別歷程" note="跨期身分／報名／成交與當期備註"/>
          <StatusTimeline refId={c.id} name={c.name}/>

          <Section title="備註" note="選標籤或輸入文字，按「確定」儲存"/>
          <div style={{ marginTop: 8 }} onMouseDown={e => e.stopPropagation()}>
            <NoteEditor note={c.note || ''} tags={c.noteTags || []} pool={notePool} onDeletePool={onDeletePool}
              onConfirm={(note, tags) => { if (onSaveNote) onSaveNote(note, tags); }}/>
          </div>

          <Section title={`購買課程（${(c.purchased || []).length}）`} note="由系統帶入"/>
          {purchasedTotal ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {purchasedGroups.map(([cat, names], i) => {
                  const on = i === activeIdx;
                  return (
                    <button key={cat} type="button" onClick={() => setPurchTab(i)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                      fontSize: 12, fontWeight: on ? 600 : 400, lineHeight: 1.6,
                      border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
                      color: on ? 'var(--accent-text)' : 'var(--text-2)',
                    }}>
                      {cat}
                      <span style={{ fontSize: 11, color: on ? 'var(--accent-text)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{names.length}</span>
                    </button>
                  );
                })}
              </div>
              <div className="thin-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: activeNames.length > 3 ? 188 : 'none', overflow: activeNames.length > 3 ? 'auto' : 'visible', paddingRight: activeNames.length > 3 ? 4 : 0 }}>
                {activeNames.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-subtle)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon.Book size={14}/></span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '10px 0' }}>尚無購買記錄</div>}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-subtle)' }}>
          <div style={{ flex: 1 }}/>
          <button className="btn" onClick={onClose}>關閉</button>
          {onMarkContacted && <button className="btn" onClick={onMarkContacted}><Icon.Phone size={13}/> 今天已聯繫</button>}
          {onExport && <button className="btn" onClick={() => onExport(c)}><Icon.Download size={13}/> 匯出</button>}
          {onEdit && <button className="btn primary" onClick={() => onEdit(c)}><Icon.Edit size={13}/> 修改</button>}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, note }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '18px 0 4px' }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-3)' }}>{title}</span>
    {note && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {note}</span>}
  </div>
);

Object.assign(window, { CustomerForm, NoteEditor, NewCustomerModal, EditCustomerModal, DeleteConfirm, ImportCustomerModal, BatchEditModal, CoursePicker, CustomerDetailDrawer });
