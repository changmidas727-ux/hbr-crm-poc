// ─────────────────────────────────────────────────────────────────────────────
// 課程場次編輯器：期 → 場次（日期/時間）→ 個案（主題・情境・講師・服務單位）
// 對應 HBR 個案共學會：每場通常安排 2 個個案，各由一位講師帶領
// 講師可從師資檔案（window.DATA.FACULTY）選用，選定後自動帶入服務單位
// ─────────────────────────────────────────────────────────────────────────────

// 講師輸入（串師資檔案）：輸入可搜尋、選定已有師資自動帶入單位；也可手打新講師
const FacultyInput = ({ value, onChange, dlId }) => {
  const FACULTY = window.DATA.FACULTY || [];
  return (
    <input className="input" list={dlId} value={value}
    onChange={(e) => {const name = e.target.value;const f = FACULTY.find((x) => x.name === name);onChange(f ? { facilitator: name, org: f.org } : { facilitator: name });}}
    placeholder="講師（輸入可搜尋師資檔案）" style={{ flex: 1, fontSize: 12.5 }} />);

};
const FacultyDatalist = ({ id, category }) =>
<datalist id={id}>
    {((window.DATA.facultyFor ? window.DATA.facultyFor(category) : window.DATA.FACULTY) || []).map((f) => <option key={f.id} value={f.name}>{f.org}</option>)}
  </datalist>;


const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const weekdayOf = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d) ? '' : WEEKDAYS[d.getDay()];
};

const emptyCase = () => ({ title: '', subtitle: '', facilitator: '', org: '' });
const emptySession = () => ({ date: '', time: '14:00–17:00', cases: [emptyCase()] });

