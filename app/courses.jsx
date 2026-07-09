// ─────────────────────────────────────────────────────────────────────────────
// 課程管理：全部課程（期）清單 · Excel 匯入流程 · 新增課程 · 場次列表
// ─────────────────────────────────────────────────────────────────────────────

// 共用：課程表格，點列進入細節頁；右鍵可複製課程
const CourseTable = ({ courses, onOpen, onDelete, onContext }) => {
  return (
    <table className="tbl">
      <thead><tr>
        <th style={{ paddingLeft: 20, width: 120 }}>課程代碼</th>
        <th>課程名稱</th>
        <th style={{ textAlign: 'right', width: 90 }}>學員人數</th>
        <th style={{ width: 200 }}>課程起訖日</th>
        <th style={{ width: 92 }}>狀態</th>
        <th style={{ width: onDelete ? 84 : 56 }} />
      </tr></thead>
      <tbody>
        {courses.map((c) => {
          return (
            <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(c.id)}
              onContextMenu={onContext ? (e) => { e.preventDefault(); onContext(c, e.clientX, e.clientY); } : undefined}>
              <td style={{ paddingLeft: 20, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{c.id}</td>
              <td><div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{c.name}</div></td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.students}</td>
              <td style={{ color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{c.startDate} ~ {c.endDate}</td>
              <td><StatusChip status={c.status} /></td>
              <td style={{ paddingRight: 12 }}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn icon sm ghost" title="查看細節" onClick={(e) => {e.stopPropagation();onOpen(c.id);}}><Icon.ChevronRight size={15} /></button>
                  {onDelete && <button className="btn icon sm ghost" title="刪除課程" style={{ color: 'var(--danger-text)' }} onClick={(e) => {e.stopPropagation();onDelete(c);}}><Icon.Trash size={14} /></button>}
                </div>
              </td>
            </tr>);

        })}
      </tbody>
    </table>);

};

const CoursesModule = ({ nav, setNav, toast }) => {
  const { COURSES } = window.DATA;
  const [courses, setCourses] = React.useState(() => window.DATA.loadCourses());
  React.useEffect(() => { window.DATA.saveCourses(courses); }, [courses]);
  const [q, setQ] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('全部');
  const [catFilter, setCatFilter] = React.useState('全部');
  const [yearFilter, setYearFilter] = React.useState('全部');
  const [importing, setImporting] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null); // course
  const [ctxMenu, setCtxMenu] = React.useState(null); // { course, x, y }
  const [dupFrom, setDupFrom] = React.useState(null); // 複製來源課程
  const [editing, setEditing] = React.useState(null); // 編輯中的課程

  // 停課名單（手動設定，持久化）；其餘狀態依日期自動判定
  const [suspended, setSuspended] = React.useState(() => window.DATA.loadSuspended());
  const setSuspendedPersist = (next) => {
    setSuspended(next);
    window.DATA.saveSuspended(next);
  };

  const updateCourse = (id, patch) => setCourses((cs) => { const next = cs.map((c) => c.id === id ? { ...c, ...patch } : c); window.DATA.saveCourses(next); return next; });

  if (nav.courseId) return <CourseDetailView nav={nav} setNav={setNav} toast={toast} courses={courses} updateCourse={updateCourse} suspended={suspended} setSuspended={setSuspendedPersist} />;

  const withStatus = courses.map((c) => ({ ...c, status: deriveCourseStatus(c, suspended) }));
  const STATUS_ORDER = ['招生中', '準備開課', '上課中', '已結案', '停課'];
  const statusCounts = { '全部': withStatus.length };
  STATUS_ORDER.forEach((s) => { statusCounts[s] = withStatus.filter((c) => c.status === s).length; });
  const list = withStatus.filter((c) =>
    (statusFilter === '全部' || c.status === statusFilter) &&
    (catFilter === '全部' || window.DATA.categoryOf(c) === catFilter) &&
    (yearFilter === '全部' || (c.startDate || '').slice(0, 4) === yearFilter) &&
    (!q || (c.name + c.id).toLowerCase().includes(q.toLowerCase()))
  );
  const hasFilter = q !== '' || statusFilter !== '全部' || catFilter !== '全部' || yearFilter !== '全部';
  const clearAll = () => { setQ(''); setStatusFilter('全部'); setCatFilter('全部'); setYearFilter('全部'); };
  // 年度選項：動態推導——2022 起算，到「今年」與所有課程開始年份的最大值（跨年或建立未來年度課程會自動出現）
  const courseYears = courses.map((c) => parseInt((c.startDate || '').slice(0, 4), 10)).filter(Boolean);
  const startYear = Math.min(2022, ...courseYears);
  const endYear = Math.max(new Date().getFullYear(), ...courseYears);
  const YEARS = [];
  for (let y = endYear; y >= startYear; y--) YEARS.push(String(y));
  const statusDot = (s) => (
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s === '上課中' ? 'var(--success)' : s === '招生中' ? 'var(--info)' : s === '準備開課' ? 'var(--warning, var(--warn, #d97706))' : s === '停課' ? 'var(--danger)' : 'var(--text-muted)' }} />
  );

  const delCourse = (id) => {
    setCourses(courses.filter((c) => c.id !== id));
    setDeleting(null);
    toast('已刪除課程');
  };

  const addCourse = (v) => {
    setCourses([{ sessions: 0, makeupDeadline: '—', venue: '—', lead: '—', ...v }, ...courses]);
    if (v.suspend) {
      const next = new Set(suspended); next.add(v.id); setSuspendedPersist(next);
    }
    setAdding(false);
    setDupFrom(null);
    toast('已建立課程「' + v.name + '」');
  };

  const saveEdit = (v, origId) => {
    setCourses((cs) => cs.map((c) => c.id === origId ? { ...c, ...v } : c));
    const next = new Set(suspended);
    v.suspend ? next.add(v.id) : next.delete(v.id);
    if (origId !== v.id) next.delete(origId);
    setSuspendedPersist(next);
    setEditing(null);
    toast('已儲存課程「' + v.name + '」');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar crumbs={[{ label: '課程管理' }]}
      tabs={[
        { id: '全部', label: '全部', count: statusCounts['全部'] },
        ...STATUS_ORDER.map((s) => ({ id: s, label: s, count: statusCounts[s], icon: statusDot(s) })),
      ]}
      activeTab={statusFilter} onTab={setStatusFilter}
      actions={<>
          <button className="btn sm" onClick={() => setImporting(true)}><Icon.Upload size={13} /> 匯入課程（Excel）</button>
          <button className="btn primary sm" onClick={() => setAdding(true)}><Icon.Plus size={13} /> 新增課程</button>
        </>} />
      <ToolBar>
        <SearchBox value={q} onChange={setQ} placeholder="課程名稱、代碼…" width={200} />
        <select className="input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }}>
          <option value="全部">全部類別</option>
          {(window.DATA.COURSE_CATEGORIES || []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ width: 'auto', height: 28, fontSize: 12.5, paddingTop: 0, paddingBottom: 0 }}>
          <option value="全部">全部年度</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {hasFilter && <button className="btn sm ghost" onClick={clearAll} style={{ color: 'var(--text-3)' }}><Icon.X size={12} /> 清除篩選</button>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{hasFilter ? `${list.length} / ${courses.length} 門課程` : `共 ${courses.length} 門課程`}</span>
      </ToolBar>
      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
        {list.length === 0 ? (
          <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', marginBottom: 4 }}><Icon.Book size={18} /></span>
            <div style={{ fontSize: 13, fontWeight: 500 }}>沒有符合條件的課程</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{statusFilter !== '全部' ? `目前沒有「${statusFilter}」的課程` : '試試調整搜尋關鍵字'}</div>
            {hasFilter && <button className="btn sm" style={{ marginTop: 8 }} onClick={clearAll}>清除篩選條件</button>}
          </div>
        ) : (
          <CourseTable courses={list} onOpen={(id) => setNav({ ...nav, view: 'courses', courseId: id })} onDelete={(c) => setDeleting(c)} onContext={(c, x, y) => setCtxMenu({ course: c, x, y })} />
        )}
      </div>

      {/* 右鍵選單：編輯／複製／刪除課程 */}
      {ctxMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setCtxMenu(null)} onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }}>
          <div className="card" style={{
            position: 'fixed', left: Math.min(ctxMenu.x, window.innerWidth - 190), top: Math.min(ctxMenu.y, window.innerHeight - 168),
            width: 180, padding: 4, boxShadow: 'var(--shadow-lg)', background: 'var(--bg-elev)', zIndex: 91,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '5px 10px 4px', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctxMenu.course.id} · {ctxMenu.course.name}</div>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
              onClick={() => { setEditing(ctxMenu.course); setCtxMenu(null); }}>
              <Icon.Edit size={13}/> 編輯課程
            </button>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
              onClick={() => { setDupFrom(ctxMenu.course); setCtxMenu(null); }}>
              <Icon.Copy size={13}/> 複製課程
            </button>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--danger-text)' }}
              onClick={() => { setDeleting(ctxMenu.course); setCtxMenu(null); }}>
              <Icon.Trash size={13}/> 刪除課程
            </button>
          </div>
        </div>
      )}
      {importing && <ImportCourseModal onClose={() => setImporting(false)} onDone={() => {setImporting(false);toast('已模擬匯入課程與場次');}} />}
      {adding && <NewCourseModal courses={courses} onClose={() => setAdding(false)} onSave={addCourse} />}
      {dupFrom && <NewCourseModal courses={courses} initial={dupFrom} onClose={() => setDupFrom(null)} onSave={addCourse} />}
      {editing && <NewCourseModal courses={courses} initial={editing} mode="edit" onClose={() => setEditing(null)} onSave={saveEdit} />}
      {deleting && <DeleteCourseConfirm course={deleting} onClose={() => setDeleting(null)} onConfirm={() => delCourse(deleting.id)} />}
    </div>);

};

