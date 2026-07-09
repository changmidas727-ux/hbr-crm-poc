// ─────────────────────────────────────────────────────────────────────────────
// 潛客 — 來源/狀態選擇器 · 表單 · 新增/修改/刪除/匯入/批次/詳細抽屜/匯出
// 由客戶模組分流而來：無「購買課程」，改帶「來源」（標籤式，做法同備註）與「狀態」（單選）
// ─────────────────────────────────────────────────────────────────────────────

const PROSPECT_ASSIGNEES = ['謝孟潔', '陳庭宇'];

// 潛客備註：純自由文字（不用標籤）。compact 為列表彈窗用。
const PlainNoteEditor = ({ note = '', onChange, onConfirm, onCancel, autoFocus, compact }) => {
  const [text, setText] = React.useState(note);
  const taRef = React.useRef(null);
  React.useEffect(() => { if (autoFocus && taRef.current) taRef.current.focus(); }, [autoFocus]);
  const setTxt = (v) => { setText(v); if (onChange) onChange(v); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea ref={taRef} value={text} onChange={e => setTxt(e.target.value)} placeholder="輸入備註文字…（選填）"
        rows={compact ? 2 : 3} style={{ width: '100%', fontSize: 12.5, lineHeight: 1.55, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elev)', resize: 'vertical', font: 'inherit', color: 'var(--text)', outline: 'none' }}/>
      {(onConfirm || onCancel) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {onCancel && <button type="button" className="btn sm" onClick={onCancel}>取消</button>}
          {onConfirm && <button type="button" className="btn primary sm" onClick={() => onConfirm(text.trim())}><Icon.Check size={13}/> 確定</button>}
        </div>
      )}
    </div>
  );
};

// 列表用：潛客備註儲存格（點擊開彈窗，純文字）
const ProspectNoteCell = ({ value, onSave }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const btnRef = React.useRef(null);
  const openPop = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 324), top: Math.min(r.bottom + 4, window.innerHeight - 200) });
    setOpen(true);
  };
  return (
    <>
      <button ref={btnRef} type="button" onClick={openPop} title="編輯備註"
        style={{ display: 'block', textAlign: 'left', maxWidth: 220, border: 'none', background: 'transparent', padding: '2px 4px', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}>
        {value ? (
          <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{value}</span>
        ) : <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon.Plus size={11}/> 備註</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1200 }}/>
          <div className="card" onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 1201, width: 308, padding: 12, boxShadow: 'var(--shadow-lg)', background: 'var(--bg-elev)' }}>
            <PlainNoteEditor note={value || ''} autoFocus compact onConfirm={(n) => { onSave(n); setOpen(false); }} onCancel={() => setOpen(false)}/>
          </div>
        </>
      )}
    </>
  );
};

// 狀態 → chip 色彩類別
const prospectStatusCls = (s) =>
  s === '接通' ? 'accent' :
  s === '預約' ? 'purple' :
  (s === '考慮' || s === '追蹤') ? 'warn' :
  'outline'; // 未接通／婉拒／無效：中性

