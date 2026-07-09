// ─────────────────────────────────────────────────────────────────────────────
// 潛客管理：列表 + 狀態分頁 + 來源篩選 + 搜尋 + 排序 + 匯入/批次/詳細/匯出
// 由客戶管理分流：無「購買課程」，改帶「來源」（標籤）與「狀態」（單選，驅動分頁）
// ─────────────────────────────────────────────────────────────────────────────

// ── 匯出 ──
const PROSPECT_EXPORT_FIELDS = [
  { id: 'id',          label: '潛客編號',  get: c => c.id },
  { id: 'name',        label: '姓名',      get: c => c.name },
  { id: 'status',      label: '狀態',      get: c => c.status || '' },
  { id: 'company',     label: '公司',      get: c => c.company || '' },
  { id: 'title',       label: '職稱',      get: c => c.title || '' },
  { id: 'email',       label: 'Email',     get: c => c.email || '' },
  { id: 'phone',       label: '電話',      get: c => c.phone || '' },
  { id: 'sources',     label: '來源',      get: c => (c.sources || []).join('、') },
  { id: 'lastContact', label: '最近聯繫',  get: c => window.DATA.fmtLastContact(c.lastContact) },
  { id: 'assignee',    label: '負責人',    get: c => c.assignee || '' },
  { id: 'note',        label: '備註',      get: c => c.note || '' },
];

const pCsvEscape = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const pBuildCsv = (rows, fields) => '\uFEFF' + fields.map(f => pCsvEscape(f.label)).join(',') + '\n' + rows.map(r => fields.map(f => pCsvEscape(f.get(r))).join(',')).join('\n');
const pBuildXls = (rows, fields) => {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = fields.map(f => `<th>${esc(f.label)}</th>`).join('');
  const body = rows.map(r => `<tr>${fields.map(f => `<td>${esc(f.get(r))}</td>`).join('')}</tr>`).join('');
  return `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
};
const pDownload = (filename, mime, content) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const PScopeOption = ({ on, label, count, onClick }) => (
  <button type="button" onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left', width: '100%',
    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
    color: on ? 'var(--accent-text)' : 'var(--text)', fontWeight: on ? 600 : 400,
  }}>
    <span style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}` }}>{on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}/>}</span>
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ fontSize: 12, color: on ? 'var(--accent-text)' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{count} 筆</span>
  </button>
);

const ExportProspectModal = ({ scope, prospect, selected = [], filtered = [], all = [], idLabel = '潛客編號', onClose, onDone }) => {
  const FIELDS = React.useMemo(() => PROSPECT_EXPORT_FIELDS.map(f => f.id === 'id' ? { ...f, label: idLabel } : f), [idLabel]);
  const hasFilter = filtered.length !== all.length;
  const [range, setRange] = React.useState(scope === 'list' ? (hasFilter ? 'filtered' : 'all') : scope);
  const [fmt, setFmt] = React.useState('csv');
  const [picked, setPicked] = React.useState(new Set(PROSPECT_EXPORT_FIELDS.map(f => f.id)));
  const rows = scope === 'single' ? [prospect] : scope === 'selected' ? selected : range === 'filtered' ? filtered : all;
  const fields = FIELDS.filter(f => picked.has(f.id));
  const toggleField = (id) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = picked.size === PROSPECT_EXPORT_FIELDS.length;
  const doExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    const base = scope === 'single' ? `潛客_${prospect.name}_${date}` : `潛客名單_${date}`;
    if (fmt === 'csv') pDownload(`${base}.csv`, 'text/csv;charset=utf-8', pBuildCsv(rows, fields));
    else pDownload(`${base}.xls`, 'application/vnd.ms-excel', pBuildXls(rows, fields));
    const file = `${base}.${fmt === 'csv' ? 'csv' : 'xls'}`;
    onDone(scope === 'single' ? `已匯出 ${prospect.name}（${file}）` : `已匯出 ${rows.length} 筆潛客（${file}）`);
  };
  return (
    <Modal title={scope === 'single' ? '匯出潛客' : '批次匯出潛客'}
      subtitle={scope === 'single' ? `${prospect.id} · ${prospect.name}` : '選擇匯出範圍、欄位與檔案格式'}
      onClose={onClose} width={520}
      footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!fields.length || !rows.length} style={{ opacity: (fields.length && rows.length) ? 1 : 0.5 }} onClick={doExport}>
          <Icon.Download size={13}/> {scope === 'single' ? '匯出此潛客' : `匯出 ${rows.length} 筆`}
        </button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="匯出範圍">
          {scope === 'single' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <Avatar name={prospect.name} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{prospect.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{prospect.company || '—'}{prospect.title ? ' · ' + prospect.title : ''}</div>
              </div>
              <span className={`chip ${prospectStatusCls(prospect.status)}`}><span className="dot"/>{prospect.status}</span>
            </div>
          ) : scope === 'selected' ? (
            <PScopeOption on label="已勾選的潛客" count={selected.length} onClick={() => {}}/>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hasFilter && <PScopeOption on={range === 'filtered'} label="目前篩選結果" count={filtered.length} onClick={() => setRange('filtered')}/>}
              <PScopeOption on={range === 'all'} label="全部潛客" count={all.length} onClick={() => setRange('all')}/>
            </div>
          )}
        </Field>
        <Field label="匯出欄位">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1 }}>已選 {picked.size} / {PROSPECT_EXPORT_FIELDS.length} 個欄位</span>
              <button className="btn sm ghost" onClick={() => setPicked(allPicked ? new Set(['id', 'name']) : new Set(PROSPECT_EXPORT_FIELDS.map(f => f.id)))}>{allPicked ? '只留必要欄位' : '全選'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: 8 }}>
              {FIELDS.map(f => {
                const on = picked.has(f.id);
                return (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: on ? 'var(--text)' : 'var(--text-3)' }}>
                    <input type="checkbox" checked={on} onChange={() => toggleField(f.id)}/>{f.label}
                  </label>
                );
              })}
            </div>
          </div>
        </Field>
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
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{fmt === 'csv' ? 'UTF-8 編碼，Excel、Google 試算表皆可開啟。' : '可直接以 Microsoft Excel 開啟編輯。'}</div>
        </Field>
      </div>
    </Modal>
  );
};

