// ─────────────────────────────────────────────────────────────────────────────
// 客戶匯出 — 單筆 / 批次（所選・篩選結果・全部），欄位可選，CSV / Excel 實際下載
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_FIELDS = [
  { id: 'id',          label: '會員編號',  get: c => c.id },
  { id: 'name',        label: '姓名',      get: c => c.name },
  { id: 'type',        label: '類型',      get: c => c.type },
  { id: 'company',     label: '公司',      get: c => c.company || '' },
  { id: 'title',       label: '職稱',      get: c => c.title || '' },
  { id: 'email',       label: 'Email',     get: c => c.email || '' },
  { id: 'phone',       label: '電話',      get: c => c.phone || '' },
  { id: 'purchased',   label: '購買課程',  get: c => (c.purchased || []).join('、') },
  { id: 'lastContact', label: '最近聯繫',  get: c => c.lastContact || '' },
  { id: 'assignee',    label: '負責人',    get: c => c.assignee || '' },
  { id: 'note',        label: '備註',      get: c => c.note || '' },
  { id: 'noteTags',    label: '備註標籤',  get: c => (c.noteTags || []).join('、') },
];

const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const buildCsv = (rows, fields) => {
  const head = fields.map(f => csvEscape(f.label)).join(',');
  const body = rows.map(r => fields.map(f => csvEscape(f.get(r))).join(',')).join('\n');
  return '\uFEFF' + head + '\n' + body; // BOM：讓 Excel 正確讀取中文
};

const buildXls = (rows, fields) => {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = fields.map(f => `<th>${esc(f.label)}</th>`).join('');
  const body = rows.map(r => `<tr>${fields.map(f => `<td>${esc(f.get(r))}</td>`).join('')}</tr>`).join('');
  return `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
};

const triggerDownload = (filename, mime, content) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// 範圍選項卡片（radio 樣式）
const ScopeOption = ({ on, label, count, onClick }) => (
  <button type="button" onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, textAlign: 'left', width: '100%',
    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
    background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
    color: on ? 'var(--accent-text)' : 'var(--text)', fontWeight: on ? 600 : 400,
  }}>
    <span style={{
      width: 15, height: 15, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
      border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
    }}>{on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}/>}</span>
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ fontSize: 12, color: on ? 'var(--accent-text)' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{count} 筆</span>
  </button>
);

// scope: 'list'（工具列匯出：篩選結果/全部）| 'selected'（已勾選）| 'single'（單筆）
const ExportCustomerModal = ({ scope, customer, selected = [], filtered = [], all = [], idLabel = '會員編號', onClose, onDone }) => {
  const FIELDS = React.useMemo(() => EXPORT_FIELDS.map(f => f.id === 'id' ? { ...f, label: idLabel } : f), [idLabel]);
  const hasFilter = filtered.length !== all.length;
  const [range, setRange] = React.useState(scope === 'list' ? (hasFilter ? 'filtered' : 'all') : scope);
  const [fmt, setFmt] = React.useState('csv');
  const [picked, setPicked] = React.useState(new Set(EXPORT_FIELDS.map(f => f.id)));

  const rows =
    scope === 'single'   ? [customer] :
    scope === 'selected' ? selected :
    range === 'filtered' ? filtered : all;

  const fields = FIELDS.filter(f => picked.has(f.id));
  const toggleField = (id) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = picked.size === EXPORT_FIELDS.length;

  const doExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    const base = scope === 'single' ? `客戶_${customer.name}_${date}` : `客戶名單_${date}`;
    if (fmt === 'csv') triggerDownload(`${base}.csv`, 'text/csv;charset=utf-8', buildCsv(rows, fields));
    else triggerDownload(`${base}.xls`, 'application/vnd.ms-excel', buildXls(rows, fields));
    const file = `${base}.${fmt === 'csv' ? 'csv' : 'xls'}`;
    onDone(scope === 'single' ? `已匯出 ${customer.name}（${file}）` : `已匯出 ${rows.length} 筆客戶（${file}）`);
  };

  return (
    <Modal title={scope === 'single' ? '匯出客戶' : '批次匯出客戶'}
      subtitle={scope === 'single' ? `${customer.id} · ${customer.name}` : '選擇匯出範圍、欄位與檔案格式'}
      onClose={onClose} width={520}
      footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!fields.length || !rows.length} style={{ opacity: (fields.length && rows.length) ? 1 : 0.5 }} onClick={doExport}>
          <Icon.Download size={13}/> {scope === 'single' ? '匯出此客戶' : `匯出 ${rows.length} 筆`}
        </button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 匯出範圍 */}
        <Field label="匯出範圍">
          {scope === 'single' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <Avatar name={customer.name} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{customer.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{customer.company || '—'}{customer.title ? ' · ' + customer.title : ''}</div>
              </div>
              <span className={`chip ${customer.type === 'VIP' ? 'purple' : customer.type === '潛客' ? 'warn' : 'accent'}`}><span className="dot"/>{customer.type}</span>
            </div>
          ) : scope === 'selected' ? (
            <ScopeOption on label="已勾選的客戶" count={selected.length} onClick={() => {}}/>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hasFilter && <ScopeOption on={range === 'filtered'} label="目前篩選結果" count={filtered.length} onClick={() => setRange('filtered')}/>}
              <ScopeOption on={range === 'all'} label="全部客戶" count={all.length} onClick={() => setRange('all')}/>
            </div>
          )}
        </Field>

        {/* 匯出欄位 */}
        <Field label="匯出欄位">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>已選 {picked.size} / {EXPORT_FIELDS.length} 個欄位</span>
              <button className="btn sm ghost" onClick={() => setPicked(allPicked ? new Set(['id', 'name']) : new Set(EXPORT_FIELDS.map(f => f.id)))}>
                {allPicked ? '只留必要欄位' : '全選'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: 8 }}>
              {FIELDS.map(f => {
                const on = picked.has(f.id);
                return (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: on ? 'var(--text)' : 'var(--text-3)' }}>
                    <input type="checkbox" checked={on} onChange={() => toggleField(f.id)}/>
                    {f.label}
                  </label>
                );
              })}
            </div>
          </div>
        </Field>

        {/* 檔案格式 */}
        <Field label="檔案格式">
          <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8 }}>
            {[['csv', 'CSV（.csv）'], ['xls', 'Excel（.xls）']].map(([id, label]) => (
              <button key={id} onClick={() => setFmt(id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: fmt === id ? 'var(--bg-elev)' : 'transparent', boxShadow: fmt === id ? 'var(--shadow-xs)' : 'none',
                color: fmt === id ? 'var(--text)' : 'var(--text-3)', fontWeight: fmt === id ? 600 : 400, fontSize: 13,
              }}><Icon.FileText size={13}/>{label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
            {fmt === 'csv' ? 'UTF-8 編碼，Excel、Google 試算表皆可開啟。' : '可直接以 Microsoft Excel 開啟編輯。'}
          </div>
        </Field>

      </div>
    </Modal>
  );
};

Object.assign(window, { ExportCustomerModal });
