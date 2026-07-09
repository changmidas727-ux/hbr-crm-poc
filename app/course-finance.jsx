// ─────────────────────────────────────────────────────────────────────────────
// 課程財務：11 項固定成本 + 雜支分項 · 毛利自動計算 · 學員名單／損益表 Excel 匯出
// ─────────────────────────────────────────────────────────────────────────────

// 11 項固定成本類別（雜支獨立處理為分項）
const FIXED_COST_CATEGORIES = [
  { id: 'lecturer',   label: '場地租賃費' },
  { id: 'venue',      label: '講師費' },
  { id: 'catering',   label: '硬體設備租賃用' },
  { id: 'materials',  label: '軟體與線上平台費' },
  { id: 'marketing',  label: '場地布置費' },
  { id: 'platform',   label: '固定行銷與廣告宣傳費' },
  { id: 'staff',      label: '工作人員費' },
  { id: 'media',      label: '攝錄影費' },
  { id: 'travel',     label: '交通住宿費' },
  { id: 'equipment',  label: '活動保險費' },
  { id: 'paymentFee', label: '金流手續費' },
];
// 完整 12 類（含雜支）— 供損益表等沿用
const COST_CATEGORIES = [...FIXED_COST_CATEGORIES, { id: 'misc', label: '雜支' }];

const fmtMoney = (n) => 'NT$ ' + Math.round(Number(n) || 0).toLocaleString('zh-TW');

// 雜支總額：優先採用分項清單 miscItems，否則回退舊的單一數字 misc
const miscItemsOf = (costs) => Array.isArray(costs?.miscItems) ? costs.miscItems : [];
const miscTotal = (costs) =>
  Array.isArray(costs?.miscItems)
    ? costs.miscItems.reduce((s, it) => s + (Number(it.amount) || 0), 0)
    : (Number(costs?.misc) || 0);

const calcFinance = (revenue, costs) => {
  const rev = Number(revenue) || 0;
  const fixed = FIXED_COST_CATEGORIES.reduce((s, cat) => s + (Number(costs?.[cat.id]) || 0), 0);
  const total = fixed + miscTotal(costs);
  const gross = rev - total;
  const margin = rev > 0 ? gross / rev : null;
  return { rev, total, gross, margin };
};