// ── 主模組 ──
const ProspectsModule = ({ toast, idLabel = '潛客編號' }) => {
  const [prospects, setProspects] = React.useState(() => window.DATA.loadProspects());
  React.useEffect(() => { window.DATA.saveProspects(prospects); }, [prospects]);
  const notePool = React.useMemo(() => Array.from(new Set(prospects.flatMap(c => c.noteTags || []))), [prospects]);
  const sourcePool = React.useMemo(() => Array.from(new Set(prospects.flatMap(c => c.sources || []))), [prospects]);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('全部');
  const [sourceFilter, setSourceFilter] = React.useState('全部');
  const [sortBy, setSortBy] = React.useState('recent'); // recent=加入時間新→舊；contact=最近聯繫新→舊
  const [sel, setSel] = React.useState(new Set());
  const [modal, setModal] = React.useState(null);
  const seqRef = React.useRef(8);

  const STATUSES = window.DATA.PROSPECT_STATUSES || [];
  const SOURCES = window.DATA.PROSPECT_SOURCES || [];
  const counts = React.useMemo(() => {
    const m = { 全部: prospects.length };
    STATUSES.forEach(s => { m[s] = prospects.filter(c => c.status === s).length; });
    return m;
  }, [prospects]);

  const nq = q.replace(/[-\s]/g, '');
  const list = React.useMemo(() => prospects.filter(c =>
    (status === '全部' || c.status === status) &&
    (sourceFilter === '全部' || (c.sources || []).includes(sourceFilter)) &&
    (!q || (c.name + c.company + c.title + c.email + c.phone + (c.sources || []).join('') + (c.status || '') + (c.note || '') + (c.noteTags || []).join('')).toLowerCase().includes(q.toLowerCase())
      || (nq !== '' && (c.phone || '').replace(/[-\s]/g, '').includes(nq)))
  ), [prospects, status, sourceFilter, q]);

  const hasFilter = q !== '' || status !== '全部' || sourceFilter !== '全部';
  const sorted = React.useMemo(() => [...list].sort((a, b) =>
    sortBy === 'contact'
      ? String(b.lastContact || '').localeCompare(String(a.lastContact || ''))
      : (parseInt((b.id || '').replace(/\D/g, ''), 10) || 0) - (parseInt((a.id || '').replace(/\D/g, ''), 10) || 0)
  ), [list, sortBy]);

  const toggleSel = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const allOnPage = list.length > 0 && list.every(c => sel.has(c.id));
  const someOnPage = list.some(c => sel.has(c.id));
  const toggleAll = () => { const n = new Set(sel); allOnPage ? list.forEach(c => n.delete(c.id)) : list.forEach(c => n.add(c.id)); setSel(n); };
  const clearSel = () => setSel(new Set());
  const clearFilters = () => { setQ(''); setStatus('全部'); setSourceFilter('全部'); };

  const nextId = () => 'P' + String(++seqRef.current).padStart(7, '0');
  // P2 重複檢核：以 Email 為唯一鍵（無 Email 不擋）
  const emailDup = (email, excludeId) => !!email && prospects.some(p => p.email && p.email.toLowerCase() === email.toLowerCase() && p.id !== excludeId);
  const addProspect = (v) => {
    if (emailDup(v.email)) { toast('Email 已存在，疑似重複建檔：' + v.email); return; }
    setProspects([{ ...v, id: nextId(), sources: v.sources || [], lastContact: window.DATA.todayISO(), assignee: v.assignee || '謝孟潔', industry: v.industry || '', note: v.note || '', noteTags: v.noteTags || [] }, ...prospects]); setModal(null); toast('已新增潛客');
  };
  const saveProspect = (v) => { setProspects(prospects.map(c => c.id === v.id ? { ...v } : c)); setModal(null); toast('已儲存變更'); };
  // P1 電訪動線：改狀態／來源／備註視為一次接觸，自動更新最近聯繫＝今天
  const patch = (id, fields, msg) => { const touch = ('status' in fields || 'note' in fields || 'sources' in fields) ? { lastContact: window.DATA.todayISO() } : {}; setProspects(cs => cs.map(c => c.id === id ? { ...c, ...fields, ...touch } : c)); if (msg) toast(msg); };
  const delProspect = (id) => { setProspects(prospects.filter(c => c.id !== id)); setSel(s => { const n = new Set(s); n.delete(id); return n; }); setModal(null); toast('已刪除潛客'); };
  const doImport = (mode, rows) => {
    if (mode === 'manual') {
      const dup = rows.filter(r => emailDup(r.email));
      const ok = rows.filter(r => !emailDup(r.email));
      const added = ok.map(r => ({ ...r, id: nextId(), sources: [], lastContact: window.DATA.todayISO(), assignee: '謝孟潔', industry: '', note: '', noteTags: [] }));
      setProspects([...added, ...prospects]);
      toast(`已手動匯入 ${ok.length} 筆潛客${dup.length ? `（${dup.length} 筆 Email 重複已略過）` : ''}`);
    } else {
      // X2 系統匯入：實際塞示範資料進列表（依 Email 去重）
      const demo = [
        { name: '陳宏志', company: '台灣大哥大', title: '數位通訊處長', email: 'chen.hz@twm.com.tw', phone: '0911-234-567', sources: ['Meta Ads'], status: '未接通' },
        { name: '林惠玲', company: '國泰世華', title: '品牌總監', email: 'lin.hl@cathaybk.com.tw', phone: '0922-345-678', sources: ['Podcast'], status: '接通' },
        { name: '張偉翔', company: '台泥企業', title: '人資副理', email: 'chang.ws@taiwancement.com', phone: '0933-456-789', sources: ['企業客戶'], status: '考慮' },
        { name: '黃雅琴', company: '富邦人壽', title: '業務處長', email: 'huang.yc@fubon.com', phone: '0955-567-890', sources: ['舊生推薦'], status: '預約' },
        { name: '吳志強', company: '聯華電子', title: '綫經理', email: 'wu.zq@unicorn.com.tw', phone: '0966-678-901', sources: ['活動開發'], status: '追蹤' },
        { name: '許怡君', company: '信義企業集團', title: '公關經理', email: 'hsu.yj@sinyi.com.tw', phone: '0977-789-012', sources: ['員工推薦'], status: '未接通' },
      ].filter(d => !emailDup(d.email));
      const added = demo.map(d => ({ ...d, id: nextId(), lastContact: window.DATA.todayISO(), assignee: '謝孟潔', industry: '', note: '', noteTags: [] }));
      setProspects([...added, ...prospects]);
      toast(`已從系統匯入 ${added.length} 筆潛客（示範資料）`);
    }
    setModal(null);
  };
  const applyBatch = (field, val) => {
    setProspects(prospects.map(c => {
      if (!sel.has(c.id)) return c;
      if (field === 'addSource') return { ...c, sources: Array.from(new Set([...(c.sources || []), ...val])) };
      return { ...c, [field]: val };
    }));
    setModal(null); toast(`已批次修改 ${sel.size} 位潛客`);
  };

  const rowClick = (e, c) => {
    if (e.target.closest('button, input, a, label, textarea, select')) return;
    if (window.getSelection && String(window.getSelection())) return;
    setModal({ kind: 'detail', prospect: c });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Topbar
        crumbs={[{ label: '潛客管理' }]}
        tabs={[{ id: '全部', label: '全部', count: counts.全部 }, ...STATUSES.map(s => ({ id: s, label: s, count: counts[s] }))]}
        activeTab={status} onTab={setStatus}
        actions={<>
          <button className="btn sm" onClick={() => setModal({ kind: 'import' })}><Icon.Upload size={13}/> 匯入</button>
          <button className="btn primary sm" onClick={() => setModal({ kind: 'new' })}><Icon.Plus size={13}/> 新增潛客</button>
        </>}/>

      <ToolBar right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {hasFilter ? `${list.length} / ${prospects.length} 位潛客` : `${prospects.length} 位潛客`}
          </span>
          <button className="btn sm" onClick={() => setModal({ kind: 'export', scope: 'list' })}><Icon.Download size={13}/> 匯出</button>
        </div>}>
        <SearchBox value={q} onChange={setQ} placeholder="姓名、公司、Email、電話、來源…" width={240}/>
        <select className="input" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }} title="來源篩選">
          <option value="全部">全部來源</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }} title="排序方式">
          <option value="recent">加入時間：新→舊</option>
          <option value="contact">最近聯繫：新→舊</option>
        </select>
        {hasFilter && <button className="btn sm ghost" onClick={clearFilters} style={{ color: 'var(--text-3)' }}><Icon.X size={12}/> 清除篩選</button>}
      </ToolBar>

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 980 }}>
          <thead><tr>
            <th style={{ width: 38, paddingLeft: 20 }}>
              <input type="checkbox" checked={allOnPage} ref={el => { if (el) el.indeterminate = !allOnPage && someOnPage; }} onChange={toggleAll}/>
            </th>
            <th style={{ minWidth: 150 }}>潛客</th>
            <th style={{ minWidth: 130 }}>公司 / 職稱</th>
            <th style={{ width: 104 }}>狀態</th>
            <th style={{ minWidth: 150 }}>來源</th>
            <th style={{ minWidth: 190 }}>聯絡方式</th>
            <th style={{ minWidth: 150 }}>備註</th>
            <th style={{ width: 96 }}>最近聯繫</th>
            <th style={{ width: 112, textAlign: 'right', paddingRight: 20 }}>操作</th>
          </tr></thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} className={`cust-row ${sel.has(c.id) ? 'sel' : ''}`} onClick={(e) => rowClick(e, c)}>
                <td style={{ paddingLeft: 20 }}><input type="checkbox" checked={sel.has(c.id)} onChange={() => toggleSel(c.id)}/></td>
                <td>
                  <button onClick={() => setModal({ kind: 'detail', prospect: c })} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text)', fontSize: 13 }} className="cust-name">{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }} title={idLabel}>{c.id}</div>
                  </button>
                </td>
                <td>
                  <div style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{c.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{c.title}</div>
                </td>
                <td onClick={e => e.stopPropagation()}><StatusCell value={c.status} onSave={(s) => patch(c.id, { status: s }, '已更新狀態')}/></td>
                <td onClick={e => e.stopPropagation()} style={{ verticalAlign: 'top', paddingTop: 9 }}><SourceCell value={c.sources} pool={sourcePool} onSave={(s) => patch(c.id, { sources: s }, '已更新來源')}/></td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis' }}><Icon.Mail size={11}/><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap' }}><Icon.Phone size={10}/>{c.phone}</div>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ verticalAlign: 'top', paddingTop: 9 }}><ProspectNoteCell value={c.note} onSave={(note) => patch(c.id, { note })}/></td>
                <td style={{ color: 'var(--text-2)', fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{window.DATA.fmtLastContact(c.lastContact)}</td>
                <td style={{ paddingRight: 20 }}>
                  <div className="row-actions" style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <button className="btn icon sm ghost" title="匯出" onClick={() => setModal({ kind: 'export', scope: 'single', prospect: c })}><Icon.Download size={14}/></button>
                    <button className="btn icon sm ghost" title="修改" onClick={() => setModal({ kind: 'edit', prospect: c })}><Icon.Edit size={14}/></button>
                    <button className="btn icon sm ghost" title="刪除" onClick={() => setModal({ kind: 'delete', prospect: c })} style={{ color: 'var(--danger-text)' }}><Icon.Trash size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.length === 0 && (
          <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', marginBottom: 4 }}><Icon.Search size={18}/></span>
            <div style={{ fontSize: 13, fontWeight: 500 }}>沒有符合條件的潛客</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>試試調整搜尋關鍵字、狀態或來源篩選</div>
            {hasFilter && <button className="btn sm" style={{ marginTop: 8 }} onClick={clearFilters}>清除篩選條件</button>}
          </div>
        )}
      </div>

      {sel.size > 0 && (
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 14px',
          background: 'var(--text)', color: 'var(--text-invert)', borderRadius: 999,
          boxShadow: 'var(--shadow-lg)', fontSize: 12.5, whiteSpace: 'nowrap',
          animation: 'batchIn .18s cubic-bezier(.3,.7,.4,1) both',
        }}>
          <span style={{ fontWeight: 600, marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>已選取 {sel.size} 位</span>
          <button className="batch-btn" onClick={() => setModal({ kind: 'batch' })}><Icon.Edit size={13}/> 批次修改</button>
          <button className="batch-btn" onClick={() => setModal({ kind: 'export', scope: 'selected' })}><Icon.Download size={13}/> 匯出所選</button>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.25)', margin: '0 4px' }}></span>
          <button className="batch-btn" title="清除選取" onClick={clearSel} style={{ padding: '0 8px' }}><Icon.X size={13}/></button>
        </div>
      )}

      {modal?.kind === 'new' && <NewProspectModal onClose={() => setModal(null)} onSave={addProspect}/>}
      {modal?.kind === 'detail' && <ProspectDetailDrawer prospect={modal.prospect} idLabel={idLabel} sourcePool={sourcePool}
        onMarkContacted={() => { patch(modal.prospect.id, { lastContact: window.DATA.todayISO() }); setModal(m => ({ ...m, prospect: { ...m.prospect, lastContact: window.DATA.todayISO() } })); toast('已標記今天已聯繫'); }}
        onClose={() => setModal(null)} onEdit={(c) => setModal({ kind: 'edit', prospect: c })} onExport={(c) => setModal({ kind: 'export', scope: 'single', prospect: c })}
        onSaveNote={(note) => { patch(modal.prospect.id, { note }); setModal(m => ({ ...m, prospect: { ...m.prospect, note } })); toast('已更新備註'); }}
        onSaveSource={(s) => { patch(modal.prospect.id, { sources: s }); setModal(m => ({ ...m, prospect: { ...m.prospect, sources: s } })); toast('已更新來源'); }}
        onSaveStatus={(s) => { patch(modal.prospect.id, { status: s }); setModal(m => ({ ...m, prospect: { ...m.prospect, status: s } })); toast('已更新狀態'); }}/>}
      {modal?.kind === 'edit' && <EditProspectModal prospect={modal.prospect} onClose={() => setModal(null)} onSave={saveProspect}/>}
      {modal?.kind === 'delete' && <DeleteProspectConfirm prospect={modal.prospect} onClose={() => setModal(null)} onConfirm={() => delProspect(modal.prospect.id)}/>}
      {modal?.kind === 'import' && <ImportProspectModal onClose={() => setModal(null)} onImport={doImport}/>}
      {modal?.kind === 'batch' && <ProspectBatchModal count={sel.size} onClose={() => setModal(null)} onApply={applyBatch}/>}
      {modal?.kind === 'export' && <ExportProspectModal scope={modal.scope} prospect={modal.prospect}
        selected={prospects.filter(c => sel.has(c.id))} filtered={list} all={prospects} idLabel={idLabel}
        onClose={() => setModal(null)} onDone={(msg) => { setModal(null); toast(msg); }}/>}
    </div>
  );
};

Object.assign(window, { ProspectsModule, ExportProspectModal });
