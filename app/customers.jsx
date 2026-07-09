// ─────────────────────────────────────────────────────────────────────────────
// 客戶管理：列表 + 搜尋/類型篩選 + 匯入(系統/手動) + 批次修改 + 單筆修改/刪除/匯出
// v2 UI：單行列高、hover 顯示操作、浮動批次列、整列可點開詳細、空狀態
// ─────────────────────────────────────────────────────────────────────────────

// 列表內的「備註」儲存格：顯示標籤＋文字，點擊開彈窗（NoteEditor，附「確定」鈕）
const NoteCell = ({ value, tags = [], pool = [], onSave, onDeletePool }) => {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ left: 0, top: 0 });
  const btnRef = React.useRef(null);
  const openPop = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 324), top: Math.min(r.bottom + 4, window.innerHeight - 240) });
    setOpen(true);
  };
  const hasContent = (tags && tags.length) || value;
  return (
    <>
      <button ref={btnRef} type="button" onClick={openPop} title="編輯備註與標籤"
        style={{ display: 'block', textAlign: 'left', maxWidth: 220, border: 'none', background: 'transparent', padding: '2px 4px', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}>
        {hasContent ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {tags && tags.length > 0 && (
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {tags.slice(0, 3).map(t => <span key={t} className="chip accent" style={{ height: 18, fontSize: 11 }}>{t}</span>)}
                {tags.length > 3 && <span className="chip" style={{ height: 18, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>+{tags.length - 3}</span>}
              </span>
            )}
            {value && <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{value}</span>}
          </span>
        ) : <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon.Plus size={11}/> 備註</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1200 }}/>
          <div className="card" onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 1201, width: 308, padding: 12, boxShadow: 'var(--shadow-lg)', background: 'var(--bg-elev)' }}>
            <NoteEditor note={value || ''} tags={tags || []} pool={pool} autoFocus compact onDeletePool={onDeletePool}
              onConfirm={(note, tg) => { onSave(note, tg); setOpen(false); }}
              onCancel={() => setOpen(false)}/>
          </div>
        </>
      )}
    </>
  );
};