// ── 來源標籤編輯器（做法同備註標籤：預設池 + 自訂；可多選）──
const SourceEditor = ({ value = [], pool = [], onChange, onConfirm, onCancel, compact }) => {
  const [sel, setSel] = React.useState(Array.isArray(value) ? value : []);
  const [adding, setAdding] = React.useState('');
  const available = Array.from(new Set([...(window.DATA.PROSPECT_SOURCES || []), ...pool, ...sel]));
  const emit = (s) => { if (onChange) onChange(s); };
  const toggle = (t) => { const s = sel.includes(t) ? sel.filter(x => x !== t) : [...sel, t]; setSel(s); emit(s); };
  const addTag = () => { const v = adding.trim(); if (!v) return; const s = sel.includes(v) ? sel : [...sel, v]; setSel(s); setAdding(''); emit(s); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {available.map(t => {
          const on = sel.includes(t);
          return (
            <button key={t} type="button" onClick={() => toggle(t)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
              fontSize: 12, fontWeight: on ? 600 : 400, lineHeight: 1.6,
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
              color: on ? 'var(--accent-text)' : 'var(--text-2)',
            }}>{on && <Icon.Check size={11}/>}{t}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="input" value={adding} onChange={e => setAdding(e.target.value)} placeholder="自訂來源…"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} style={{ flex: 1, height: 30, fontSize: 12.5 }}/>
        <button type="button" className="btn sm" disabled={!adding.trim()} style={{ opacity: adding.trim() ? 1 : 0.5 }} onClick={addTag}><Icon.Plus size={12}/> 加入來源</button>
      </div>
      {(onConfirm || onCancel) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {onCancel && <button type="button" className="btn sm" onClick={onCancel}>取消</button>}
          {onConfirm && <button type="button" className="btn primary sm" onClick={() => onConfirm(sel)}><Icon.Check size={13}/> 確定</button>}
        </div>
      )}
    </div>
  );
};

// ── 狀態選擇器（單選下拉，含色點）──
const StatusSelect = ({ value, onChange }) => (
  <select className="input" value={value} onChange={e => onChange(e.target.value)}>
    {(window.DATA.PROSPECT_STATUSES || []).map(s => <option key={s} value={s}>{s}</option>)}
  </select>
);

// 列表用：來源儲存格（點擊開彈窗，確認模式）
const SourceCell = ({ value = [], pool = [], onSave }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const btnRef = React.useRef(null);
  const openPop = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 324), top: Math.min(r.bottom + 4, window.innerHeight - 220) });
    setOpen(true);
  };
  return (
    <>
      <button ref={btnRef} type="button" onClick={openPop} title="編輯來源"
        style={{ display: 'block', textAlign: 'left', maxWidth: 180, border: 'none', background: 'transparent', padding: '2px 4px', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}>
        {value && value.length ? (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {value.slice(0, 2).map(s => <span key={s} className="chip outline" style={{ height: 18, fontSize: 11 }}>{s}</span>)}
            {value.length > 2 && <span className="chip" style={{ height: 18, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>+{value.length - 2}</span>}
          </span>
        ) : <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon.Plus size={11}/> 來源</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1200 }}/>
          <div className="card" onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 1201, width: 308, padding: 12, boxShadow: 'var(--shadow-lg)', background: 'var(--bg-elev)' }}>
            <SourceEditor value={value || []} pool={pool} onConfirm={(s) => { onSave(s); setOpen(false); }} onCancel={() => setOpen(false)}/>
          </div>
        </>
      )}
    </>
  );
};

