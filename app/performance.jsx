// ─────────────────────────────────────────────────────────────────────────────
// 期數成效管理：三層結構
//  ① 商品（＝課程系列／類別）列表
//  ② 該商品的每一期課程（期別列表）
//  ③ 每一期底下兩張表（tab）：當期報名追蹤表 ／ 說明會成效追蹤表（僅個案共學會）
//  資料：報名追蹤依 person×期 動態判定（recruitingPool）；說明會成效走 perf store（每場獨立）
// ─────────────────────────────────────────────────────────────────────────────

const pct = (n, d) => d > 0 ? Math.round(n / d * 100) : null;
const pctStr = (n, d) => {const p = pct(n, d);return p == null ? '—' : p + '%';};

// 身分分類 → chip 樣式
const klassCls = (k) => k === '新潛客' ? 'accent' : k === '舊潛客' ? 'warn' : 'outline';

// ── 第一層：商品（類別）列表 ──
const PerfProductList = ({ onPick }) => {
  const courses = window.DATA.loadCourses();
  const cats = window.DATA.COURSE_CATEGORIES || [];
  const groups = cats.map((cat) => {
    const list = courses.filter((c) => window.DATA.categoryOf(c) === cat);
    return { cat, list, students: list.reduce((s, c) => s + (c.students || 0), 0) };
  }).filter((g) => g.list.length);
  // 也納入未對應類別的（保險）
  const known = new Set(cats);
  const others = courses.filter((c) => !known.has(window.DATA.categoryOf(c)));
  if (others.length) groups.push({ cat: '其他', list: others, students: others.reduce((s, c) => s + (c.students || 0), 0) });

  return (
    <div style={{ flex: 1, overflow: 'auto' }} className="thin-scroll">
      <PageHead title="期數成效管理" subtitle="以商品（課程系列）→ 期別 → 報名追蹤／說明會成效，檢視各期招生成效" />
      <div style={{ padding: '4px 20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {groups.map((g) => {
          const isICL = g.cat === '個案共學會';
          return (
            <button key={g.cat} onClick={() => onPick(g.cat)} className="card perf-card" style={{
              textAlign: 'left', padding: 0, cursor: 'pointer', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-elev)'
            }}>
              <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-subtle)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon.Book size={20} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.cat}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{isICL ? '含說明會成效追蹤' : '報名追蹤'}</div>
                </div>
                <Icon.ChevronRight size={16} />
              </div>
              <div style={{ display: 'flex', borderTop: '1px solid var(--divider)' }}>
                <div style={{ flex: 1, padding: '10px 16px' }}>
                  <div style={{ fontSize: 19, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{g.list.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>期別</div>
                </div>
                <div style={{ flex: 1, padding: '10px 16px', borderLeft: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: 19, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{g.students}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>累計學員</div>
                </div>
              </div>
            </button>);

        })}
      </div>
    </div>);

};

// ── 第二層：某商品的期別列表 ──
const PerfTermList = ({ category, onPick, onBack }) => {
  const courses = window.DATA.loadCourses().filter((c) => window.DATA.categoryOf(c) === category ||
  category === '其他' && !(window.DATA.COURSE_CATEGORIES || []).includes(window.DATA.categoryOf(c)));
  const suspended = window.DATA.loadSuspended();
  const sorted = [...courses].sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar crumbs={[{ label: '期數成效管理', onClick: onBack }, { label: category }]} />
      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 720 }}>
          <thead><tr>
            <th style={{ paddingLeft: 20, minWidth: 200 }}>期別 / 課程</th>
            <th style={{ width: 96 }}>狀態</th>
            <th style={{ width: 90, textAlign: 'right' }}>學員數</th>
            <th style={{ minWidth: 180 }}>課程期間</th>
            <th style={{ width: 84, textAlign: 'right' }}>池人數</th>
            <th style={{ width: 84, textAlign: 'right' }}>報名率</th>
            <th style={{ width: 110, textAlign: 'right' }}>成交率</th>
            <th style={{ width: 48, paddingRight: 20 }} />
          </tr></thead>
          <tbody>
            {sorted.map((c) => {
              const status = deriveCourseStatus(c, suspended);
              const pool = window.DATA.recruitingPool(c.id);
              const signups = pool.filter((r) => r.signup === '已報名').length;
              const deals = pool.filter((r) => r.deal === '已成交').length;
              const rate = (n) => pool.length ? Math.round(n / pool.length * 100) + '%' : '—';
              return (
                <tr key={c.id} className="cust-row" onClick={() => onPick(c.id)}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ fontWeight: 500 }}>{c.term || c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.id} · {c.name}</div>
                  </td>
                  <td><StatusChip status={status} />{status === '準備開課' && (() => { const d = daysToStart(c); return d != null && <span style={{ fontSize: 11, color: 'var(--warning-text)', marginLeft: 6, whiteSpace: 'nowrap' }}>{d === 0 ? '今日開課' : `還有 ${d} 天`}</span>; })()}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.students || 0}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{c.startDate || '—'} ～ {c.endDate || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pool.length || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rate(signups)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {pool.length > 0 ? (
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />{rate(deals)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{deals} 人成交</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ paddingRight: 20 }}><Icon.ChevronRight size={15} /></td>
                </tr>);

            })}
          </tbody>
        </table>
        {!sorted.length &&
        <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>此商品尚無期別資料</div>
        }
      </div>
    </div>);

};

// ── 報名追蹤池：匯入 Modal（潛客／舊客／外部）──
// (a) 從潛客管理匯入
const ProspectImportModal = ({ courseId, existingKeys, existingNames, onClose, onDone }) => {
  const [q, setQ] = React.useState('');
  const [src, setSrc] = React.useState('全部');
  const [st, setSt] = React.useState('全部');
  const [sel, setSel] = React.useState(new Set());
  const [markNew, setMarkNew] = React.useState(false);
  const SOURCES = window.DATA.PROSPECT_SOURCES || [];
  const STATUSES = window.DATA.PROSPECT_STATUSES || [];
  const rows = window.DATA.loadProspects().filter((p) =>
    (src === '全部' || (p.sources || []).includes(src)) &&
    (st === '全部' || p.status === st) &&
    (!q || (p.name + p.company + p.title + p.email).toLowerCase().includes(q.toLowerCase())));
  const inPool = (p) => existingKeys.has('P:' + p.id) || existingNames.has(p.name);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirm = () => {
    const chosen = window.DATA.loadProspects().filter((p) => sel.has(p.id));
    const members = chosen.map((p) => ({ refType: 'prospect', refId: p.id, name: p.name, company: p.company, title: p.title, email: p.email, phone: p.phone, klass: markNew ? '新潛客' : '舊潛客', sources: p.sources || [] }));
    const r = window.DATA.addPoolMembers(courseId, members, { markNew });
    onDone(`已加入 ${r.added} 位潛客${r.skipped ? `（略過 ${r.skipped} 位重複）` : ''}`);
  };
  return (
    <Modal title="從潛客管理匯入" subtitle="勾選要納入本期招生追蹤的潛客" onClose={onClose} width={680}
      footer={<>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', marginRight: 'auto', cursor: 'pointer' }}>
          <input type="checkbox" checked={markNew} onChange={(e) => setMarkNew(e.target.checked)} /> 標記為本期新潛客
        </label>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!sel.size} style={{ opacity: sel.size ? 1 : 0.5 }} onClick={confirm}><Icon.Plus size={13} /> 加入 {sel.size} 位</button>
      </>}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <SearchBox value={q} onChange={setQ} placeholder="姓名、公司、Email…" width={200} />
        <select className="input" value={src} onChange={(e) => setSrc(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }}><option value="全部">全部來源</option>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className="input" value={st} onChange={(e) => setSt(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }}><option value="全部">全部狀態</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      </div>
      <div className="card thin-scroll" style={{ maxHeight: 360, overflow: 'auto' }}>
        <table className="tbl" style={{ fontSize: 12.5 }}>
          <thead><tr><th style={{ width: 36, paddingLeft: 14 }}>{(() => {
            const ids = rows.filter((p) => !inPool(p)).map((p) => p.id);
            const allOn = ids.length > 0 && ids.every((id) => sel.has(id));
            return <input type="checkbox" checked={allOn} title="全選本頁" ref={(el) => { if (el) el.indeterminate = !allOn && ids.some((id) => sel.has(id)); }} onChange={() => setSel((s) => { const n = new Set(s); allOn ? ids.forEach((id) => n.delete(id)) : ids.forEach((id) => n.add(id)); return n; })} />;
          })()}</th><th>姓名</th><th>公司 / 職稱</th><th>來源</th><th>狀態</th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const dis = inPool(p);
              return (
                <tr key={p.id} style={{ opacity: dis ? 0.5 : 1, cursor: dis ? 'default' : 'pointer' }} onClick={() => !dis && toggle(p.id)}>
                  <td style={{ paddingLeft: 14 }}>{dis ? <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>已在池</span> : <input type="checkbox" checked={sel.has(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(p.id)} />}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Avatar name={p.name} size={22} /><span style={{ fontWeight: 500 }}>{p.name}</span></div></td>
                  <td><div>{p.company}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.title}</div></td>
                  <td>{(p.sources || []).slice(0, 2).map((s) => <span key={s} className="chip outline" style={{ height: 18, fontSize: 11, marginRight: 3 }}>{s}</span>)}</td>
                  <td><span className="chip" style={{ height: 18, fontSize: 11 }}>{p.status}</span></td>
                </tr>);
            })}
          </tbody>
        </table>
        {!rows.length && <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>沒有符合條件的潛客</div>}
      </div>
    </Modal>);
};