// ── 場次列表（課程詳情）──
const CourseDetailView = ({ nav, setNav, toast, courses, updateCourse, suspended, setSuspended }) => {
  const c = (courses || window.DATA.loadCourses()).find((x) => x.id === nav.courseId);
  const sessions = window.DATA.sessionsOf(c.id);
  const [settings, setSettings] = React.useState(false);
  const [editSessions, setEditSessions] = React.useState(false);
  const [sessCtx, setSessCtx] = React.useState(null);
  const [editOne, setEditOne] = React.useState(null);
  const [addStudents, setAddStudents] = React.useState(false);
  const [cancelledNos, setCancelledNos] = React.useState(() => window.DATA.loadCancelledSessions(c.id));
  const toggleCancel = (no) => {
    const next = new Set(cancelledNos);
    next.has(no) ? next.delete(no) : next.add(no);
    setCancelledNos(next);
    window.DATA.saveCancelledSessions(c.id, next);
    toast(next.has(no) ? `第 ${no} 堂已取消` : `第 ${no} 堂已恢復`);
  };
  const [kpiCtx, setKpiCtx] = React.useState(null); // 已停用
  const status = deriveCourseStatus(c, suspended);

  const toggleSuspend = () => {
    const next = new Set(suspended);
    suspended.has(c.id) ? next.delete(c.id) : next.add(c.id);
    setSuspended(next);
    toast(suspended.has(c.id) ? '已取消停課，狀態恢復自動更新' : '已設為停課');
  };

  // 以目前顯示的場次為基底（種子課程會先實體化到 sessionsList），套用變更並重編堂次
const commitSessions = (list) => {
    const renum = list.map((s, i) => ({ ...s, no: i + 1 }));
    updateCourse(c.id, { sessionsList: renum, sessions: renum.length });
  };
  const saveOne = (idx, edited) => { commitSessions(sessions.map((s, i) => i === idx ? edited : s)); setEditOne(null); toast('已儲存第 ' + (idx + 1) + ' 堂'); };
  const deleteOne = (idx) => { commitSessions(sessions.filter((_, i) => i !== idx)); setSessCtx(null); toast('已刪除第 ' + (idx + 1) + ' 堂'); };
  // 新增學員（後台訂單匯入）：寫 course.orders，同步 students（筆數）與 revenue（金額加總）；
  // 名單 enrolledFor / 出席率 / 成效 recruitingPool 都走同一份 course.orders，毋需另建資料源
  const saveStudents = (orders) => {
    const revenue = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    updateCourse(c.id, { orders, students: orders.length, revenue });
    // 潛客→顧客轉換：訂單比中潛客者轉為顧客，並於本期報名追蹤池標記已成交
    const conv = window.DATA.convertProspectsByOrders(c.id, orders);
    setAddStudents(false);
    toast(conv && conv.converted
      ? '已更新學員（' + orders.length + ' 位）；' + conv.converted + ' 位潛客已轉為顧客'
      : '已更新學員（' + orders.length + ' 位）');
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar crumbs={[
      { label: '課程管理', onClick: () => setNav({ ...nav, courseId: null }) },
      { label: c.name }]
      } actions={<>
        <button className="btn sm" onClick={() => setEditSessions(true)}><Icon.Plus size={13} /> 新增單堂課程</button>
        <button className="btn sm" onClick={() => setAddStudents(true)}><Icon.Users size={13} /> 新增學員</button>
        <button className={`btn sm${suspended.has(c.id) ? ' danger' : ''}`} style={suspended.has(c.id) ? { background: 'var(--danger-subtle)', color: 'var(--danger-text)', borderColor: 'var(--danger-text)' } : {}} onClick={toggleSuspend}>{suspended.has(c.id) ? '復課' : '停課'}</button>
        <button className="btn sm" onClick={() => { exportPnlXls(c); toast('已匯出損益表（損益表_' + c.id + '.xls）'); }}><Icon.FileText size={13} /> 損益表</button>
      </>} />
      {/* 課程摘要 KPI */}
      <div className="kpi-row" style={{ display: 'flex', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--divider)', flexWrap: 'wrap' }}>
        <KPI label="學員人數" value={c.students} />
        <KPI label="場次數" value={c.sessions} />
        <KPI label="補課截止" value={c.makeupDeadline} accent="var(--warning-text)" />
        <KPI label="主講" value={c.lead} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>狀態</div>
          <StatusChip status={status} />
        </div>
      </div>
      {status === '停課' &&
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: 'var(--danger-subtle)', color: 'var(--danger-text)', fontSize: 12.5, borderBottom: '1px solid var(--divider)' }}>
          <Icon.Info size={14} /> 此課程目前為停課狀態。取消停課後，狀態會依起訖日期自動更新。
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={toggleSuspend}>取消停課</button>
        </div>
      }
      {sessions.length === 0 ?
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 10 }}>尚未建立場次</div>
            <button className="btn sm" onClick={() => setEditSessions(true)}><Icon.Plus size={13} /> 編輯場次與個案</button>
          </div>
        </div> :

      <div className="thin-scroll" style={{ flex: 1, overflow: 'auto' }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ paddingLeft: 20, width: 64 }}>堂次</th><th>上課日期</th><th>主題</th><th>主講</th><th>狀態</th>
            </tr></thead>
            <tbody>
              {sessions.map((s) => {
              const isCancelled = cancelledNos.has(s.no);
              return (
                <tr key={s.no} style={{ cursor: 'pointer', opacity: isCancelled ? 0.55 : 1, background: isCancelled ? 'var(--bg-subtle)' : undefined }} onClick={() => setEditOne({ session: s, index: sessions.indexOf(s) })}
                  onContextMenu={updateCourse ? (e) => { e.preventDefault(); setSessCtx({ session: s, index: sessions.indexOf(s), x: e.clientX, y: e.clientY }); } : undefined}>
                    <td style={{ paddingLeft: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>第 {s.no} 堂</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{s.date}（{s.weekday}）<span style={{ color: 'var(--text-3)', fontSize: 11 }}>{s.time}</span></td>
                    <td>{Array.isArray(s.cases) && s.cases.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {s.cases.map((cs, ci) => (
                          <div key={ci}>
                            <span style={{ fontWeight: 500 }}>{cs.title || '（未填主題）'}</span>
                            {cs.subtitle && <span style={{ color: 'var(--text-3)', fontSize: 11, marginLeft: 6 }}>{cs.subtitle}</span>}
                          </div>
                        ))}
                      </div>
                    ) : s.topic}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{Array.isArray(s.cases) && s.cases.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {s.cases.map((cs, ci) => <div key={ci} style={{ whiteSpace: 'nowrap' }}>{cs.facilitator || '—'}</div>)}
                      </div>
                    ) : s.lecturer}</td>
                    <td>{isCancelled ? <span className="chip warn">已取消</span> : s.done ? <span className="chip success"><span className="dot" />已完成</span> : s.next ? <span className="chip info">即將開課</span> : <span className="chip">未開始</span>}</td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>
      }
      {settings && <CourseSettingsModal course={c} status={status} suspended={suspended} setSuspended={setSuspended} toast={toast} onClose={() => setSettings(false)} onEditSessions={updateCourse ? () => { setSettings(false); setEditSessions(true); } : null} />}
      {editSessions && <SessionEditModal course={c} sessions={sessions} onClose={() => setEditSessions(false)} onSave={(list) => { updateCourse(c.id, { sessionsList: list, sessions: list.length }); setEditSessions(false); toast('已更新場次內容（共 ' + list.length + ' 場）'); }} />}
      {editOne && <SingleSessionEditModal course={c} session={editOne.session} label={'第 ' + (editOne.index + 1) + ' 堂'} onClose={() => setEditOne(null)} onSave={(ed) => saveOne(editOne.index, ed)} />}
      {addStudents && <AddStudentsModal course={c} onClose={() => setAddStudents(false)} onSave={saveStudents} />}

      {/* KPI 右鍵 - 已移除 */}

      {/* 堂次右鍵選單：編輯／點名／停課／刪除 */}
      {sessCtx && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setSessCtx(null)} onContextMenu={(e) => { e.preventDefault(); setSessCtx(null); }}>
          <div className="card" style={{
            position: 'fixed', left: Math.min(sessCtx.x, window.innerWidth - 200), top: Math.min(sessCtx.y, window.innerHeight - 160),
            width: 190, padding: 4, boxShadow: 'var(--shadow-lg)', background: 'var(--bg-elev)', zIndex: 91,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '5px 10px 4px', fontSize: 11, color: 'var(--text-3)' }}>第 {sessCtx.index + 1} 堂 · {sessCtx.session.date || '未排日期'}</div>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
              onClick={() => { setEditOne({ session: sessCtx.session, index: sessCtx.index }); setSessCtx(null); }}>
              <Icon.Edit size={13}/> 編輯此堂內容
            </button>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
              onClick={() => { toggleCancel(sessCtx.session.no); setSessCtx(null); }}>
              <Icon.Info size={13}/> {cancelledNos.has(sessCtx.session.no) ? '恢復此堂' : '取消此堂'}
            </button>
            <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--danger-text)' }}
              onClick={() => deleteOne(sessCtx.index)}>
              <Icon.Trash size={13}/> 刪除此堂
            </button>
          </div>
        </div>
      )}
    </div>);

};