// 列表用：狀態儲存格（點擊開小選單，即時切換）
const StatusCell = ({ value, onSave }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const btnRef = React.useRef(null);
  const openPop = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 160), top: Math.min(r.bottom + 4, window.innerHeight - 280) });
    setOpen(true);
  };
  return (
    <>
      <button ref={btnRef} type="button" onClick={openPop} title="變更狀態" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
        <span className={`chip ${prospectStatusCls(value)}`}><span className="dot"/>{value}<Icon.ChevronDown size={11}/></span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1200 }}/>
          <div className="card" onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 1201, width: 148, padding: 5, boxShadow: 'var(--shadow-menu)', background: 'var(--bg-elev)' }}>
            {(window.DATA.PROSPECT_STATUSES || []).map(s => {
              const on = s === value;
              return (
                <button key={s} type="button" onClick={() => { onSave(s); setOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', borderRadius: 6,
                  border: 'none', background: on ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span className={`chip ${prospectStatusCls(s)}`} style={{ height: 18, fontSize: 11 }}><span className="dot"/>{s}</span>
                  {on && <span style={{ marginLeft: 'auto', color: 'var(--accent-text)' }}><Icon.Check size={12}/></span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

// ── 共用表單欄位 ──
const ProspectForm = ({ value, onChange }) => {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="姓名"><input className="input" value={value.name} onChange={e => set('name', e.target.value)} placeholder="王小明"/></Field></div>
        <div style={{ flex: 1 }}><Field label="狀態"><StatusSelect value={value.status} onChange={v => set('status', v)}/></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="公司"><input className="input" value={value.company} onChange={e => set('company', e.target.value)} placeholder="○○股份有限公司"/></Field></div>
        <div style={{ flex: 1 }}><Field label="職稱"><input className="input" value={value.title} onChange={e => set('title', e.target.value)} placeholder="總經理"/></Field></div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Email"><input className="input" type="email" value={value.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com"/></Field></div>
        <div style={{ flex: 1 }}><Field label="電話"><input className="input" value={value.phone} onChange={e => set('phone', e.target.value)} placeholder="0912-345-678"/></Field></div>
      </div>
      <Field label="來源" hint="可點選標籤快速標記，並可自訂新增（可多選）">
        <SourceEditor value={value.sources || []} onChange={(s) => onChange({ ...value, sources: s })}/>
      </Field>
      <Field label="備註" hint="自由填寫">
        <PlainNoteEditor note={value.note || ''} onChange={(note) => onChange({ ...value, note })}/>
      </Field>
    </div>
  );
};

const EMPTY_PROSPECT = { name: '', status: '未接通', company: '', title: '', email: '', phone: '', sources: [], assignee: '謝孟潔', note: '', noteTags: [] };

const NewProspectModal = ({ onClose, onSave }) => {
  const [v, setV] = React.useState(EMPTY_PROSPECT);
  return (
    <Modal title="新增潛客" onClose={onClose} width={540}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => onSave(v)}><Icon.Check size={13}/> 建立潛客</button></>}>
      <ProspectForm value={v} onChange={setV}/>
    </Modal>
  );
};

const EditProspectModal = ({ prospect, onClose, onSave }) => {
  const [v, setV] = React.useState({ ...prospect });
  return (
    <Modal title="修改潛客" subtitle={`${prospect.id} · ${prospect.name}`} onClose={onClose} width={540}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => onSave(v)}><Icon.Check size={13}/> 儲存變更</button></>}>
      <ProspectForm value={v} onChange={setV}/>
    </Modal>
  );
};

const DeleteProspectConfirm = ({ prospect, onClose, onConfirm }) => (
  <Modal title="刪除潛客" onClose={onClose} width={400}
    footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }} onClick={onConfirm}><Icon.Trash size={13}/> 確認刪除</button></>}>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
      確定要刪除 <b>{prospect.name}</b>（{prospect.company}）嗎？此動作無法復原。
    </p>
  </Modal>
);

// ── 匯入：系統匯入 / 手動匯入 ──
const ImportProspectModal = ({ onClose, onImport }) => {
  const [mode, setMode] = React.useState('system');
  return (
    <Modal title="匯入潛客" subtitle="從後台系統匯入名單，或手動填寫批次新增" onClose={onClose} width={680} footer={null}>
      <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8, marginBottom: 18 }}>
        {[['system', '系統匯入', <Icon.Zap size={13}/>], ['manual', '手動匯入', <Icon.Edit size={13}/>]].map(([id, label, ic]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: mode === id ? 'var(--bg-elev)' : 'transparent', boxShadow: mode === id ? 'var(--shadow-xs)' : 'none',
            color: mode === id ? 'var(--text)' : 'var(--text-3)', fontWeight: mode === id ? 600 : 400, fontSize: 13,
          }}>{ic}{label}</button>
        ))}
      </div>
      {mode === 'system' ? <ProspectSystemImport onClose={onClose} onImport={onImport}/> : <ProspectManualImport onClose={onClose} onImport={onImport}/>}
    </Modal>
  );
};