// (b) 從舊客匯入（曾購買、本期未報名）
const CustomerImportModal = ({ courseId, courseName, existingKeys, existingNames, onClose, onDone }) => {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(new Set());
  const candidates = window.DATA.loadCustomers().filter((c) => (c.purchased || []).length > 0 && !(c.purchased || []).includes(courseName));
  const rows = candidates.filter((c) => !q || (c.name + c.company + c.title + c.email).toLowerCase().includes(q.toLowerCase()));
  const inPool = (c) => existingKeys.has('C:' + c.id) || existingNames.has(c.name);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirm = () => {
    const chosen = candidates.filter((c) => sel.has(c.id));
    const members = chosen.map((c) => ({ refType: 'customer', refId: c.id, name: c.name, company: c.company, title: c.title, email: c.email, phone: c.phone, klass: '舊客未報名', sources: [] }));
    const r = window.DATA.addPoolMembers(courseId, members);
    onDone(`已加入 ${r.added} 位舊客${r.skipped ? `（略過 ${r.skipped} 位重複）` : ''}`);
  };
  return (
    <Modal title="從舊客匯入" subtitle="曾購買其他課程、本期尚未報名的顧客" onClose={onClose} width={640}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" disabled={!sel.size} style={{ opacity: sel.size ? 1 : 0.5 }} onClick={confirm}><Icon.Plus size={13} /> 加入 {sel.size} 位</button></>}>
      <div style={{ marginBottom: 12 }}><SearchBox value={q} onChange={setQ} placeholder="姓名、公司、Email…" width={220} /></div>
      <div className="card thin-scroll" style={{ maxHeight: 360, overflow: 'auto' }}>
        <table className="tbl" style={{ fontSize: 12.5 }}>
          <thead><tr><th style={{ width: 36, paddingLeft: 14 }}>{(() => {
            const ids = rows.filter((c) => !inPool(c)).map((c) => c.id);
            const allOn = ids.length > 0 && ids.every((id) => sel.has(id));
            return <input type="checkbox" checked={allOn} title="全選本頁" ref={(el) => { if (el) el.indeterminate = !allOn && ids.some((id) => sel.has(id)); }} onChange={() => setSel((s) => { const n = new Set(s); allOn ? ids.forEach((id) => n.delete(id)) : ids.forEach((id) => n.add(id)); return n; })} />;
          })()}</th><th>姓名</th><th>公司 / 職稱</th><th>已購買課程</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const dis = inPool(c);
              return (
                <tr key={c.id} style={{ opacity: dis ? 0.5 : 1, cursor: dis ? 'default' : 'pointer' }} onClick={() => !dis && toggle(c.id)}>
                  <td style={{ paddingLeft: 14 }}>{dis ? <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>已在池</span> : <input type="checkbox" checked={sel.has(c.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(c.id)} />}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Avatar name={c.name} size={22} /><span style={{ fontWeight: 500 }}>{c.name}</span></div></td>
                  <td><div>{c.company}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.title}</div></td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{(c.purchased || []).slice(0, 2).join('、')}{(c.purchased || []).length > 2 ? ` +${c.purchased.length - 2}` : ''}</td>
                </tr>);
            })}
          </tbody>
        </table>
        {!rows.length && <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>沒有符合條件的舊客</div>}
      </div>
    </Modal>);
};