// ── 新增學員（後台訂單匯入）Modal ──
//  現階段唯一學員資料來源：沿用 StudentOrdersEditor 的系統匯入（importOnly），讀 BACKEND_ORDERS，
//  一筆訂單＝一位學員；同一商品避免重複匯入（imported set）。手動增刪修留待下階段與點名頁名單整合。
const AddStudentsModal = ({ course, onClose, onSave }) => {
  const [students, setStudents] = React.useState(() => (course.orders || []).map((o) => ({ ...o })));
  const total = students.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  return (
    <Modal title="新增學員（後台訂單匯入）" subtitle={course.id + ' · ' + course.name} onClose={onClose} width={640}
      footer={<>
        <button className="btn" onClick={onClose}>取消</button>
        <button className="btn primary" onClick={() => onSave(students)}><Icon.Check size={13} /> 儲存學員（{students.length} 位）</button>
      </>}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--info-subtle)', color: 'var(--info-text)', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
        <Icon.Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>學員以後台訂單批次匯入為唯一來源：一筆訂單對應一位學員，訂單金額加總＝課程營收。</span>
      </div>
      <StudentOrdersEditor students={students} setStudents={setStudents} importOnly />
    </Modal>
  );
};

// ── 課程設定：停課開關＋狀態自動更新規則說明 ──
const CourseSettingsModal = ({ course: c, status, suspended, setSuspended, toast, onClose, onEditSessions }) => {
  const isSuspended = suspended.has(c.id);
  const toggle = () => {
    const next = new Set(suspended);
    isSuspended ? next.delete(c.id) : next.add(c.id);
    setSuspended(next);
    toast(isSuspended ? '已取消停課，狀態恢復自動更新' : '已設為停課');
  };
  const rules = [
  ['招生中', '今天早於招生截止（無則以開課日為界）'],
  ['準備開課', '招生截止後、尚未到開課日（' + (c.startDate || '—') + '）'],
  ['上課中', '今天介於開課日與結課日之間'],
  ['已結案', '今天晚於結課日（' + c.endDate + '）']];

  return (
    <Modal title="課程設定" subtitle={c.id + ' · ' + c.name} onClose={onClose} width={480}
    footer={<button className="btn primary" onClick={onClose}>完成</button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>停課</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.6 }}>停課期間狀態固定顯示「停課」，不受日期影響；取消後恢復自動更新。</div>
          </div>
          <button role="switch" aria-checked={isSuspended} onClick={toggle} style={{
            width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: isSuspended ? 'var(--danger)' : 'var(--bg-active)', position: 'relative',
            transition: 'background 150ms ease'
          }}>
            <span style={{
              position: 'absolute', top: 2, left: isSuspended ? 20 : 2, width: 18, height: 18, borderRadius: '50%',
              background: '#fff', boxShadow: 'var(--shadow-xs)', transition: 'left 150ms ease'
            }}></span>
          </button>
        </div>

        <Field label="狀態自動更新規則">
          <div className="card" style={{ overflow: 'hidden' }}>
            {rules.map(([s, desc], i) =>
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderTop: i ? '1px solid var(--divider)' : 'none', fontSize: 12.5 }}>
                <StatusChip status={s} />
                <span style={{ color: 'var(--text-2)' }}>{desc}</span>
                {status === s && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>目前</span>}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderTop: '1px solid var(--divider)', fontSize: 12.5 }}>
              <StatusChip status="停課" />
              <span style={{ color: 'var(--text-2)' }}>手動設定，優先於上述規則</span>
              {status === '停課' && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>目前</span>}
            </div>
          </div>
        </Field>

        {onEditSessions &&
        <Field label="場次內容">
          <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>場次與個案</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.6 }}>後續調整各堂上課日期、時間與每場的個案主題、情境與講師。</div>
            </div>
            <button className="btn" style={{ flexShrink: 0 }} onClick={onEditSessions}><Icon.Edit size={13} /> 編輯單堂內容</button>
          </div>
        </Field>
        }

      </div>
    </Modal>);

};