const ProspectSystemImport = ({ onClose, onImport }) => {
  const [src, setSrc] = React.useState('Meta 名單廣告');
  const [fetched, setFetched] = React.useState(false);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, marginBottom: 16 }}>
        <Icon.Info size={15}/><span>實際連線方式（API／名單來源）由 RD 後續串接；此處為示意流程，欄位與來源可彈性調整。</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="名單來源" hint="可由 RD 依實際來源擴充選項">
          <select className="input" value={src} onChange={e => { setSrc(e.target.value); setFetched(false); }}>
            <option>Meta 名單廣告</option><option>活動報名表單</option><option>Podcast 導流</option><option>其他（自訂）</option>
          </select>
        </Field>
        <Field label="同步範圍">
          <select className="input"><option>全部名單</option><option>近 30 天新進</option><option>指定條件…</option></select>
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setFetched(true)}><Icon.Repeat size={13}/> 測試連線並預覽</button>
          {fetched && <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--success-text)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Check size={13}/> 連線成功，讀取到 86 筆</span>}
        </div>
        {fetched && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>預覽（前 3 筆）· 欄位對應可由 RD 設定</div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead><tr><th style={{ paddingLeft: 12 }}>姓名</th><th>公司</th><th>來源</th><th>Email</th></tr></thead>
              <tbody>
                <tr><td style={{ paddingLeft: 12 }}>何宗翰</td><td>南亞科技</td><td>Meta Ads</td><td>ho@nanya.com</td></tr>
                <tr><td style={{ paddingLeft: 12 }}>方筱涵</td><td>欣興電子</td><td>活動開發</td><td>fang@unimicron.com</td></tr>
                <tr><td style={{ paddingLeft: 12 }}>江偉誠</td><td>群創光電</td><td>Podcast</td><td>chiang@innolux.com</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!fetched} onClick={() => onImport('system', null)} style={{ opacity: fetched ? 1 : 0.5 }}><Icon.Download size={13}/> 匯入 86 筆</button>
      </div>
    </div>
  );
};

const ProspectManualImport = ({ onClose, onImport }) => {
  const blank = () => ({ name: '', company: '', title: '', status: '未接通', email: '', phone: '' });
  const [rows, setRows] = React.useState([blank(), blank()]);
  const setCell = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const valid = rows.filter(r => r.name.trim());
  const cellStyle = { width: '100%', border: 'none', background: 'transparent', font: 'inherit', fontSize: 12, outline: 'none', color: 'var(--text)', padding: '0 4px', height: 30 };
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>逐列填寫潛客資料，按「新增一列」可繼續加入；空白列會自動略過。來源可於匯入後在列表逐筆補上。</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="thin-scroll" style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ fontSize: 12, minWidth: 620 }}>
            <thead><tr>
              <th style={{ paddingLeft: 12, width: 30 }}>#</th>
              <th style={{ minWidth: 90 }}>姓名 *</th><th style={{ minWidth: 110 }}>公司</th><th style={{ minWidth: 90 }}>職稱</th>
              <th style={{ minWidth: 84 }}>狀態</th><th style={{ minWidth: 150 }}>Email</th><th style={{ minWidth: 110 }}>電話</th><th style={{ width: 34 }}/>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 12, color: 'var(--text-3)' }}>{i + 1}</td>
                  <td><input style={cellStyle} value={r.name} onChange={e => setCell(i, 'name', e.target.value)} placeholder="姓名"/></td>
                  <td><input style={cellStyle} value={r.company} onChange={e => setCell(i, 'company', e.target.value)} placeholder="公司"/></td>
                  <td><input style={cellStyle} value={r.title} onChange={e => setCell(i, 'title', e.target.value)} placeholder="職稱"/></td>
                  <td><select style={{ ...cellStyle, cursor: 'pointer' }} value={r.status} onChange={e => setCell(i, 'status', e.target.value)}>{(window.DATA.PROSPECT_STATUSES || []).map(t => <option key={t}>{t}</option>)}</select></td>
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
const PROSPECT_BATCH_FIELDS = [
  { id: 'status', label: '狀態', kind: 'select', options: window.DATA.PROSPECT_STATUSES },
  { id: 'assignee', label: '負責人', kind: 'select', options: PROSPECT_ASSIGNEES },
  { id: 'addSource', label: '新增來源', kind: 'source' },
  { id: 'lastContact', label: '最近聯繫日期', kind: 'date' },
];