const CustomersModule = ({ toast, idLabel = '會員編號' }) => {
  const [customers, setCustomers] = React.useState(() => window.DATA.loadCustomers());
  React.useEffect(() => { window.DATA.saveCustomers(customers); }, [customers]);
  const notePool = React.useMemo(() => Array.from(new Set(customers.flatMap(c => c.noteTags || []))), [customers]);
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState('全部');
  const [sortBy, setSortBy] = React.useState('recent'); // recent=加入時間新→舊；enrollments=報名次數多→少
  const [sel, setSel] = React.useState(new Set());
  const [modal, setModal] = React.useState(null); // {kind:'new'|'edit'|'delete'|'import'|'batch'|'export'|'detail', customer?}
  const seqRef = React.useRef(9999993); // 新增/匯入時產生下一個會員編號

  const counts = {
    全部: customers.length,
    學員: customers.filter(c => c.type === '學員').length,
    VIP: customers.filter(c => c.type === 'VIP').length,
  };
  const nq = q.replace(/[-\s]/g, '');
  const list = customers.filter(c =>
    (type === '全部' || c.type === type) &&
    (!q || (c.name + c.company + c.title + c.email + c.phone + (c.purchased || []).join('') + (c.note || '') + (c.noteTags || []).join('')).toLowerCase().includes(q.toLowerCase())
      || (nq !== '' && (c.phone || '').replace(/[-\s]/g, '').includes(nq)))
  );
  const hasFilter = q !== '' || type !== '全部';
  // 排序：加入時間新→舊（以會員編號數字遞減為代理）／報名次數多→少
  const sorted = [...list].sort((a, b) =>
    sortBy === 'enrollments'
      ? (b.enrollments || 0) - (a.enrollments || 0)
      : (parseInt((b.id || '').replace(/\D/g, ''), 10) || 0) - (parseInt((a.id || '').replace(/\D/g, ''), 10) || 0)
  );

  const toggleSel = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };
  const allOnPage = list.length > 0 && list.every(c => sel.has(c.id));
  const someOnPage = list.some(c => sel.has(c.id));
  const toggleAll = () => { const n = new Set(sel); allOnPage ? list.forEach(c => n.delete(c.id)) : list.forEach(c => n.add(c.id)); setSel(n); };
  const clearSel = () => setSel(new Set());

  // 動作（P2 重複檢核：以 Email 為唯一鍵，無 Email 不擋）
  const emailDup = (email, excludeId) => !!email && customers.some(c => c.email && c.email.toLowerCase() === email.toLowerCase() && c.id !== excludeId);
  const addCustomer = (v) => {
    if (emailDup(v.email)) { toast('Email 已存在，疑似重複建檔：' + v.email); return; }
    setCustomers([{ ...v, id: 'H' + (++seqRef.current), purchased: v.purchased || [], enrollments: (v.purchased||[]).length, lastContact: window.DATA.todayISO(), assignee: v.assignee || '謝孟潔', note: v.note || '', noteTags: v.noteTags || [] }, ...customers]); setModal(null); toast('已新增客戶');
  };
  const saveCustomer = (v) => { setCustomers(customers.map(c => c.id === v.id ? { ...v } : c)); setModal(null); toast('已儲存變更'); };
  // K1 電訪動線：更新備註視為一次接觸，自動更新最近聯繫＝今天
  const updateNote = (id, note, noteTags) => setCustomers(cs => cs.map(c => c.id === id ? { ...c, note, noteTags, lastContact: window.DATA.todayISO() } : c));
  // K2 備註標籤池管理：自訂標籤可從全域池刪除（＝從所有客戶移除該標籤；預設 7 個不可刪）
  const removePoolTag = (tag) => {
    if ((window.DATA.NOTE_TAGS || []).includes(tag)) return;
    setCustomers(cs => cs.map(c => (c.noteTags || []).includes(tag) ? { ...c, noteTags: c.noteTags.filter(t => t !== tag) } : c));
    toast('已從標籤池刪除「' + tag + '」');
  };
  const delCustomer = (id) => { setCustomers(customers.filter(c => c.id !== id)); setSel(s => { const n = new Set(s); n.delete(id); return n; }); setModal(null); toast('已刪除客戶'); };
  const doImport = (mode, rows) => {
    if (mode === 'manual') {
      const dup = rows.filter(r => emailDup(r.email));
      const ok = rows.filter(r => !emailDup(r.email));
      const added = ok.map(r => ({ ...r, id: 'H' + (++seqRef.current), purchased: [], enrollments: 0, lastContact: window.DATA.todayISO(), assignee: '謝孟潔', industry: '', note: '', noteTags: [] }));
      setCustomers([...added, ...customers]);
      toast(`已手動匯入 ${ok.length} 筆客戶${dup.length ? `（${dup.length} 筆 Email 重複已略過）` : ''}`);
    } else {
      // X2 系統匯入：實際塞示範資料進列表（依 Email 去重）
      const demo = [
        { name: '李宗翰', company: '台達電', title: '營運處長', email: 'lee.zh@deltaww.com', phone: '0910-111-222', type: '學員', purchased: ['實戰班・第3期'], enrollments: 1 },
        { name: '王惠娟', company: '中國信託', title: '數位金融處長', email: 'wang.hj@ctbcbank.com', phone: '0921-222-333', type: '學員', purchased: ['個案共學會・第14期'], enrollments: 1 },
        { name: '邱志明', company: '統一企業', title: '品牌總監', email: 'chiu.zm@uni-president.com', phone: '0933-333-444', type: '學員', purchased: ['領導者俱樂部・2025'], enrollments: 1 },
        { name: '陳美鳳', company: '遠東新世紀', title: '人資長', email: 'chen.mf@fenc.com', phone: '0955-444-555', type: 'VIP', purchased: ['個案共學會・第13期', '領導者俱樂部・2024'], enrollments: 2 },
        { name: '林建宏', company: '華硕電腦', title: '產品長', email: 'lin.jh@asus.com', phone: '0966-555-666', type: '學員', purchased: ['實戰班・第2期'], enrollments: 1 },
        { name: '葉淑芬', company: '台灣高鐵', title: '行銷處長', email: 'yeh.sf@thsrc.com.tw', phone: '0977-666-777', type: '學員', purchased: ['個案共學會・第15期'], enrollments: 1 },
      ].filter(d => !emailDup(d.email));
      const added = demo.map(d => ({ ...d, id: 'H' + (++seqRef.current), lastContact: window.DATA.todayISO(), assignee: '謝孟潔', industry: '', note: '', noteTags: [] }));
      setCustomers([...added, ...customers]);
      toast(`已從系統匯入 ${added.length} 筆客戶（示範資料）`);
    }
    setModal(null);
  };
  const applyBatch = (field, val) => {
    setCustomers(customers.map(c => {
      if (!sel.has(c.id)) return c;
      if (field === 'addCourse') { const merged = Array.from(new Set([...(c.purchased || []), ...val])); return { ...c, purchased: merged }; }
      return { ...c, [field]: val };
    }));
    setModal(null); toast(`已批次修改 ${sel.size} 位客戶`);
  };

  // 整列點擊開詳細（按鈕/勾選不觸發）
  const rowClick = (e, c) => {
    if (e.target.closest('button, input, a, label, textarea')) return;
    if (window.getSelection && String(window.getSelection())) return;
    setModal({ kind: 'detail', customer: c });
  };

  const typeChipCls = (t) => t === 'VIP' ? 'purple' : t === '潛客' ? 'warn' : 'accent';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Topbar
        crumbs={[{ label: '客戶管理' }]}
        tabs={[
          { id: '全部', label: '全部', count: counts.全部 },
          { id: '學員', label: '學員', count: counts.學員 },
          { id: 'VIP', label: 'VIP', count: counts.VIP },
        ]}
        activeTab={type} onTab={(v) => { setType(v); }}
        actions={<>
          <button className="btn sm" onClick={() => setModal({ kind: 'import' })}><Icon.Upload size={13}/> 匯入</button>
          <button className="btn primary sm" onClick={() => setModal({ kind: 'new' })}><Icon.Plus size={13}/> 新增客戶</button>
        </>}/>

      <ToolBar right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {hasFilter ? `${list.length} / ${customers.length} 位客戶` : `${customers.length} 位客戶`}
          </span>
          <button className="btn sm" onClick={() => setModal({ kind: 'export', scope: 'list' })}><Icon.Download size={13}/> 匯出</button>
        </div>}>
        <SearchBox value={q} onChange={setQ} placeholder="姓名、Email、電話、公司、課程…" width={260}/>
        <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }} title="排序方式">
          <option value="recent">加入時間：新→舊</option>
          <option value="enrollments">報名次數：多→少</option>
        </select>
        {hasFilter && <button className="btn sm ghost" onClick={() => { setQ(''); setType('全部'); }} style={{ color: 'var(--text-3)' }}><Icon.X size={12}/> 清除篩選</button>}
      </ToolBar>

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 960 }}>
          <thead><tr>
            <th style={{ width: 38, paddingLeft: 20 }}>
              <input type="checkbox" checked={allOnPage} ref={el => { if (el) el.indeterminate = !allOnPage && someOnPage; }} onChange={toggleAll}/>
            </th>
            <th style={{ minWidth: 150 }}>客戶</th>
            <th style={{ minWidth: 130 }}>公司 / 職稱</th>
            <th style={{ width: 80 }}>類型</th>
            <th style={{ minWidth: 190 }}>聯絡方式</th>
            <th style={{ minWidth: 170 }}>購買課程</th>
            <th style={{ minWidth: 150 }}>備註</th>
            <th style={{ width: 96 }}>最近聯繫</th>
            <th style={{ width: 112, textAlign: 'right', paddingRight: 20 }}>操作</th>
          </tr></thead>
          <tbody>
            {sorted.map(c => {
              const shown = (c.purchased || []).slice(0, 2);
              const extra = (c.purchased || []).length - shown.length;
              return (
              <tr key={c.id} className={`cust-row ${sel.has(c.id) ? 'sel' : ''}`} onClick={(e) => rowClick(e, c)}>
                <td style={{ paddingLeft: 20 }}><input type="checkbox" checked={sel.has(c.id)} onChange={() => toggleSel(c.id)}/></td>
                <td>
                  <button onClick={() => setModal({ kind: 'detail', customer: c })} style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text)', fontSize: 13 }} className="cust-name">{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }} title={idLabel}>{c.id}</div>
                  </button>
                </td>
                <td>
                  <div style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{c.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{c.title}</div>
                </td>
                <td><span className={`chip ${typeChipCls(c.type)}`}><span className="dot"/>{c.type}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}><Icon.Mail size={11}/><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap' }}><Icon.Phone size={10}/>{c.phone}</div>
                </td>
                <td>
                  {shown.length ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }} title={(c.purchased || []).join('、')}>
                      {shown.map(p => (
                        <span key={p} className="chip outline" style={{ maxWidth: 132 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
                        </span>
                      ))}
                      {extra > 0 && <span className="chip" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>+{extra}</span>}
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td onClick={e => e.stopPropagation()} style={{ verticalAlign: 'top', paddingTop: 9 }}><NoteCell value={c.note} tags={c.noteTags} pool={notePool} onDeletePool={removePoolTag} onSave={(note, tags) => updateNote(c.id, note, tags)}/></td>
                <td style={{ color: 'var(--text-2)', fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{window.DATA.fmtLastContact(c.lastContact)}</td>
                <td style={{ paddingRight: 20 }}>
                  <div className="row-actions" style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <button className="btn icon sm ghost" title="匯出" onClick={() => setModal({ kind: 'export', scope: 'single', customer: c })}><Icon.Download size={14}/></button>
                    <button className="btn icon sm ghost" title="修改" onClick={() => setModal({ kind: 'edit', customer: c })}><Icon.Edit size={14}/></button>
                    <button className="btn icon sm ghost" title="刪除" onClick={() => setModal({ kind: 'delete', customer: c })} style={{ color: 'var(--danger-text)' }}><Icon.Trash size={14}/></button>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>

        {list.length === 0 && (
          <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', marginBottom: 4 }}><Icon.Search size={18}/></span>
            <div style={{ fontSize: 13, fontWeight: 500 }}>沒有符合條件的客戶</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>試試調整搜尋關鍵字或類型篩選</div>
            {hasFilter && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => { setQ(''); setType('全部'); }}>清除篩選條件</button>}
          </div>
        )}
      </div>

      {/* 浮動批次操作列 */}
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

      {modal?.kind === 'new' && <NewCustomerModal onClose={() => setModal(null)} onSave={addCustomer}/>}
      {modal?.kind === 'detail' && <CustomerDetailDrawer customer={modal.customer} idLabel={idLabel} notePool={notePool} onDeletePool={removePoolTag} onMarkContacted={() => { setCustomers(cs => cs.map(c => c.id === modal.customer.id ? { ...c, lastContact: window.DATA.todayISO() } : c)); setModal((m) => ({ ...m, customer: { ...m.customer, lastContact: window.DATA.todayISO() } })); toast('已標記今天已聯繫'); }} onClose={() => setModal(null)} onEdit={(c) => setModal({ kind: 'edit', customer: c })} onExport={(c) => setModal({ kind: 'export', scope: 'single', customer: c })} onSaveNote={(note, tags) => { updateNote(modal.customer.id, note, tags); setModal((m) => ({ ...m, customer: { ...m.customer, note, noteTags: tags } })); toast('已更新備註'); }}/>}
      {modal?.kind === 'edit' && <EditCustomerModal customer={modal.customer} onClose={() => setModal(null)} onSave={saveCustomer}/>}
      {modal?.kind === 'delete' && <DeleteConfirm customer={modal.customer} onClose={() => setModal(null)} onConfirm={() => delCustomer(modal.customer.id)}/>}
      {modal?.kind === 'import' && <ImportCustomerModal onClose={() => setModal(null)} onImport={doImport}/>}
      {modal?.kind === 'batch' && <BatchEditModal count={sel.size} onClose={() => setModal(null)} onApply={applyBatch}/>}
      {modal?.kind === 'export' && <ExportCustomerModal scope={modal.scope} customer={modal.customer} idLabel={idLabel}
        selected={customers.filter(c => sel.has(c.id))} filtered={list} all={customers}
        onClose={() => setModal(null)} onDone={(msg) => { setModal(null); toast(msg); }}/>}
    </div>
  );
};

Object.assign(window, { CustomersModule });