const SessionPlanEditor = ({ sessions, setSessions, category }) => {
  const totalCases = sessions.reduce((s, ss) => s + ss.cases.length, 0);

  const addSession = () => setSessions([...sessions, emptySession()]);
  const removeSession = (i) => setSessions(sessions.filter((_, x) => x !== i));
  const setSession = (i, patch) => setSessions(sessions.map((s, x) => x === i ? { ...s, ...patch } : s));
  const addCase = (i) => setSession(i, { cases: [...sessions[i].cases, emptyCase()] });
  const removeCase = (i, ci) => setSession(i, { cases: sessions[i].cases.filter((_, x) => x !== ci) });
  const setCase = (i, ci, patch) => setSession(i, { cases: sessions[i].cases.map((c, x) => x === ci ? { ...c, ...patch } : c) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, lineHeight: 1.5 }}>
        <Icon.Info size={13} /> 依實際課表安排各場次與個案。個案共學會每場通常安排 2 個個案，各由一位講師帶領。可先留空，之後再於課程詳情補上。
      </div>
      <FacultyDatalist id="hbr-faculty-plan" category={category} />

      {sessions.length === 0 ?
      <div className="card" style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>尚未安排場次 — 點下方「新增場次」排入第一場，可後續補填

      </div> :

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s, i) =>
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
              {/* 場次標頭 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>第 {i + 1} 場</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <input className="input" type="date" value={s.date} onChange={(e) => setSession(i, { date: e.target.value })} style={{ width: 150, fontSize: 12.5 }} />
                  {s.date && <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>（{weekdayOf(s.date)}）</span>}
                  <input className="input" value={s.time} onChange={(e) => setSession(i, { time: e.target.value })} placeholder="14:00–17:00" style={{ width: 120, fontSize: 12.5 }} />
                </div>
                <button className="btn icon sm ghost" title="刪除場次" style={{ marginLeft: 'auto', color: 'var(--danger-text)' }} onClick={() => removeSession(i)}><Icon.Trash size={14} /></button>
              </div>

              {/* 個案清單 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {s.cases.map((c, ci) =>
            <div key={ci} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderBottom: ci < s.cases.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent-subtle)', borderRadius: 5, padding: '2px 6px', height: 'fit-content', marginTop: 2, flexShrink: 0 }}>個案 {ci + 1}</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input className="input" value={c.title} onChange={(e) => setCase(i, ci, { title: e.target.value })} placeholder="個案主題（例：堅持傳統？全面翻新？）" style={{ fontSize: 12.5 }} />
                      <input className="input" value={c.subtitle} onChange={(e) => setCase(i, ci, { subtitle: e.target.value })} placeholder="情境副標（例：餐廳品牌活化的路線之爭）" style={{ fontSize: 12.5 }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <FacultyInput value={c.facilitator} onChange={(patch) => setCase(i, ci, patch)} dlId="hbr-faculty-plan" />
                        <input className="input" value={c.org} onChange={(e) => setCase(i, ci, { org: e.target.value })} placeholder="服務單位 / 職稱" style={{ flex: 1.6, fontSize: 12.5 }} />
                      </div>
                    </div>
                    {s.cases.length > 1 && <button className="btn icon sm ghost" title="移除個案" style={{ color: 'var(--text-3)', flexShrink: 0 }} onClick={() => removeCase(i, ci)}><Icon.X size={13} /></button>}
                  </div>
            )}
                <div style={{ padding: '7px 12px' }}>
                  <button className="btn sm ghost" onClick={() => addCase(i)}><Icon.Plus size={12} /> 新增個案</button>
                </div>
              </div>
            </div>
        )}
        </div>
      }

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn" onClick={addSession}><Icon.Plus size={13} /> 新增場次</button>
        {sessions.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>共 {sessions.length} 場 · {totalCases} 個個案</span>}
      </div>
    </div>);

};

// 將編輯器的場次資料轉為系統場次格式（含 cases，並推導 topic / lecturer 以相容點名視圖）
const buildSessionList = (sessions) => sessions.
filter((s) => s.date || s.cases.some((c) => c.title.trim())).
map((s, i) => {
  const cases = s.cases.filter((c) => c.title.trim() || c.facilitator.trim());
  return {
    no: i + 1, date: s.date, weekday: weekdayOf(s.date), time: s.time,
    topic: cases.map((c) => c.title.trim()).filter(Boolean).join('／') || '（未填主題）',
    lecturer: cases.map((c) => c.facilitator.trim()).filter(Boolean).join('、'),
    cases: cases.map((c) => ({ title: c.title.trim(), subtitle: c.subtitle.trim(), facilitator: c.facilitator.trim(), org: c.org.trim() })),
    done: false
  };
});

Object.assign(window, { SessionPlanEditor, weekdayOf, buildSessionList, emptySession, emptyCase });

// 將既有場次（含日期）轉回編輯器形態，供「後續編輯單堂內容」使用
const sessionsToEditor = (list) => (list || []).map((s) => ({
  date: s.date || '',
  time: s.time || '14:00–17:00',
  cases: Array.isArray(s.cases) && s.cases.length ?
  s.cases.map((c) => ({ title: c.title || '', subtitle: c.subtitle || '', facilitator: c.facilitator || '', org: c.org || '' })) :
  [{ title: s.topic || '', subtitle: '', facilitator: s.lecturer || '', org: '' }]
}));

// 場次與個案編輯 Modal —— 從課程詳情／課程設定後續調整單堂內容
const SessionEditModal = ({ course, sessions, onClose, onSave }) => {
  const [draft, setDraft] = React.useState(() => sessionsToEditor(sessions));
  const built = buildSessionList(draft);
  // 保留每場原本的 done / next 狀態（依序對位）
  const merged = built.map((s, i) => {
    const prev = (sessions || [])[i] || {};
    return { ...s, done: prev.done || false, next: prev.next || false };
  });
  return (
    <Modal title="場次與個案內容" subtitle={course.id + ' · ' + course.name} onClose={onClose} width={660}
    footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <div style={{ flex: 1 }}></div>
        <button className="btn primary" onClick={() => onSave(merged)}><Icon.Check size={13} /> 儲存場次內容</button>
      </>}>
      <SessionPlanEditor sessions={draft} setSessions={setDraft} category={window.DATA.categoryOf(course)} />
    </Modal>);

};

Object.assign(window, { sessionsToEditor, SessionEditModal });

// 單堂編輯 Modal —— 在課程詳情頁右鍵某一堂，編輯該堂的日期、時間與個案
const SingleSessionEditModal = ({ course, session, label, onClose, onSave }) => {
  const [date, setDate] = React.useState(session.date || '');
  const [time, setTime] = React.useState(session.time || '14:00–17:00');
  const [cases, setCases] = React.useState(() =>
  Array.isArray(session.cases) && session.cases.length ?
  session.cases.map((c) => ({ title: c.title || '', subtitle: c.subtitle || '', facilitator: c.facilitator || '', org: c.org || '' })) :
  [{ title: session.topic || '', subtitle: '', facilitator: session.lecturer || '', org: '' }]
  );
  const setCase = (i, patch) => setCases(cases.map((c, x) => x === i ? { ...c, ...patch } : c));
  const addCase = () => setCases([...cases, emptyCase()]);
  const removeCase = (i) => setCases(cases.filter((_, x) => x !== i));

  const save = () => {
    const cleaned = cases.filter((c) => c.title.trim() || c.facilitator.trim()).map((c) => ({ title: c.title.trim(), subtitle: c.subtitle.trim(), facilitator: c.facilitator.trim(), org: c.org.trim() }));
    onSave({
      ...session, date, time, weekday: weekdayOf(date), cases: cleaned,
      topic: cleaned.map((c) => c.title).filter(Boolean).join('／') || '（未填主題）',
      lecturer: cleaned.map((c) => c.facilitator).filter(Boolean).join('、')
    });
  };

  return (
    <Modal title={'編輯' + (label || '此堂')} subtitle={course.id + ' · ' + course.name} onClose={onClose} width={620}
    footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <div style={{ flex: 1 }}></div>
        <button className="btn primary" onClick={save}><Icon.Check size={13} /> 儲存此堂</button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>上課日期</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
              {date && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>（{weekdayOf(date)}）</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>時間</div>
            <input className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="14:00–17:00" style={{ width: 140 }} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>個案</div>
          <FacultyDatalist id="hbr-faculty-single" category={window.DATA.categoryOf(course)} />
          <div className="card" style={{ overflow: 'hidden' }}>
            {cases.map((c, ci) =>
            <div key={ci} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderBottom: ci < cases.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent-subtle)', borderRadius: 5, padding: '2px 6px', height: 'fit-content', marginTop: 2, flexShrink: 0 }}>個案 {ci + 1}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input className="input" value={c.title} onChange={(e) => setCase(ci, { title: e.target.value })} placeholder="個案主題（例：堅持傳統？全面翻新？）" style={{ fontSize: 12.5 }} />
                  <input className="input" value={c.subtitle} onChange={(e) => setCase(ci, { subtitle: e.target.value })} placeholder="情境副標（例：餐廳品牌活化的路線之爭）" style={{ fontSize: 12.5 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <FacultyInput value={c.facilitator} onChange={(patch) => setCase(ci, patch)} dlId="hbr-faculty-single" />
                    <input className="input" value={c.org} onChange={(e) => setCase(ci, { org: e.target.value })} placeholder="服務單位 / 職稱" style={{ flex: 1.6, fontSize: 12.5 }} />
                  </div>
                </div>
                {cases.length > 1 && <button className="btn icon sm ghost" title="移除個案" style={{ color: 'var(--text-3)', flexShrink: 0 }} onClick={() => removeCase(ci)}><Icon.X size={13} /></button>}
              </div>
            )}
            <div style={{ padding: '7px 12px' }}>
              <button className="btn sm ghost" onClick={addCase}><Icon.Plus size={12} /> 新增個案</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>);

};

Object.assign(window, { SingleSessionEditModal });