// ── Excel 匯入課程 Modal（3 步驟）──
const ImportCourseModal = ({ onClose, onDone }) => {
  const [step, setStep] = React.useState(1);
  const preview = [
  ['ICL-17', '個案共學會・第17期', 5, 12],
  ['LC-Q3', '領導者俱樂部・夏季專班', 3, 8]];

  return (
    <Modal title="匯入課程（Excel）" subtitle="下載範本 → 填入課程與場次 → 上傳自動建立" onClose={onClose} width={580}
    footer={step < 3 ?
    <>
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={() => setStep(step + 1)}>{step === 1 ? '下一步' : '確認匯入'}</button>
        </> :
    <button className="btn primary" onClick={onDone}><Icon.Check size={13} /> 完成</button>}>
      <Stepper step={step} steps={['下載範本', '上傳檔案', '完成']} />
      <div style={{ marginTop: 20 }}>
        {step === 1 &&
        <div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>請先下載課程結構範本，依欄位填入<b>課程代碼、名稱、品項與各場次上課日期</b>，再回到此處上傳。</p>
            <button className="btn" style={{ marginTop: 6 }}><Icon.FileText size={14} /> 下載課程結構範本.xlsx</button>
            <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>範本欄位</div>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead><tr><th style={{ paddingLeft: 12 }}>course_code</th><th>course_name</th><th>session_no</th><th>session_date</th></tr></thead>
                <tbody>
                  <tr><td style={{ paddingLeft: 12, fontFamily: 'var(--font-mono)' }}>ICL-17</td><td>個案共學會・第17期</td><td>1</td><td>2026-09-05</td></tr>
                  <tr><td style={{ paddingLeft: 12, fontFamily: 'var(--font-mono)' }}>ICL-17</td><td>個案共學會・第17期</td><td>2</td><td>2026-09-19</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        }
        {step === 2 &&
        <div>
            <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '28px 20px', textAlign: 'center', background: 'var(--bg-subtle)' }}>
              <Icon.Upload size={26} />
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>拖曳檔案到此或點擊選擇</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>支援 .xlsx · 已選擇 <b>課程匯入_2026Q3.xlsx</b></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, margin: '16px 0 8px', color: 'var(--text-2)' }}>解析預覽 · 將建立 2 門課程</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl" style={{ fontSize: 12 }}>
                <thead><tr><th style={{ paddingLeft: 12 }}>代碼</th><th>名稱</th><th style={{ textAlign: 'right' }}>品項</th><th style={{ textAlign: 'right' }}>場次</th></tr></thead>
                <tbody>{preview.map((r, i) => <tr key={i}><td style={{ paddingLeft: 12, fontFamily: 'var(--font-mono)' }}>{r[0]}</td><td>{r[1]}</td><td style={{ textAlign: 'right' }}>{r[2]}</td><td style={{ textAlign: 'right' }}>{r[3]}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        }
        {step === 3 &&
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-subtle)', color: 'var(--success-text)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}><Icon.Check size={24} /></div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>匯入完成</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>已建立 2 門課程、20 個場次，可至課程清單查看管理。</div>
          </div>
        }
      </div>
    </Modal>);

};