const ProspectBatchModal = ({ count, onClose, onApply }) => {
  const [field, setField] = React.useState('status');
  const def = PROSPECT_BATCH_FIELDS.find(f => f.id === field);
  const [val, setVal] = React.useState((window.DATA.PROSPECT_STATUSES || [])[0]);
  React.useEffect(() => {
    if (def.kind === 'select') setVal(def.options[0]);
    else if (def.kind === 'source') setVal([]);
    else setVal('');
  }, [field]);
  return (
    <Modal title="批次修改" subtitle={`將套用至已選取的 ${count} 位潛客`} onClose={onClose} width={480}
      footer={<><button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={def.kind === 'source' ? !val.length : !val} onClick={() => onApply(field, val)}><Icon.Check size={13}/> 套用至 {count} 位</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="要修改的欄位">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROSPECT_BATCH_FIELDS.map(f => {
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
          {def.kind === 'source' && <SourceEditor value={Array.isArray(val) ? val : []} onChange={setVal}/>}
          {def.kind === 'date' && <input className="input" type="date" value={val} onChange={e => setVal(e.target.value)}/>}
        </Field>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <Icon.Info size={14}/><span>{def.kind === 'source' ? '所選來源將合併加入所選潛客（不覆蓋既有來源）。' : '此欄位將以新值覆蓋所選潛客的原值。'}</span>
        </div>
      </div>
    </Modal>
  );
};

// ── 潛客詳細抽屜 ──
const ProspectDetailDrawer = ({ prospect, onClose, onEdit, onExport, onSaveNote, onSaveSource, onSaveStatus, onMarkContacted, notePool = [], sourcePool = [], idLabel = '潛客編號' }) => {
  const c = prospect;
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
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transform: entered ? 'none' : 'translateX(16px)', transition: 'transform .2s cubic-bezier(.3,.7,.4,1)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={c.name} size={44}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</span>
              <span className={`chip ${prospectStatusCls(c.status)}`}><span className="dot"/>{c.status}</span>
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

          <Section title="狀態" note="點選即時更新開發階段"/>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(window.DATA.PROSPECT_STATUSES || []).map(s => {
              const on = s === c.status;
              return (
                <button key={s} type="button" onClick={() => onSaveStatus && onSaveStatus(s)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 12, fontWeight: on ? 600 : 400, lineHeight: 1.6,
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
                  color: on ? 'var(--accent-text)' : 'var(--text-2)',
                }}>{on && <Icon.Check size={11}/>}{s}</button>
              );
            })}
          </div>

          <Section title="來源" note="選標籤或自訂，按「確定」儲存"/>
          <div style={{ marginTop: 8 }} onMouseDown={e => e.stopPropagation()}>
            <SourceEditor value={c.sources || []} pool={sourcePool} onConfirm={(s) => { if (onSaveSource) onSaveSource(s); }}/>
          </div>

          <Section title="備註" note="輸入文字，按「確定」儲存"/>
          <div style={{ marginTop: 8 }} onMouseDown={e => e.stopPropagation()}>
            <PlainNoteEditor note={c.note || ''}
              onConfirm={(note) => { if (onSaveNote) onSaveNote(note); }}/>
          </div>

          <Section title="期別歷程" note="跨期身分／報名／成交與當期備註"/>
          {window.StatusTimeline ? <window.StatusTimeline refId={c.id} name={c.name}/> : null}
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

Object.assign(window, {
  SourceEditor, StatusSelect, SourceCell, StatusCell, prospectStatusCls, ProspectForm, PlainNoteEditor, ProspectNoteCell,
  NewProspectModal, EditProspectModal, DeleteProspectConfirm, ImportProspectModal, ProspectBatchModal, ProspectDetailDrawer,
});