// ── 雜支分項編輯器：費用名稱 + 金額，逐筆加入，便於統計 ──
const MiscCostEditor = ({ costs, setCosts }) => {
  const items = miscItemsOf(costs);
  const subtotal = miscTotal(costs);
  const [draft, setDraft] = React.useState({ name: '', amount: '' });

  const commit = (next) => {
    const { misc, ...rest } = costs; // 寫入分項後移除舊的單一數字欄位
    setCosts({ ...rest, miscItems: next });
  };
  const add = () => {
    if (!draft.name.trim() || !draft.amount) return;
    commit([...items, { name: draft.name.trim(), amount: Number(draft.amount) }]);
    setDraft({ name: '', amount: '' });
  };
  const update = (i, k, v) => commit(items.map((it, x) => x === i ? { ...it, [k]: k === 'amount' ? v : v } : it));
  const removeAt = (i) => commit(items.filter((_, x) => x !== i));

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>雜支</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>分項填寫費用名稱與金額，便於統計</span>
      </div>

      {items.length > 0 && (
        <div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid var(--divider)' }}>
              <input className="input" value={it.name} onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="費用名稱" style={{ flex: 1.4, fontSize: 12.5 }}/>
              <input className="input" type="number" min="0" step="500" value={it.amount}
                onChange={(e) => update(i, 'amount', e.target.value)}
                placeholder="0" style={{ flex: 1, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}/>
              <button className="btn icon sm ghost" title="移除" style={{ color: 'var(--danger-text)' }} onClick={() => removeAt(i)}><Icon.X size={13}/></button>
            </div>
          ))}
        </div>
      )}

      {/* 新增列 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="費用名稱（例：保險、印刷、停車）" style={{ flex: 1.4, fontSize: 12.5 }}/>
        <input className="input" type="number" min="0" step="500" value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="金額" style={{ flex: 1, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}/>
        <button className="btn sm" disabled={!draft.name.trim() || !draft.amount}
          style={{ opacity: draft.name.trim() && draft.amount ? 1 : 0.5, flexShrink: 0 }} onClick={add}><Icon.Plus size={13}/> 加入</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{items.length} 筆雜支</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>雜支小計　{fmtMoney(subtotal)}</span>
      </div>
    </div>
  );
};

// ── 成本結構編輯器（新增課程用）：填金額即時算毛利 ──
const CostStructureEditor = ({ revenue, setRevenue, costs, setCosts, revenueLocked = false }) => {
  const fin = calcFinance(revenue, costs);
  const setCost = (id, v) => setCosts({ ...costs, [id]: v });
  const summary = [
    ...(revenueLocked ? [['營收（訂單加總）', fmtMoney(fin.rev), 'var(--text)']] : []),
    ['總成本', fmtMoney(fin.total), 'var(--text)'],
    ['毛利', fmtMoney(fin.gross), fin.gross >= 0 ? 'var(--success-text)' : 'var(--danger-text)'],
    ['毛利率', fin.margin != null ? (fin.margin * 100).toFixed(1) + '%' : '—', fin.margin == null ? 'var(--text-3)' : fin.margin >= 0 ? 'var(--success-text)' : 'var(--danger-text)'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!revenueLocked && (
        <Field label="預估營收（NT$）">
          <input className="input" type="number" min="0" step="1000" placeholder="0" value={revenue}
            onChange={(e) => setRevenue(e.target.value)} style={{ fontVariantNumeric: 'tabular-nums' }}/>
        </Field>
      )}
      <Field label="成本明細（填金額自動計算毛利）">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 12px' }}>
          {FIXED_COST_CATEGORIES.map(cat => (
            <label key={cat.id} style={{ display: 'block' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{cat.label}</div>
              <input className="input" type="number" min="0" step="1000" placeholder="0"
                value={costs[cat.id] ?? ''} onChange={(e) => setCost(cat.id, e.target.value)}
                style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}/>
            </label>
          ))}
        </div>
      </Field>
      <MiscCostEditor costs={costs} setCosts={setCosts}/>
      <div className="card" style={{ display: 'flex', alignItems: 'stretch', padding: 0, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
        {summary.map(([label, val, color], i) => (
          <div key={label} style={{ flex: 1, padding: '10px 14px', borderLeft: i ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Excel 匯出（HTML table → .xls，Excel 可直接開啟）──
const finEsc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const finDownload = (filename, tableHtml) => {
  const html = `<html><head><meta charset="UTF-8"></head><body>${tableHtml}</body></html>`;
  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const finRow = (cells, opts = {}) => '<tr>' + cells.map((c, i) =>
  `<td style="${opts.bold ? 'font-weight:bold;' : ''}${opts.indent && i === 0 ? 'padding-left:24px;' : ''}${i > 0 ? 'mso-number-format:\\#\\,\\#\\#0;' : ''}">${finEsc(c)}</td>`).join('') + '</tr>';

// 學員名單 Excel：該課程所有學員報名資料
const exportRosterXls = (course, roster) => {
  const head = `<tr>${['學員編號', '姓名', '公司', '職稱'].map(h => `<th>${finEsc(h)}</th>`).join('')}</tr>`;
  const body = roster.map(r => `<tr><td>${finEsc(r.id)}</td><td>${finEsc(r.name)}</td><td>${finEsc(r.company)}</td><td>${finEsc(r.title)}</td></tr>`).join('');
  const meta = `<table><tr><td><b>${finEsc(course.name)}（${finEsc(course.id)}）學員名單</b></td></tr><tr><td>課程期間：${finEsc(course.startDate)} ~ ${finEsc(course.endDate)} · 共 ${roster.length} 位學員</td></tr></table><br>`;
  finDownload(`學員名單_${course.id}.xls`, meta + `<table border="1"><thead>${head}</thead><tbody>${body}</tbody></table>`);
};

// 損益表 Excel：營收、11 項固定成本、雜支（含分項）、毛利
const exportPnlXls = (course) => {
  const costs = course.costs || {};
  const fin = calcFinance(course.revenue, costs);
  const pct = (n) => fin.rev > 0 ? (n / fin.rev * 100).toFixed(1) + '%' : '—';
  let rows = '';
  rows += finRow(['營業收入', fin.rev, '100.0%'], { bold: true });
  FIXED_COST_CATEGORIES.forEach(cat => { rows += finRow(['　' + cat.label, Number(costs[cat.id]) || 0, pct(Number(costs[cat.id]) || 0)]); });
  // 雜支：小計 + 分項明細
  const mItems = miscItemsOf(costs);
  const mTotal = miscTotal(costs);
  rows += finRow(['　雜支', mTotal, pct(mTotal)]);
  mItems.forEach(it => { rows += finRow(['　・' + (it.name || '未命名'), Number(it.amount) || 0, pct(Number(it.amount) || 0)], { indent: true }); });
  rows += finRow(['成本合計', fin.total, pct(fin.total)], { bold: true });
  rows += finRow(['毛利', fin.gross, pct(fin.gross)], { bold: true });
  rows += `<tr><td style="font-weight:bold;">毛利率</td><td>${fin.margin != null ? (fin.margin * 100).toFixed(1) + '%' : '—'}</td><td></td></tr>`;
  const head = `<tr><th>項目</th><th>金額（NT$）</th><th>佔營收</th></tr>`;
  const meta = `<table><tr><td><b>${finEsc(course.name)}（${finEsc(course.id)}）損益表</b></td></tr><tr><td>課程期間：${finEsc(course.startDate)} ~ ${finEsc(course.endDate)}</td></tr></table><br>`;
  finDownload(`損益表_${course.id}.xls`, meta + `<table border="1"><thead>${head}</thead><tbody>${rows}</tbody></table>`);
};

Object.assign(window, { COST_CATEGORIES, FIXED_COST_CATEGORIES, fmtMoney, calcFinance, miscItemsOf, miscTotal, MiscCostEditor, CostStructureEditor, exportRosterXls, exportPnlXls });