const DeleteCourseConfirm = ({ course, onClose, onConfirm }) =>
<Modal title="刪除課程" onClose={onClose} width={420}
footer={<>
      <button className="btn" onClick={onClose}>取消</button>
      <button className="btn danger" onClick={onConfirm}><Icon.Trash size={13} /> 確認刪除</button>
    </>}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--danger-subtle)', color: 'var(--danger-text)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon.Trash size={16} /></span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>確定要刪除「{course.name}」？</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.65 }}>該課程的 {course.sessions} 個場次將一併刪除，此動作無法復原。</div>
      </div>
    </div>
  </Modal>;


// NewCourseModal（三步驟精靈）定義於 app/course-create.jsx

const Stepper = ({ step, steps }) =>
<div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    {steps.map((s, i) => {
    const n = i + 1,on = n === step,done = n < step;
    return (
      <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600,
            background: done ? 'var(--accent)' : on ? 'var(--accent-subtle)' : 'var(--bg-active)',
            color: done ? '#fff' : on ? 'var(--accent-text)' : 'var(--text-3)',
            border: on ? '1px solid var(--accent-border)' : 'none' }}>{done ? <Icon.Check size={12} /> : n}</div>
            <span style={{ fontSize: 12.5, fontWeight: on ? 600 : 400, color: on || done ? 'var(--text)' : 'var(--text-3)' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 12px' }} />}
        </React.Fragment>);

  })}
  </div>;


Object.assign(window, { CourseTable, CoursesModule, CourseDetailView, CourseSettingsModal, ImportCourseModal, DeleteCourseConfirm, AddStudentsModal, Stepper });