// (c) 匯入外部名單（手動多列，建立潛客並納入本期池，klass=新潛客）
const ExternalImportModal = ({ courseId, onClose, onDone }) => {
  const SOURCES = window.DATA.PROSPECT_SOURCES || [];
  const blank = () => ({ name: '', company: '', title: '', email: '', phone: '', sources: [] });
  const [rows, setRows] = React.useState([blank(), blank()]);
  const setCell = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const toggleSrc = (i, s) => setRows(rows.map((r, j) => j === i ? { ...r, sources: r.sources.includes(s) ? r.sources.filter((x) => x !== s) : [...r.sources, s] } : r));
  const valid = rows.filter((r) => r.name.trim());
  const cellStyle = { width: '100%', border: 'none', background: 'transparent', font: 'inherit', fontSize: 12, outline: 'none', color: 'var(--text)', padding: '0 4px', height: 30 };
  const fileRef = React.useRef(null);
  // 下載匯入範本（CSV，UTF-8 含 BOM，來源以「｜」分隔）
  const downloadTemplate = () => {
    const header = ['姓名', '公司', '職稱', 'Email', '電話', '來源（多個以｜分隔）'];
    const sample = [
      ['王小明', '台積電', '處長', 'wang@example.com', '0912-345-678', 'Meta Ads｜活動開發'],
      ['陳美玄', '鴻海', '經理', 'chen@example.com', '0922-111-222', '舊生推薦'],
    ];
    const csv = '\uFEFF' + [header, ...sample].map((r) => r.map((c) => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = '外部名單匯入範本.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // 解析上傳的 CSV（支援引號欄位）→填入列
  const parseCsv = (text) => {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
    if (!lines.length) return [];
    const splitLine = (line) => {
      const out = []; let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
        else if (ch === '"') inQ = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
      }
      out.push(cur); return out;
    };
    let start = 0;
    const first = splitLine(lines[0]).join('');
    if (/姓名/.test(first) && /Email|電話|公司/.test(first)) start = 1; // 跳過標題列
    const known = new Set(SOURCES);
    return lines.slice(start).map((l) => {
      const c = splitLine(l).map((x) => x.trim());
      const srcRaw = (c[5] || '').split(/[｜|、;,]/).map((s) => s.trim()).filter(Boolean);
      return { name: c[0] || '', company: c[1] || '', title: c[2] || '', email: c[3] || '', phone: c[4] || '', sources: srcRaw.filter((s) => known.has(s)) };
    }).filter((r) => r.name);
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''));
      if (parsed.length) {
        const existingValid = rows.filter((r) => r.name.trim());
        setRows([...existingValid, ...parsed]);
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };
  const confirm = () => {
    let added = 0, skipped = 0, created = 0;
    valid.forEach((r) => {
      const cp = window.DATA.createProspectIfAbsent({ name: r.name.trim(), company: r.company.trim(), title: r.title.trim(), email: r.email.trim(), phone: r.phone.trim(), sources: r.sources });
      if (cp.created) created++;
      const res = window.DATA.addPoolMembers(courseId, [{ refType: 'prospect', refId: cp.id, name: r.name.trim(), company: r.company.trim(), title: r.title.trim(), email: r.email.trim(), phone: r.phone.trim(), klass: '新潛客', sources: r.sources }], { markNew: true });
      added += res.added; skipped += res.skipped;
    });
    onDone(`已加入 ${added} 位外部名單${created ? `（新建 ${created} 筆潛客）` : ''}${skipped ? `（略過 ${skipped} 位重複）` : ''}`);
  };
  return (
    <Modal title="匯入外部名單" subtitle="手動輸入名單，加入本期池並同步建立潛客資料" onClose={onClose} width={760}
      footer={<><span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 'auto' }}>將加入 {valid.length} 筆</span><button className="btn" onClick={onClose}>取消</button><button className="btn primary" disabled={!valid.length} style={{ opacity: valid.length ? 1 : 0.5 }} onClick={confirm}><Icon.Check size={13} /> 加入 {valid.length} 筆</button></>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
        <Icon.Info size={14} style={{ flexShrink: 0 }} />
        <span>可下載 CSV 範本填寫後上傳，一次匯入多筆；或直接在下方手動輸入。來源請用「｜」分隔。</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn sm" onClick={downloadTemplate}><Icon.Download size={13} /> 下載範本</button>
          <button className="btn sm" onClick={() => fileRef.current && fileRef.current.click()}><Icon.Upload size={13} /> 上傳 CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
        </div>
      </div>
      <div className="card thin-scroll" style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ fontSize: 12, minWidth: 700 }}>
          <thead><tr>
            <th style={{ paddingLeft: 12, width: 28 }}>#</th><th style={{ minWidth: 88 }}>姓名 *</th><th style={{ minWidth: 100 }}>公司</th><th style={{ minWidth: 84 }}>職稱</th><th style={{ minWidth: 140 }}>Email</th><th style={{ minWidth: 104 }}>電話</th><th style={{ minWidth: 160 }}>來源</th><th style={{ width: 32 }} />
          </tr></thead>
          <tbody>
            {rows.map((r, i) =>
            <tr key={i}>
                <td style={{ paddingLeft: 12, color: 'var(--text-3)' }}>{i + 1}</td>
                <td><input style={cellStyle} value={r.name} onChange={(e) => setCell(i, 'name', e.target.value)} placeholder="姓名" /></td>
                <td><input style={cellStyle} value={r.company} onChange={(e) => setCell(i, 'company', e.target.value)} placeholder="公司" /></td>
                <td><input style={cellStyle} value={r.title} onChange={(e) => setCell(i, 'title', e.target.value)} placeholder="職稱" /></td>
                <td><input style={cellStyle} value={r.email} onChange={(e) => setCell(i, 'email', e.target.value)} placeholder="email" /></td>
                <td><input style={cellStyle} value={r.phone} onChange={(e) => setCell(i, 'phone', e.target.value)} placeholder="電話" /></td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '4px 0' }}>
                    {SOURCES.map((s) => { const on = r.sources.includes(s); return <button key={s} type="button" onClick={() => toggleSrc(i, s)} style={{ padding: '2px 7px', borderRadius: 999, cursor: 'pointer', fontSize: 10.5, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)', color: on ? 'var(--accent-text)' : 'var(--text-3)' }}>{s}</button>; })}
                  </div>
                </td>
                <td>{rows.length > 1 && <button className="btn icon sm ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Icon.X size={13} /></button>}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--divider)' }}><button className="btn sm ghost" onClick={() => setRows([...rows, blank()])}><Icon.Plus size={13} /> 新增一列</button></div>
      </div>
    </Modal>);
};

// ── 一鍵帶入建議名單（確認式）：舊潛客(全部) + 舊客未報本期；可先篩來源 ──
const SuggestImportModal = ({ courseId, courseName, existingKeys, existingNames, onClose, onDone }) => {
  const SOURCES = window.DATA.PROSPECT_SOURCES || [];
  const [srcSel, setSrcSel] = React.useState(new Set(SOURCES)); // 預設全部來源
  const [incProspect, setIncProspect] = React.useState(true);
  const [incCustomer, setIncCustomer] = React.useState(true);
  const toggleSrc = (s) => setSrcSel((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  // 舊潛客候選：未在池中；有來源者需符合來源篩選（無來源者一律納入）
  const prospectCands = window.DATA.loadProspects()
    .filter((p) => !existingKeys.has('P:' + p.id) && !existingNames.has(p.name))
    .filter((p) => { const src = p.sources || []; return src.length === 0 || src.some((s) => srcSel.has(s)); });
  // 舊客未報本期：purchased 非空且不含本期課名；未在池中
  const customerCands = window.DATA.loadCustomers()
    .filter((c) => (c.purchased || []).length > 0 && !(c.purchased || []).includes(courseName))
    .filter((c) => !existingKeys.has('C:' + c.id) && !existingNames.has(c.name));

  const pCount = incProspect ? prospectCands.length : 0;
  const cCount = incCustomer ? customerCands.length : 0;
  const total = pCount + cCount;

  const confirm = () => {
    const members = [];
    if (incProspect) prospectCands.forEach((p) => members.push({ refType: 'prospect', refId: p.id, name: p.name, company: p.company, title: p.title, email: p.email, phone: p.phone, klass: '舊潛客', sources: p.sources || [] }));
    if (incCustomer) customerCands.forEach((c) => members.push({ refType: 'customer', refId: c.id, name: c.name, company: c.company, title: c.title, email: c.email, phone: c.phone, klass: '舊客未報名', sources: [] }));
    const r = window.DATA.addPoolMembers(courseId, members);
    onDone(`已帶入 ${r.added} 位建議名單${r.skipped ? `（略過 ${r.skipped} 位重複）` : ''}`);
  };

  const catRow = (on, setOn, label, count, hint) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 8, border: '1px solid var(--border)', background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)', cursor: 'pointer' }}>
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label} <span style={{ color: on ? 'var(--accent-text)' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{count} 位</span></div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</div>
      </div>
    </label>
  );

  return (
    <Modal title="一鍵帶入建議名單" subtitle="把「舊潛客」與「舊客（未報本期）」批次帶入本期追蹤" onClose={onClose} width={560}
      footer={<><button className="btn" onClick={onClose}>取消</button><button className="btn primary" disabled={!total} style={{ opacity: total ? 1 : 0.5 }} onClick={confirm}><Icon.Plus size={13} /> 確認帶入 {total} 位</button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>要帶入的身分</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catRow(incProspect, setIncProspect, '舊潛客', prospectCands.length, '既有潛客清單、尚未成交')}
            {catRow(incCustomer, setIncCustomer, '舊客未報名', customerCands.length, '曾購買其他課、後台無本期訂單')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12 }}>
          <Icon.Info size={14} style={{ flexShrink: 0 }} /> 新潛客請於「匯入外部名單」帶入並自行維護來源標籤。舊客報名後將由訂單匯入自動轉為已成交。
        </div>
      </div>
    </Modal>
  );
};

// 批量指定說明會場次 Modal
const BatchSeminarModal = ({ seminarOptions, count, onClose, onApply }) => {
  const [label, setLabel] = React.useState(seminarOptions[0] || '');
  const [status, setStatus] = React.useState('已通知');
  return (
    <Modal title="批量指定說明會場次" subtitle={`將套用到已勾選的 ${count} 人`} onClose={onClose} width={420}
      footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" disabled={!label} style={{ opacity: label ? 1 : 0.5 }} onClick={() => onApply(label, status)}><Icon.Check size={13} /> 套用到 {count} 人</button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="場次">
          <select className="input" value={label} onChange={(e) => setLabel(e.target.value)}>
            {seminarOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="狀態">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="已通知">已通知</option><option value="回覆出席">回覆出席</option><option value="已出席">已出席（簽到）</option><option value="未出席">未出席</option>
          </select>
        </Field>
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>已有同場紀錄者將被更新為此狀態；其他場次的紀錄不受影響。</div>
      </div>
    </Modal>
  );
};

// 說明會儲存格：平常只顯示精簡 chip（場次＋狀態色），點擊開 popover 編輯
const SEM_META = {
  '已出席': { dot: 'var(--success)', text: 'var(--success-text)', short: '出' },
  '未出席': { dot: 'var(--danger)', text: 'var(--danger-text)', short: '缺' },
  '回覆出席': { dot: 'var(--accent)', text: 'var(--accent-text)', short: '覆' },
  '已通知': { dot: 'var(--text-muted)', text: 'var(--text-2)', short: '知' },
};
const SeminarCell = ({ r, seminarOptions, setSem }) => {
  const [open, setOpen] = React.useState(false);
  const semNum = (lab) => { const m = /第(\d+)場/.exec(lab); return m ? +m[1] : 999; };
  const entries = Object.entries(r.sems || {}).sort((a, b) => semNum(a[0]) - semNum(b[0]));
  const rem = seminarOptions.filter((o) => !(r.sems || {})[o]);
  const shortLab = (lab) => lab === '未指定場次' ? '未指定' : lab.replace('說明會 ', '');
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} title="編輯說明會出席"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', minHeight: 26, padding: '3px 8px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`, background: open ? 'var(--accent-subtle)' : 'var(--bg-elev)' }}>
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        {entries.length === 0 ?
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>未指定</span> :
          entries.map(([lab, st]) => {
            const m = SEM_META[st] || SEM_META['已通知'];
            return (
              <span key={lab} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                <span style={{ color: lab === '未指定場次' ? 'var(--warning-text)' : 'var(--text-2)' }}>{shortLab(lab)}</span>
                <span style={{ color: m.text, fontWeight: 500 }}>{st}</span>
              </span>
            );
          })
        }
        </span>
        <Icon.ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (<>
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 51, width: 208, padding: 8, boxShadow: 'var(--shadow-menu)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', padding: '2px 4px 6px' }}>說明會出席紀錄</div>
          {entries.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '4px 4px 8px' }}>尚未指定場次</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {entries.map(([lab, st]) => (
              <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11.5, minWidth: 44, color: lab === '未指定場次' ? 'var(--warning-text)' : 'var(--text-2)' }}>{lab.replace('說明會 ', '')}</span>
                <select value={st} onChange={(e) => setSem(r, lab, e.target.value)} className="input" style={{ height: 26, fontSize: 11.5, flex: 1, paddingTop: 0, paddingBottom: 0, color: (SEM_META[st] || {}).text }}>
                  <option value="已通知">已通知</option><option value="回覆出席">回覆出席</option><option value="已出席">已出席</option><option value="未出席">未出席</option>
                </select>
                <button className="btn icon sm ghost" title="移除此場" style={{ width: 22, height: 22, flexShrink: 0 }} onClick={() => setSem(r, lab, null)}><Icon.X size={12} /></button>
              </div>
            ))}
          </div>
          {rem.length > 0 && (
            <select value="" onChange={(e) => e.target.value && setSem(r, e.target.value, '已出席')} className="input" style={{ height: 28, fontSize: 11.5, width: '100%', marginTop: 8 }}>
              <option value="">＋ 新增場次（預設已出席）</option>
              {rem.map((o) => <option key={o} value={o}>{o.replace('說明會 ', '')}</option>)}
            </select>
          )}
        </div>
      </>)}
    </div>
  );
};

// ── 第三層 · 報名追蹤表 ──
const EnrollTrackTable = ({ courseId, toast }) => {
  const [pool, setPool] = React.useState(() => window.DATA.recruitingPool(courseId));
  const [klass, setKlass] = React.useState('全部');
  const [sourceFilter, setSourceFilter] = React.useState('全部');
  const [q, setQ] = React.useState('');
  const [modal, setModal] = React.useState(null); // 'prospect' | 'customer' | 'external' | 'suggest' | 'batchSem'
  const [person, setPerson] = React.useState(null); // 人員詳細抽屜
  const [sel, setSel] = React.useState(() => new Set()); // 批量指定場次用勾選
  const [pendingRemove, setPendingRemove] = React.useState(null); // 移除確認 popup：{key,name}
  const SOURCES = window.DATA.PROSPECT_SOURCES || [];
  const CLASSES = window.DATA.RECRUIT_CLASSES || [];
  const seminarOptions = (window.DATA.loadPerf(courseId).seminars || []).map((s) => s.label);
  const course = window.DATA.loadCourses().find((c) => c.id === courseId);
  const courseName = course && course.name;
  // #4 防呆：超過招生期間（招生截止日；無則以開課日為界）不可再匯入名單
  const _today = window.DATA.todayISO();
  const recruitDeadline = (course && (course.recruitEnd || course.startDate)) || '';
  const recruitClosed = !!recruitDeadline && _today > recruitDeadline;
  const existingKeys = new Set(pool.map((m) => m.key));
  const existingNames = new Set(pool.map((m) => m.name));
  const importBtns = recruitClosed ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--warning-text)', background: 'var(--warning-subtle)', padding: '5px 10px', borderRadius: 8 }}>
      <Icon.Info size={13} /> 已超過招生期間（至 {recruitDeadline}），無法再匯入名單
    </span>
  ) : (
    <>
      <button className="btn sm" onClick={() => setModal('suggest')}><Icon.TrendingUp size={13} /> 一鍵帶入建議名單</button>
      <button className="btn sm" onClick={() => setModal('prospect')}><Icon.User size={13} /> 從潛客匯入</button>
      <button className="btn sm" onClick={() => setModal('customer')}><Icon.Users size={13} /> 從舊客匯入</button>
      <button className="btn sm" onClick={() => setModal('external')}><Icon.Upload size={13} /> 匯入外部名單</button>
    </>);

  // #3 每場獨立出席紀錄：r.sems = { 場次label: 狀態 }；改報別場只新增紀錄、不覆蓋舊場
  const setSem = (r, label, status) => {
    const sems = { ...(r.sems || {}) };
    if (status === null) delete sems[label]; else sems[label] = status;
    setTrack(r.key, { sems, seminar: undefined, semStatus: undefined });
  };

  const refresh = () => setPool(window.DATA.recruitingPool(courseId));
  const onImported = (msg) => { setModal(null); refresh(); if (msg) toast(msg); };
  const removeMember = (key, name) => { window.DATA.removePoolMember(courseId, key); refresh(); toast('已將 ' + name + ' 移出本期池'); };
  const setTrack = (key, patch) => {
    const perf = window.DATA.loadPerf(courseId);
    const track = { ...(perf.track || {}) };
    track[key] = { ...(track[key] || {}), ...patch };
    window.DATA.savePerf(courseId, { track });
    refresh();
  };

  const counts = React.useMemo(() => {
    const m = { 全部: pool.length };
    CLASSES.forEach((k) => {m[k] = pool.filter((r) => r.klass === k).length;});
    return m;
  }, [pool]);
  const dealCount = pool.filter((r) => r.deal === '已成交').length;
  const signupCount = pool.filter((r) => r.signup === '已報名').length;

  // 轉換漏斗（依目前身分分頁計算）：池內 → 參加說明會 → 已報名 → 已成交
  const isICL = window.DATA.categoryOf(course) === '個案共學會';
  const [stage, setStage] = React.useState(null); // null | 'attended' | 'signup' | 'deal'
  const attendedOf = (r) => Object.values(r.sems || {}).includes('已出席');
  const funnelBase = klass === '全部' ? pool : pool.filter((r) => r.klass === klass);
  const fAttended = funnelBase.filter(attendedOf).length;
  const fSignup = funnelBase.filter((r) => r.signup === '有意願' || r.signup === '已報名').length;
  const fDeal = funnelBase.filter((r) => r.signup === '已報名').length;
  const stages = [
    { id: null, label: '池內名單', n: funnelBase.length, hint: '本期追蹤對象' },
    ...(isICL ? [{ id: 'attended', label: '參加說明會', n: fAttended, hint: '點擊篩出席未報名' }] : []),
    { id: 'signup', label: '有意願', n: fSignup, hint: '點擊篩有意願未報名' },
    { id: 'deal', label: '已報名', n: fDeal, hint: '點擊篩已報名名單', success: true },
  ];
  const stageMatch = (r) => {
    if (!stage) return true;
    if (stage === 'attended') return attendedOf(r) && r.signup === '未報名';
    if (stage === 'signup') return r.signup === '有意願';
    return r.signup === '已報名';
  };

  // #2 狀態篩選（比來源更貨合實務：未/已成交、未參加說明會…）
  const [statusFilter, setStatusFilter] = React.useState('全部');
  const STATUS_FILTERS = {
    '全部': () => true,
    '未參加說明會': (r) => !attendedOf(r),
    '已參加說明會': (r) => attendedOf(r),
    '未報名': (r) => r.signup === '未報名',
    '有意願': (r) => r.signup === '有意願',
    '已報名': (r) => r.signup === '已報名',
  };

  const list = pool.filter((r) =>
  (klass === '全部' || r.klass === klass) && stageMatch(r) && (STATUS_FILTERS[statusFilter] || (() => true))(r) && (
  sourceFilter === '全部' || (r.sources || []).includes(sourceFilter)) && (
  !q || (r.name + r.company + r.title + r.email + r.phone).toLowerCase().includes(q.toLowerCase()))
  );
  const hasFilter = q !== '' || klass !== '全部' || sourceFilter !== '全部' || stage != null || statusFilter !== '全部';
  const clearFilters = () => { setQ(''); setKlass('全部'); setSourceFilter('全部'); setStage(null); setStatusFilter('全部'); };
  const listKeys = list.map((r) => r.key);
  const allSel = listKeys.length > 0 && listKeys.every((k) => sel.has(k));
  const toggleSel = (k) => setSel((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* 轉換漏斗：段間顯示轉換率；點段落篩出「卡在這段」的人（再點一次或點池內名單取消） */}
      {pool.length > 0 && (
      <div className="funnel-row" style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: '14px 20px 4px', flexWrap: 'wrap', rowGap: 8 }}>
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].n : null;
          const on = stage === s.id;
          return (
            <React.Fragment key={s.label}>
              {i > 0 && (
                <div className="funnel-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
                  <Icon.ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <button type="button" className="funnel-stage" onClick={() => setStage(on || s.id === null ? null : s.id)} title={s.hint}
                style={{ minWidth: 118, textAlign: 'left', padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)',
                  boxShadow: on ? 'none' : 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 11.5, whiteSpace: 'nowrap', color: on ? 'var(--accent-text)' : 'var(--text-3)' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 650, fontVariantNumeric: 'tabular-nums', color: s.success ? 'var(--success-text)' : 'var(--text)', lineHeight: 1.25 }}>{s.n}</div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      )}
      {pool.length > 0 && (
      <div style={{ padding: '6px 20px 0', fontSize: 11.5, color: 'var(--text-muted)' }}>點漏斗任一段可篩出停在該段的人；再點一次取消。</div>
      )}

      {/* 身分分類分頁（仿 Topbar tabs 風格） */}
      <div className="klass-tabs" style={{ display: 'flex', gap: 2, padding: '6px 16px 0', minHeight: 38, alignItems: 'stretch', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[{ id: '全部', label: '全部' }, ...CLASSES.map((k) => ({ id: k, label: k }))].map((t) =>
        <button key={t.id} onClick={() => setKlass(t.id)} style={{
          padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none',
          borderBottom: `2px solid ${klass === t.id ? 'var(--accent)' : 'transparent'}`,
          color: klass === t.id ? 'var(--text)' : 'var(--text-2)', fontSize: 13, fontWeight: klass === t.id ? 500 : 400, cursor: 'pointer', marginBottom: -1
        }}>{t.label}<span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>{counts[t.id] || 0}</span></button>
        )}
      </div>

      <ToolBar right={<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{hasFilter ? `${list.length} / ${pool.length} 位` : `${pool.length} 位`}</span>{pool.length > 0 && importBtns}</div>}>
        <SearchBox value={q} onChange={setQ} placeholder="姓名、公司、Email…" width={220} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }} title="狀態篩選">
          {Object.keys(STATUS_FILTERS).map((s) => <option key={s} value={s}>{s === '全部' ? '全部狀態' : s}</option>)}
        </select>
        <select className="input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }} title="來源篩選">
          <option value="全部">全部來源</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasFilter && <button className="btn sm ghost" onClick={clearFilters} style={{ color: 'var(--text-3)' }}><Icon.X size={12} /> 清除篩選</button>}
      </ToolBar>

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 920 }}>
          <thead><tr>
            <th style={{ width: 34, paddingLeft: 16 }}>{isICL && <input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(listKeys))} title="全選（批量指定說明會場次）" />}</th>
            <th style={{ minWidth: 140 }}>姓名</th>
            <th style={{ minWidth: 130 }}>公司 / 職稱</th>
            <th style={{ width: 110 }}>身分分類</th>
            <th style={{ minWidth: 150 }}>潛客來源</th>
            <th style={{ minWidth: 180 }}>聯絡方式</th>
            <th style={{ width: 150 }}>說明會</th>
            <th style={{ width: 110 }}>報名狀態</th>
            <th style={{ minWidth: 160 }}>當期備註</th>
            <th style={{ width: 52, paddingRight: 20 }} />
          </tr></thead>
          <tbody>
            {list.map((r) =>
            <tr key={r.key}>
                <td style={{ paddingLeft: 16 }}>{isICL && <input type="checkbox" checked={sel.has(r.key)} onChange={() => toggleSel(r.key)} />}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={r.name} size={26} />
                    <span className="person-link" style={{ fontWeight: 500, cursor: 'pointer' }} title="查看人員詳細" onClick={() => setPerson(r)}>{r.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.title}</div>
                </td>
                <td><span className={`chip ${klassCls(r.klass)}`}>{r.klass}</span></td>
                <td>
                  {(r.sources || []).length ?
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {r.sources.slice(0, 2).map((s) => <span key={s} className="chip outline" style={{ height: 18, fontSize: 11 }}>{s}</span>)}
                      {r.sources.length > 2 && <span className="chip" style={{ height: 18, fontSize: 11 }}>+{r.sources.length - 2}</span>}
                    </span> :
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}><Icon.Mail size={11} />{r.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap' }}><Icon.Phone size={10} />{r.phone}</div>
                </td>
                <td>
                  <SeminarCell r={r} seminarOptions={seminarOptions} setSem={setSem} />
                </td>
                <td style={{ paddingRight: 20 }}>
                  <select value={r.signup} onChange={(e) => setTrack(r.key, { signup: e.target.value })}
                className="input" style={{ height: 26, fontSize: 12, width: 92, paddingTop: 0, paddingBottom: 0, color: r.signup === '已報名' ? 'var(--success-text)' : r.signup === '有意願' ? 'var(--accent-text)' : 'var(--text)' }}>
                    <option value="未報名">未報名</option><option value="有意願">有意願</option><option value="已報名">已報名</option>
                  </select>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <ProspectNoteCell value={r.note} onSave={(note) => setTrack(r.key, { note })} />
                </td>
                <td style={{ paddingRight: 20 }}>
                  <button className="btn icon sm ghost" title="移出本期池" style={{ color: 'var(--danger-text)' }} onClick={() => setPendingRemove({ key: r.key, name: r.name })}><Icon.X size={14} /></button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!list.length &&
        <div style={{ padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', marginBottom: 4 }}><Icon.Users size={18} /></span>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{pool.length ? '沒有符合條件的招生對象' : '本期招生對象池為空'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{pool.length ? '試試調整漏斗階段、身分分類、來源或搜尋' : '從下方匯入招生對象，建立本期追蹤名單'}</div>
            {pool.length > 0 && hasFilter && <button className="btn sm" style={{ marginTop: 8 }} onClick={clearFilters}>清除篩選</button>}
            {!pool.length && <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>{importBtns}</div>}
          </div>
        }
      </div>

      {/* 批量指定說明會場次：勾選多人後浮出 */}
      {sel.size > 0 && (
        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink, #1f2933)', color: '#fff', borderRadius: 999, padding: '8px 10px 8px 16px', boxShadow: 'var(--shadow-lg)' }}>
          <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>已選 {sel.size} 人</span>
          <button className="btn sm" onClick={() => setModal('batchSem')}><Icon.Calendar size={13} /> 批量指定說明會場次</button>
          <button className="btn sm" style={{ color: 'var(--danger-text)' }} onClick={() => setModal('batchRemove')}><Icon.X size={13} /> 移出本期池</button>
          <button className="btn sm ghost" style={{ color: '#fff' }} onClick={() => setSel(new Set())}>清除選取</button>
        </div>
      )}

      {modal === 'batchSem' && (
        <BatchSeminarModal seminarOptions={seminarOptions} count={sel.size}
          onClose={() => setModal(null)}
          onApply={(label, status) => {
            const perf = window.DATA.loadPerf(courseId);
            const track = { ...(perf.track || {}) };
            pool.filter((r) => sel.has(r.key)).forEach((r) => {
              const sems = { ...(r.sems || {}) };
              sems[label] = status;
              track[r.key] = { ...(track[r.key] || {}), sems };
            });
            window.DATA.savePerf(courseId, { track });
            setModal(null); setSel(new Set()); refresh();
            toast(`已將 ${sel.size} 人指定至 ${label}（${status}）`);
          }} />
      )}

      {modal === 'batchRemove' && (
        <Modal title="批量移出本期追蹤名單" subtitle={`已選 ${sel.size} 人`} onClose={() => setModal(null)} width={420}
          footer={<>
            <button className="btn" onClick={() => setModal(null)}>取消</button>
            <button className="btn primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => {
              sel.forEach((k) => window.DATA.removePoolMember(courseId, k));
              const n = sel.size; setModal(null); setSel(new Set()); refresh();
              toast(`已將 ${n} 人移出本期池`);
            }}><Icon.X size={13} /> 確認移除 {sel.size} 人</button>
          </>}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            將把這 <b>{sel.size}</b> 人移出本期招生追蹤池（僅移出本期，不會删除底層客戶／潛客資料）。如需再次追蹤，可重新匯入。
          </div>
        </Modal>
      )}

      {modal === 'suggest' && <SuggestImportModal courseId={courseId} courseName={courseName} existingKeys={existingKeys} existingNames={existingNames} onClose={() => setModal(null)} onDone={onImported} />}
      {modal === 'prospect' && <ProspectImportModal courseId={courseId} existingKeys={existingKeys} existingNames={existingNames} onClose={() => setModal(null)} onDone={onImported} />}
      {modal === 'customer' && <CustomerImportModal courseId={courseId} courseName={courseName} existingKeys={existingKeys} existingNames={existingNames} onClose={() => setModal(null)} onDone={onImported} />}
      {modal === 'external' && <ExternalImportModal courseId={courseId} onClose={() => setModal(null)} onDone={onImported} />}
      {person && <PersonDetailDrawer person={person} onClose={() => setPerson(null)} />}
      {pendingRemove && (
        <Modal title="移出本期追蹤名單" subtitle={pendingRemove.name} onClose={() => setPendingRemove(null)} width={420}
          footer={<>
            <button className="btn" onClick={() => setPendingRemove(null)}>取消</button>
            <button className="btn primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { removeMember(pendingRemove.key, pendingRemove.name); setPendingRemove(null); }}><Icon.X size={13} /> 確認移除</button>
          </>}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            將把 <b>{pendingRemove.name}</b> 移出本期招生追蹤池（僅移出本期，不會刪除底層客戶／潛客資料）。如需再次追蹤，可重新匯入。
          </div>
        </Modal>
      )}
    </div>);

};

// ── 人員詳細抽屜（共用入口）：依身分開客戶／潛客詳細抽屜（唯讀，無修改/匯出鈕）──
const PersonDetailDrawer = ({ person, onClose }) => {
  const custs = window.DATA.loadCustomers();
  const pros = window.DATA.loadProspects();
  let cust = null, pro = null;
  if (person.refType === 'customer') cust = custs.find((c) => c.id === person.refId);
  else pro = pros.find((p) => p.id === person.refId);
  // 底層可能已轉換（潛客→顧客）或依姓名回退
  if (!cust && !pro) { cust = custs.find((c) => c.name === person.name); }
  if (!cust && !pro) { pro = pros.find((p) => p.name === person.name); }
  if (cust) return <CustomerDetailDrawer customer={cust} onClose={onClose} />;
  if (pro) return <ProspectDetailDrawer prospect={pro} onClose={onClose} />;
  return null;
};

// ── 單場說明會名單抽屜：出席名單＝事實來源，外層數字由此推導 ──
const SeminarRosterDrawer = ({ courseId, seminar, onClose, onChanged, toast }) => {
  const [tick, setTick] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const [filter, setFilter] = React.useState('全部');
  const [q, setQ] = React.useState('');
  const [person, setPerson] = React.useState(null); // 第二層：人員詳細抽屜
  const [form, setForm] = React.useState({ name: '', company: '', phone: '' });
  const pool = window.DATA.recruitingPool(courseId);
  const rows = pool.filter((r) => (r.sems || {})[seminar.label] != null);
  const statOf = (r) => r.sems[seminar.label] || '已出席';
  const matches = (r) => !q || (r.name + ' ' + (r.company || '')).toLowerCase().includes(q.trim().toLowerCase());
  const setSemStatus = (r, status) => {
    const perf = window.DATA.loadPerf(courseId);
    const cur = perf.track[r.key] || {};
    const sems = { ...(r.sems || {}), [seminar.label]: status };
    window.DATA.savePerf(courseId, { track: { ...perf.track, [r.key]: { ...cur, sems, seminar: undefined, semStatus: undefined } } });
    setTick((t) => t + 1); onChanged();
  };
  const GROUPS = [
    { st: '已出席', label: '已出席（簽到）', color: 'var(--success-text)' },
    { st: '回覆出席', label: '回覆出席・待簽到', color: 'var(--accent-text)' },
    { st: '已通知', label: '已通知・待電訪確認', color: 'var(--text-2)' },
    { st: '未出席', label: '未出席', color: 'var(--danger-text)' },
  ];
  const attended = rows.filter((r) => statOf(r) === '已出席');
  const deals = attended.filter((r) => r.deal === '已成交').length;
  const addWalkIn = () => {
    if (!form.name.trim()) return;
    const cp = window.DATA.createProspectIfAbsent({ name: form.name.trim(), company: form.company.trim(), phone: form.phone.trim(), sources: ['活動開發'] });
    window.DATA.addPoolMembers(courseId, [{ refType: 'prospect', refId: cp.id, name: form.name.trim(), company: form.company.trim(), title: '', email: '', phone: form.phone.trim(), klass: '新潛客', sources: ['活動開發'] }], { markNew: true });
    const perf = window.DATA.loadPerf(courseId);
    const key = cp.id ? 'P:' + cp.id : 'E:' + form.name.trim();
    const cur = perf.track[key] || {};
    window.DATA.savePerf(courseId, { track: { ...perf.track, [key]: { ...cur, sems: { ...(cur.sems || {}), [seminar.label]: '已出席' } } } });
    setTick((t) => t + 1); onChanged();
    setForm({ name: '', company: '', phone: '' }); setAdding(false);
    toast('已新增現場出席：' + form.name.trim() + '（同步建立潛客並入池）');
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.28)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="cust-drawer" style={{ width: 460, maxWidth: '94vw', height: '100%', background: 'var(--bg-elev)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{seminar.label}　出席名單</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{seminar.date || ''}　通知 {rows.length}　出席 {attended.length}　成交 {deals}</div>
          </div>
          <button className="btn icon sm ghost" onClick={onClose}><Icon.X size={15} /></button>
        </div>
        <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SearchBox value={q} onChange={setQ} placeholder="搜尋姓名、公司…" width="100%" />
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['全部', '已出席', '回覆出席', '已通知', '未出席'].map((f) => {
            const n = f === '全部' ? rows.length : rows.filter((r) => statOf(r) === f).length;
            const on = filter === f;
            return (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: on ? 600 : 400, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-subtle)' : 'var(--bg-elev)', color: on ? 'var(--accent-text)' : 'var(--text-2)' }}>{f} {n}</button>
            );
          })}
          </div>
        </div>
        <div className="thin-scroll" style={{ flex: 1, overflow: 'auto', padding: '10px 20px 16px' }}>
          {rows.length === 0 && <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>尚無人指定參加本場；至「當期報名追蹤」指定，或於下方新增現場出席。</div>}
          {rows.length > 0 && rows.filter((r) => (filter === '全部' || statOf(r) === filter) && matches(r)).length === 0 && <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>{q ? '沒有符合搜尋的人員' : '此狀態目前沒有人'}</div>}
          {GROUPS.filter((g) => filter === '全部' || g.st === filter).map((g) => {
            const list = rows.filter((r) => statOf(r) === g.st && matches(r));
            if (!list.length) return null;
            return (
              <div key={g.st} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: g.color, margin: '8px 0 6px' }}>{g.label}　{list.length} 人</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.map((r) => (
                    <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <Avatar name={r.name} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}><span className="person-link" style={{ cursor: 'pointer' }} title="查看人員詳細" onClick={() => setPerson(r)}>{r.name}</span> <span className="chip outline" style={{ height: 17, fontSize: 10.5, marginLeft: 4 }}>{r.klass}</span>{r.deal === '已成交' && <span className="chip success" style={{ height: 17, fontSize: 10.5, marginLeft: 4 }}>已成交</span>}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.company}{r.phone ? '　' + r.phone : ''}</div>
                      </div>
                      <select value={statOf(r)} onChange={(e) => setSemStatus(r, e.target.value)} className="input" style={{ height: 26, fontSize: 11.5, width: 96, paddingTop: 0, paddingBottom: 0, flexShrink: 0 }}>
                        <option value="已通知">已通知</option><option value="回覆出席">回覆出席</option><option value="已出席">已出席</option><option value="未出席">未出席</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: '1px solid var(--divider)', padding: '12px 20px' }}>
          {!adding ?
            <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAdding(true)}><Icon.Plus size={13} /> 新增現場出席（名單外）</button> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>新增現場出席　<span style={{ color: 'var(--text-3)', fontWeight: 400 }}>將同步建立潛客並加入本期追蹤名單</span></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" placeholder="姓名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1, height: 30, fontSize: 12.5 }} />
                <input className="input" placeholder="公司" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={{ flex: 1, height: 30, fontSize: 12.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" placeholder="電話" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ flex: 1, height: 30, fontSize: 12.5 }} />
                <button className="btn sm" onClick={() => setAdding(false)}>取消</button>
                <button className="btn primary sm" disabled={!form.name.trim()} style={{ opacity: form.name.trim() ? 1 : 0.5 }} onClick={addWalkIn}><Icon.Check size={12} /> 加入</button>
              </div>
            </div>
          }
        </div>
        {person && <PersonDetailDrawer person={person} onClose={() => setPerson(null)} />}
      </div>
    </div>
  );
};

// ── 第三層 · 說明會成效追蹤表（僅個案共學會）──
// 數字由「當期報名追蹤表」自動彙總（以人為事實來源）；點場次列→出席名單抽屜（簽到／現場新增皆在名單內完成）
const SeminarPerfTable = ({ courseId, toast }) => {
  const [tick, setTick] = React.useState(0);
  const [drawer, setDrawer] = React.useState(null); // seminar object
  const perf = window.DATA.loadPerf(courseId);
  const seminars = perf.seminars || [];
  // 自動彙總：每場由池內每人的「每場獨立紀錄 sems」算出（改報別場不影響舊場紀錄）
  const poolRows = window.DATA.recruitingPool(courseId);
  const calc = seminars.map((s) => {
    const rows = poolRows.filter((r) => (r.sems || {})[s.label] != null);
    const stat = (r) => r.sems[s.label];
    const notified = rows.length;
    const replied = rows.filter((r) => ['回覆出席', '已出席'].includes(stat(r))).length;
    const attended = rows.filter((r) => stat(r) === '已出席').length;
    const deals = rows.filter((r) => stat(r) === '已出席' && r.deal === '已成交').length;
    return { notified, replied, attended, deals };
  });
  const sumC = (key) => calc.reduce((a, c) => a + c[key], 0);
  const tNotified = sumC('notified'),tReplied = sumC('replied'),tAttended = sumC('attended'),tDeals = sumC('deals');
  // 舊資料相容：'未指定場次'（升級前只記已參加、無場次）需至追蹤表改指定實際場次才計入該場
  const legacyAttended = poolRows.filter((r) => (r.sems || {})['未指定場次'] != null);
  const unassigned = poolRows.filter((r) => !Object.keys(r.sems || {}).length).length + legacyAttended.length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 本期各場彙總 */}
      <div className="kpi-row" style={{ display: 'flex', gap: 10, padding: '14px 20px 4px', flexWrap: 'wrap' }}>
        <KPI label="說明會場次" value={`${seminars.length} 場`} />
        <KPI label="累計通知數" value={tNotified} />
        <KPI label="累計回覆出席" value={tReplied} hint={`回覆率 ${pctStr(tReplied, tNotified)}`} />
        <KPI label="累計實際出席" value={tAttended} hint={`出席率 ${pctStr(tAttended, tReplied)}`} />
        <KPI label="累計成交" value={tDeals} accent="var(--success-text)" hint={`轉換率 ${pctStr(tDeals, tAttended)}`} />
        {unassigned > 0 && <KPI label="尚未指定場次" value={unassigned} hint="池內未指定說明會場次的人數" />}
      </div>

      <div style={{ margin: '8px 20px 6px', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 22, rowGap: 4 }}>
          {[
            ['通知數', '該場被指定的人數'],
            ['回覆出席', '狀態≥回覆出席'],
            ['實際出席', '狀態＝已出席（簽到）'],
            ['成交數', '已出席且已成交'],
            ['出席率', '實際出席 ÷ 回覆出席'],
            ['轉換率', '成交 ÷ 實際出席'],
          ].map(([term, def]) => (
            <span key={term} style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{term}</span>
              <span style={{ color: 'var(--text-3)' }}>{def}</span>
            </span>
          ))}
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>數字由追蹤表自動彙總；點任一場→開出席名單（簽到／新增現場出席）</span>
        </div>
      </div>

      {legacyAttended.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 20px 6px', padding: '8px 12px', borderRadius: 8, background: 'var(--warning-subtle)', color: 'var(--warning-text)', fontSize: 12 }}>
          <Icon.Info size={14} style={{ flexShrink: 0 }} /> {legacyAttended.length} 人有「未指定場次」的出席紀錄（{legacyAttended.map((r) => r.name).join('、')}），尚未計入任一場；請至「當期報名追蹤」補指定場次。
        </div>
      )}

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        <table className="tbl" style={{ minWidth: 820 }}>
          <thead><tr>
            <th style={{ paddingLeft: 20, minWidth: 150 }}>場次</th>
            <th style={{ width: 96, textAlign: 'right' }}>通知數</th>
            <th style={{ width: 96, textAlign: 'right' }}>回覆出席</th>
            <th style={{ width: 96, textAlign: 'right' }}>實際出席</th>
            <th style={{ width: 80, textAlign: 'right' }}>成交數</th>
            <th style={{ width: 88, textAlign: 'right' }}>出席率</th>
            <th style={{ width: 88, textAlign: 'right' }}>轉換率</th>
            <th style={{ width: 96, paddingRight: 20 }} />
          </tr></thead>
          <tbody>
            {seminars.map((s, i) => {
            const c = calc[i];
            return (
            <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDrawer(s)} title="查看出席名單">
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ fontWeight: 500 }}>{s.label}</div>
                  {s.date && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{s.date}</div>}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.notified}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.replied}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{c.attended}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.deals}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{pctStr(c.attended, c.replied)}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--success-text)' }}>{pctStr(c.deals, c.attended)}</td>
                <td style={{ textAlign: 'right', paddingRight: 20 }}><button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); setDrawer(s); }}>名單 <Icon.ChevronRight size={12} /></button></td>
              </tr>);
            })}
          </tbody>
        </table>
        {!seminars.length &&
        <div style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>此期未設定說明會場次（可於建立／編輯課程時設定）</div>
        }

        <TermComparison courseId={courseId} />
      </div>

      {drawer && <SeminarRosterDrawer courseId={courseId} seminar={drawer} onClose={() => setDrawer(null)} onChanged={() => setTick((t) => t + 1)} toast={toast} />}
    </div>);

};

// ── 歷期比較：同商品各期 總出席／總成交／出席率／轉換率，與上一期差異 ──
const TermComparison = ({ courseId }) => {
  const courses = window.DATA.loadCourses();
  const me = courses.find((c) => c.id === courseId);
  if (!me) return null;
  const cat = window.DATA.categoryOf(me);
  const terms = courses.filter((c) => window.DATA.categoryOf(c) === cat)
    .sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')));
  // 使用者可選擇要比較的期別（下拉複選；本期永遠納入）；期數會不斷新增，預設只帶最近 5 期
  const [selected, setSelected] = React.useState(() => new Set([...terms.slice(-5).map((c) => c.id), courseId]));
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const toggleTerm = (id) => {
    if (id === courseId) return; // 本期不可取消
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const stats = terms.filter((c) => selected.has(c.id)).map((c) => {
    const pr = window.DATA.recruitingPool(c.id);
    const labels = (window.DATA.loadPerf(c.id).seminars || []).map((s) => s.label);
    // 以「人×場」紀錄彙總（sems）；未指定場次不計入
    let replied = 0, attended = 0, deals = 0, total = 0;
    pr.forEach((r) => {
      Object.entries(r.sems || {}).forEach(([lab, st]) => {
        if (!labels.includes(lab)) return;
        total++;
        if (['回覆出席', '已出席'].includes(st)) replied++;
        if (st === '已出席') { attended++; if (r.deal === '已成交') deals++; }
      });
    });
    const hasData = total > 0;
    const attRate = replied ? attended / replied : null;
    const convRate = attended ? deals / attended : null;
    return { id: c.id, label: c.term || c.name, hasData, attended, deals, attRate, convRate };
  });
  const anyData = terms.some((c) => window.DATA.recruitingPool(c.id).some((r) => Object.keys(r.sems || {}).length > 0));
  if (!anyData) return null;
  const pct = (v) => v == null ? '—' : Math.round(v * 100) + '%';
  const Delta = ({ cur, prev }) => {
    if (cur == null || prev == null) return null;
    const d = Math.round((cur - prev) * 100);
    if (!d) return <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 4 }}>─</span>;
    return <span style={{ fontSize: 10.5, fontWeight: 600, marginLeft: 4, color: d > 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>{d > 0 ? '▲' : '▼'}{Math.abs(d)}</span>;
  };
  let prev = null;
  return (
    <div style={{ padding: '18px 20px 24px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>歷期比較　<span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--text-3)' }}>{cat}各期說明會總成效</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 22, rowGap: 4, margin: '6px 0 2px' }}>
        {[
          ['出席率', '總出席 ÷ 回覆出席'],
          ['轉換率', '總成交 ÷ 總出席'],
          ['▲▼差異', '與上一期（已勾選中）相比，百分點'],
        ].map(([term, def]) => (
          <span key={term} style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{term}</span>
            <span style={{ color: 'var(--text-3)' }}>{def}</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 2px' }}>
        <div style={{ position: 'relative' }}>
          <button type="button" className="btn sm" onClick={() => setPickerOpen((o) => !o)}>
            <Icon.Filter size={12} /> 選擇比較期別（{selected.size}/{terms.length}） <Icon.ChevronDown size={12} />
          </button>
          {pickerOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setPickerOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 61, width: 240, maxHeight: 260, overflow: 'auto', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 6 }} className="thin-scroll">
                <div style={{ display: 'flex', gap: 6, padding: '4px 8px 8px', borderBottom: '1px solid var(--divider)', marginBottom: 4 }}>
                  <button type="button" className="btn sm ghost" onClick={() => setSelected(new Set(terms.map((c) => c.id)))}>全選</button>
                  <button type="button" className="btn sm ghost" onClick={() => setSelected(new Set([courseId]))}>清除</button>
                </div>
                {[...terms].reverse().map((c) => {
                  const on = selected.has(c.id);
                  const isMe = c.id === courseId;
                  return (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: isMe ? 'default' : 'pointer', fontSize: 12.5, opacity: isMe ? 0.75 : 1 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <input type="checkbox" checked={on} disabled={isMe} onChange={() => toggleTerm(c.id)} />
                      <span style={{ flex: 1 }}>{c.term || c.name}</span>
                      {isMe && <span className="chip" style={{ height: 16, fontSize: 10 }}>本期</span>}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>預設帶入最近 5 期；本期固定納入</span>
      </div>
      <table className="tbl" style={{ maxWidth: 640, marginTop: 6 }}>
        <thead><tr>
          <th style={{ paddingLeft: 12 }}>期別</th>
          <th style={{ width: 84, textAlign: 'right' }}>總出席</th>
          <th style={{ width: 84, textAlign: 'right' }}>總成交</th>
          <th style={{ width: 110, textAlign: 'right' }}>出席率</th>
          <th style={{ width: 110, textAlign: 'right', paddingRight: 12 }}>轉換率</th>
        </tr></thead>
        <tbody>
          {stats.map((s) => {
            const row = (
              <tr key={s.id} style={s.id === courseId ? { background: 'var(--accent-subtle)' } : undefined}>
                <td style={{ paddingLeft: 12, fontWeight: s.id === courseId ? 600 : 400 }}>{s.label}{s.id === courseId && <span className="chip" style={{ height: 17, fontSize: 10.5, marginLeft: 6 }}>本期</span>}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.hasData ? s.attended : '—'}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.hasData ? s.deals : '—'}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct(s.attRate)}{s.hasData && <Delta cur={s.attRate} prev={prev && prev.attRate} />}</td>
                <td style={{ textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--success-text)' }}>{pct(s.convRate)}{s.hasData && <Delta cur={s.convRate} prev={prev && prev.convRate} />}</td>
              </tr>
            );
            if (s.hasData) prev = s;
            return row;
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── 第三層容器：期 詳情（兩 tab）──
const PerfTermDetail = ({ courseId, category, onBackProduct, onBackTerm, toast }) => {
  const course = window.DATA.loadCourses().find((c) => c.id === courseId);
  const isICL = window.DATA.categoryOf(course) === '個案共學會';
  const status = course && deriveCourseStatus(course, window.DATA.loadSuspended());
  const [tab, setTab] = React.useState('enroll');
  React.useEffect(() => {if (!isICL && tab === 'seminar') setTab('enroll');}, [isICL]);
  const tabs = [{ id: 'enroll', label: '當期報名追蹤', icon: <Icon.Users size={14} /> }];
  if (isICL) tabs.push({ id: 'seminar', label: '說明會成效', icon: <Icon.TrendingUp size={14} /> });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar
        crumbs={[{ label: '期數成效管理', onClick: onBackProduct }, { label: category, onClick: onBackTerm }, { label: course && (course.term || course.name) || courseId }]}
        actions={course && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{course.startDate || '—'} ～ {course.endDate || '—'}</span>
            {status && <StatusChip status={status} />}
            {status === '準備開課' && (() => { const d = daysToStart(course); return d != null && <span style={{ fontSize: 12, color: 'var(--warning-text)', whiteSpace: 'nowrap' }}>{d === 0 ? '今日開課' : `還有 ${d} 天開課`}</span>; })()}
          </div>
        )}
        tabs={tabs} activeTab={tab} onTab={setTab} />
      {tab === 'enroll' ? <EnrollTrackTable courseId={courseId} toast={toast} /> : <SeminarPerfTable courseId={courseId} toast={toast} />}
    </div>);

};

// ── 模組進入點：管理三層導覽 ──
const PerformanceModule = ({ toast }) => {
  const [view, setView] = React.useState({ level: 'product', category: null, courseId: null });
  if (view.level === 'product') return <PerfProductList onPick={(cat) => setView({ level: 'term', category: cat, courseId: null })} />;
  if (view.level === 'term') return <PerfTermList category={view.category} onBack={() => setView({ level: 'product' })} onPick={(courseId) => setView({ level: 'detail', category: view.category, courseId })} />;
  return <PerfTermDetail courseId={view.courseId} category={view.category} toast={toast}
  onBackProduct={() => setView({ level: 'product' })} onBackTerm={() => setView({ level: 'term', category: view.category })} />;
};

Object.assign(window, { PerformanceModule });