// ─────────────────────────────────────────────────────────────────────────────
// 課務 CRM · 第一階段（出缺勤 MVP）共用資料
// 資料層級：專案 PROGRAM → 課程/期 COURSE → 場次 SESSION
// 出缺勤狀態以 localStorage 持久化（取代 Excel 人工點名）
// ─────────────────────────────────────────────────────────────────────────────

// 出缺勤狀態定義（對應功能需求書：出席／請假／缺席／待補課／代課）
// 專案（PROGRAM）— 一個品牌系列，底下含多個「期」
const PROGRAMS = [
  { code: 'ICL', name: '個案共學會',   type: '個案共學', owner: '謝孟潔', desc: '以哈佛個案為本的高階共學社群' },
  { code: 'LC',  name: '領導者俱樂部', type: '會員制',   owner: '陳庭宇', desc: '年度會員制領導力俱樂部' },
  { code: 'CXO', name: 'CXO 決策論壇', type: '論壇',     owner: '謝孟潔', desc: 'C-level 決策者閉門論壇' },
];

// 課程／期（COURSE）— 隸屬於某專案，含多個場次
const COURSES = [
  { id: 'ICL-16', program: 'ICL', name: '個案共學會・第16期', term: '第16期', type: '個案共學會', status: '上課中', students: 38, sessions: 8,  startDate: '2026-02-14', endDate: '2026-07-12', makeupDeadline: '2026-07-31', venue: '政大公企中心 7F', lead: '吳相勳',
    revenue: 6840000, costs: { lecturer: 960000, venue: 480000, catering: 360000, materials: 220000, marketing: 380000, platform: 120000, staff: 540000, media: 96000, travel: 80000, equipment: 60000, paymentFee: 137000, miscItems: [ { name: '公共意外責任險', amount: 18000 }, { name: '海報印刷', amount: 15000 }, { name: '停車與雜項', amount: 12000 } ] } },
  { id: 'ICL-15', program: 'ICL', name: '個案共學會・第15期', term: '第15期', type: '個案共學會', status: '已結案', students: 42, sessions: 12, startDate: '2025-09-04', endDate: '2026-01-25', makeupDeadline: '2026-02-15', venue: '政大公企中心 7F', lead: '吳相勳',
    revenue: 7560000, costs: { lecturer: 1440000, venue: 720000, catering: 540000, materials: 260000, marketing: 350000, platform: 120000, staff: 600000, media: 144000, travel: 95000, equipment: 72000, paymentFee: 151000, misc: 58000 } },
  { id: 'LC-2026', program: 'LC', name: '領導者俱樂部・2026', term: '2026 年度', type: '領導者俱樂部', status: '上課中', students: 124, sessions: 24, startDate: '2026-01-08', endDate: '2026-12-20', makeupDeadline: '—', venue: '晶華酒店 3F', lead: '黃國峯',
    revenue: 18600000, costs: { lecturer: 2880000, venue: 1920000, catering: 1450000, materials: 380000, marketing: 980000, platform: 240000, staff: 1680000, media: 288000, travel: 260000, equipment: 180000, paymentFee: 372000, misc: 120000 } },
];

// 課程類別（建課選單與篩選共用）。舊資料以 LEGACY_CATEGORY 映射為正規類別
const COURSE_CATEGORIES = ['個案共學會', '實戰班', '領導者俱樂部'];
const LEGACY_CATEGORY = { '個案共學': '個案共學會', '會員制': '領導者俱樂部' };
function categoryOf(c) { const t = (c && c.type) || ''; return LEGACY_CATEGORY[t] || t || ''; }

// 場次（SESSION）— 以 ICL-16 為深度示範資料
const SESSIONS = {
  'ICL-16': [
    { no: 1, date: '2026-02-14', weekday: '六', time: '14:00–17:00', topic: '破冰與個案導讀：台積電全球布局', lecturer: '吳相勳', done: true },
    { no: 2, date: '2026-02-28', weekday: '六', time: '14:00–17:00', topic: '策略抉擇：Airbnb 的平台轉型', lecturer: '黃國峯', done: true },
    { no: 3, date: '2026-03-14', weekday: '六', time: '14:00–17:00', topic: '數位轉型：星巴克的全通路', lecturer: '吳相勳', done: true },
    { no: 4, date: '2026-03-28', weekday: '六', time: '14:00–17:00', topic: '組織變革：Netflix 的自由與責任', lecturer: '黃國峯', done: true },
    { no: 5, date: '2026-04-11', weekday: '六', time: '14:00–17:00', topic: '領導風格：Nadella 的同理心領導', lecturer: '吳相勳', done: true },
    { no: 6, date: '2026-04-25', weekday: '六', time: '14:00–17:00', topic: 'AI 時代的競爭策略', lecturer: '黃國峯', done: false, next: true },
    { no: 7, date: '2026-05-09', weekday: '六', time: '14:00–17:00', topic: 'ESG 策略：聯合利華的永續之路', lecturer: '吳相勳', done: false },
    { no: 8, date: '2026-05-23', weekday: '六', time: '14:00–17:00', topic: '創新實驗：3M 的 15% 法則', lecturer: '黃國峯', done: false },
  ],
};

// ICL-16 學員名冊
// 後台訂單（商品＝課程，每位訂購人＝一筆訂單；訂單金額加總＝課程營收）
const BACKEND_ORDERS = [
  { code: 'PRD-ICL17', product: '個案共學會・第17期', orders: [
    { name: '陳家豪', company: '富邦金控', amount: 168000 },
    { name: '林宜君', company: '台積電', amount: 168000 },
    { name: '鄭惠雯', company: '國泰金控', amount: 168000 },
    { name: '王志明', company: '中華電信', amount: 168000 },
    { name: '李承翰', company: '聯發科', amount: 168000 },
    { name: '蔡佳芸', company: '台新銀行', amount: 158000 },
    { name: '周柏翰', company: '宏碩', amount: 168000 },
    { name: '黃美玲', company: '長榮海運', amount: 158000 },
    { name: '許文彥', company: '和泰汽車', amount: 168000 },
    { name: '劉冠廷', company: '玉山銀行', amount: 168000 },
  ] },
  { code: 'PRD-LCQ3', product: '領導者俱樂部・夏季專班', orders: [
    { name: '吳佳蓉', company: '信義房屋', amount: 88000 },
    { name: '張育誠', company: '國泰人壽', amount: 88000 },
    { name: '林宜君', company: '台積電', amount: 88000 },
    { name: '王志明', company: '中華電信', amount: 88000 },
    { name: '鄭惠雯', company: '國泰金控', amount: 88000 },
    { name: '李承翰', company: '聯發科', amount: 88000 },
  ] },
  { code: 'PRD-CXO08', product: 'CXO 決策論壇・第八屆', orders: [
    { name: '陳家豪', company: '富邦金控', amount: 240000 },
    { name: '鄭惠雯', company: '國泰金控', amount: 240000 },
    { name: '王志明', company: '中華電信', amount: 240000 },
    { name: '劉冠廷', company: '玉山銀行', amount: 240000 },
  ] },
];

// ── 客戶（CRM 基礎）── 沿用真實情境名單
const CUSTOMERS = [
  { id: 'H9999993', name: '陳家豪', company: '富邦金控', title: '數位長',   industry: '金融',   email: 'chen.jh@fubon.com',    phone: '0912-332-118', type: 'VIP', tags: ['個案共學','高意願'], purchased: ['個案共學會・第16期','CXO 決策論壇・第七屆'], enrollments: 4, lastContact: '2026-04-21', assignee: '謝孟潔' },
  { id: 'H9999992', name: '林宜君', company: '台積電',   title: '副總經理', industry: '半導體', email: 'lin.yj@tsmc.com',      phone: '0933-776-541', type: '學員', tags: ['領導者俱樂部'], purchased: ['領導者俱樂部・2026'], enrollments: 2, lastContact: '2026-04-18', assignee: '謝孟潔' },
  { id: 'H9999991', name: '王志明', company: '中華電信', title: '總經理',   industry: '電信',   email: 'wang.zm@cht.com.tw',   phone: '0922-115-447', type: 'VIP', tags: ['CXO','高意願'], purchased: ['CXO 決策論壇・第七屆','領導者俱樂部・2026','個案共學會・第16期'], enrollments: 3, lastContact: '2026-04-22', assignee: '陳庭宇' },
  { id: 'H9999990', name: '黃美玲', company: '長榮海運', title: '策略長',   industry: '運輸',   email: 'huang.ml@evergreen.com', phone: '0988-224-663', type: '學員', tags: ['個案共學'], purchased: ['個案共學會・第16期'], enrollments: 1, lastContact: '2026-04-23', assignee: '謝孟潔' },
  { id: 'H9999989', name: '張育誠', company: '國泰人壽', title: '業務副總', industry: '金融',   email: 'chang.yc@cathay.com.tw', phone: '0910-448-339', type: '學員', tags: ['個案共學'], purchased: ['個案共學會・第16期'], enrollments: 1, lastContact: '2026-04-11', assignee: '陳庭宇' },
  { id: 'H9999987', name: '李承翰', company: '聯發科',   title: '技術長',   industry: '半導體', email: 'lee.ch@mtk.com.tw',    phone: '0952-117-283', type: '學員', tags: ['領導者俱樂部','續約'], purchased: ['領導者俱樂部・2026'], enrollments: 3, lastContact: '2026-04-20', assignee: '謝孟潔' },
  { id: 'H9999986', name: '鄭惠雯', company: '國泰金控', title: '總經理',   industry: '金融',   email: 'cheng.hw@cathay.com',  phone: '0937-229-114', type: 'VIP', tags: ['CXO','個案共學'], purchased: ['CXO 決策論壇・第七屆','個案共學會・第16期','領導者俱樂部・2026','個案共學會・第15期'], enrollments: 5, lastContact: '2026-04-22', assignee: '陳庭宇' },
  { id: 'H9999985', name: '周柏翰', company: '宏碁',     title: '策略長',   industry: '資通訊', email: 'chou.ph@acer.com',     phone: '0963-558-217', type: '學員', tags: ['個案共學','高意願'], purchased: ['個案共學會・第16期'], enrollments: 1, lastContact: '2026-04-23', assignee: '謝孟潔' },
  { id: 'H9999984', name: '蔡佳芸', company: '台新銀行', title: '營運長',   industry: '金融',   email: 'tsai.jy@taishinbank.com', phone: '0931-884-225', type: '學員', tags: ['個案共學','待續約'], purchased: ['個案共學會・第15期'], enrollments: 2, lastContact: '2026-04-15', assignee: '陳庭宇' },
];

// ── 潛客（Prospect）── 與客戶分流的獨立主體；無購買課程，改帶「來源」與「狀態」
// 來源：行銷歸因標籤（可多選＋自訂，做法同備註標籤）；狀態：開發階段（單選）
const PROSPECT_SOURCES = ['Meta Ads', '舊生推薦', 'Podcast', '企業客戶', '員工推薦', '活動開發'];
const PROSPECT_STATUSES = ['接通', '未接通', '無效', '考慮', '預約', '婉拒', '追蹤'];
const PROSPECTS = [
  { id: 'P0000008', name: '林彥廷', company: '台達電',   title: '永續長',     industry: '電子',   email: 'lin.yt@deltaww.com',   phone: '0917-220-558', sources: ['舊生推薦'],        status: '接通',   note: '舊生引薦，對 ESG 課程有興趣', noteTags: ['接聽'], lastContact: '2026-04-24', assignee: '謝孟潔' },
  { id: 'P0000007', name: '吳佳蓉', company: '信義房屋', title: '人資長',     industry: '不動產', email: 'wu.jr@sinyi.com.tw',    phone: '0919-553-772', sources: ['Podcast'],         status: '未接通', note: '聽過 Podcast 來信詢問，已留言', noteTags: ['未接'], lastContact: '2026-04-19', assignee: '謝孟潔' },
  { id: 'P0000006', name: '許文彥', company: '和泰汽車', title: '行銷長',     industry: '汽車',   email: 'hsu.wy@hotai.com.tw',   phone: '0921-664-882', sources: ['活動開發'],        status: '預約',   note: '說明會現場留資料，已約下週面談', noteTags: ['追蹤'], lastContact: '2026-04-20', assignee: '謝孟潔' },
  { id: 'P0000005', name: '劉冠廷', company: '玉山銀行', title: '科技長',     industry: '金融',   email: 'liu.gt@esunbank.com',   phone: '0955-771-203', sources: ['員工推薦'],        status: '考慮',   note: '內部同仁推薦，預算待確認', noteTags: [], lastContact: '2026-04-23', assignee: '陳庭宇' },
  { id: 'P0000004', name: '孫雅婷', company: '遠傳電信', title: '數位轉型協理', industry: '電信',  email: 'sun.yt@fetnet.net',     phone: '0966-118-374', sources: ['Meta Ads'],        status: '接通',   note: '廣告表單填寫，已電聯介紹方案', noteTags: ['接聽'], lastContact: '2026-04-22', assignee: '陳庭宇' },
  { id: 'P0000003', name: '趙廷宇', company: '友達光電', title: '營運協理',   industry: '光電',   email: 'chao.ty@auo.com',       phone: '0972-336-149', sources: ['舊生推薦', 'Meta Ads'], status: '追蹤', note: '兩個來源都有觸及，持續培養', noteTags: ['追蹤'], lastContact: '2026-04-18', assignee: '謝孟潔' },
  { id: 'P0000002', name: '錢思敏', company: '緯創資通', title: '人才發展經理', industry: '資通訊', email: 'chien.sm@wistron.com', phone: '0988-447-201', sources: ['企業客戶'],        status: '婉拒',   note: '今年度教育訓練預算已用罄', noteTags: ['婉拒'], lastContact: '2026-04-10', assignee: '陳庭宇' },
  { id: 'P0000001', name: '周怡君', company: '統一企業', title: '品牌經理',   industry: '食品',   email: 'chou.yj@uni-president.com', phone: '0931-552-880', sources: ['Meta Ads'],     status: '無效',   note: '電話為總機，無法轉接本人', noteTags: ['電話錯誤', '無效名單'], lastContact: '2026-04-08', assignee: '謝孟潔' },
];

const CUSTOMER_TAGS = ['個案共學','領導者俱樂部','CXO','高意願','說明會預約','續約','待續約','未接通','電子報','LinkedIn'];

// 備註快速標籤（預設池；使用者亦可自行新增，新增後併入全域可選池）
const NOTE_TAGS = ['未接', '接聽', '電話錯誤', '無效名單', '成交', '婉拒', '追蹤'];

// ── 師資檔案（FACULTY 主檔）── 講師可從此選用；選定後自動帶入服務單位/職稱
//   個案共學會 引導師名單（來源：academy.hbrtaiwan.com/professor）；cat 標記適用課程類別。
//   建課「講師」欄依課程類別以 facultyFor(category) 提供建議名單。
const FACULTY = [
  { id: 'F-01', name: '黃國峯', org: '國立政治大學商學院DBA執行長', cat: '個案共學會' },
  { id: 'F-02', name: '丘宏昌', org: '國立清華大學科技管理研究所教授', cat: '個案共學會' },
  { id: 'F-03', name: '鄭至甫', org: '國立政治大學商學院EMBA執行長', cat: '個案共學會' },
  { id: 'F-04', name: '謝凱宇', org: '長庚大學商管專業學院副執行長', cat: '個案共學會' },
  { id: 'F-05', name: '張佑宇', org: '國立成功大學國際經營管理研究所所長', cat: '個案共學會' },
  { id: 'F-06', name: '吳相勳', org: '元智大學終身教育部主任', cat: '個案共學會' },
  { id: 'F-07', name: '張紹基', org: '國立成功大學國際企業研究所教授', cat: '個案共學會' },
  { id: 'F-08', name: '翁晶晶', org: '國立臺灣科技大學管理學士班主任', cat: '個案共學會' },
  { id: 'F-09', name: '胡昌亞', org: '國立政治大學企管系特聘教授', cat: '個案共學會' },
  { id: 'F-10', name: '康敏平', org: '國立臺灣師範大學全球經營與策略研究所教授', cat: '個案共學會' },
  { id: 'F-11', name: '林舒柔', org: '國立臺灣師範大學全球經營與策略研究所教授', cat: '個案共學會' },
  { id: 'F-12', name: '徐士傑', org: '國立中山大學資訊管理系教授兼系主任', cat: '個案共學會' },
  { id: 'F-13', name: '張寶蓉', org: '逢甲大學企業管理學系專任副教授', cat: '個案共學會' },
  { id: 'F-14', name: '別蓮蒂', org: '國立政治大學企管系特聘教授', cat: '個案共學會' },
  { id: 'F-15', name: '周信輝', org: '國立成功大學企管系教授', cat: '個案共學會' },
  { id: 'F-16', name: '謝英哲', org: '國立清華大學科技管理研究所教授', cat: '個案共學會' },
  { id: 'F-17', name: '鄭祥麟', org: '中正大學企管系教授', cat: '個案共學會' },
  { id: 'F-18', name: '王淑玲', org: '成功大學國際企業研究所教授級兼任專家', cat: '個案共學會' },
  { id: 'F-19', name: '羅明琇', org: '國立政治大學商學院MBA主任', cat: '個案共學會' },
  { id: 'F-20', name: '邱奕嘉', org: '國立政治大學商學院副院長', cat: '個案共學會' },
  { id: 'F-21', name: '郭佳瑋', org: '國立臺灣大學管理學院個案中心執行長', cat: '個案共學會' },
  { id: 'F-22', name: '駱世民', org: '暨南國際大學國際企業學系副教授', cat: '個案共學會' },
  { id: 'F-23', name: '謝明慧', org: '國立臺灣大學進修推廣學院院長', cat: '個案共學會' },
  { id: 'F-24', name: '周德瑋', org: '國立臺灣師範大學管理研究所教授', cat: '個案共學會' },
];
// 依課程類別取講師建議名單；該類別尚無對應師資時回退全部
function facultyFor(category) {
  if (!category) return FACULTY;
  const m = FACULTY.filter((f) => f.cat === category);
  return m.length ? m : FACULTY;
}

// ── localStorage 持久化 ──
// ── 招生/訂單名單推導（供成效模組 recruitingPool 與訂單匯入去重使用）──
// 該期報名學員（來自客戶名單中購買此課程者）
function customersForCourse(courseId) {
  const course = loadCourses().find((c) => c.id === courseId) || COURSES.find((c) => c.id === courseId);
  if (!course) return [];
  return loadCustomers().filter((c) => (c.purchased || []).includes(course.name))
    .map((c) => ({ id: c.id, name: c.name, company: c.company, title: c.title }));
}
// 該期訂單（課程精靈步驟③：系統匯入／手動建立的學員訂單），轉成名單形狀
function ordersRoster(courseId) {
  try {
    const c = loadCourses().find((x) => x.id === courseId);
    if (c && Array.isArray(c.orders) && c.orders.length) {
      return c.orders.map((o, i) => ({
        id: o.id || ('O-' + courseId + '-' + (i + 1)),
        name: o.name, company: o.company || '', title: o.title || '',
      }));
    }
  } catch (e) {}
  return [];
}
// 該期所有報名／訂購學員（客戶名單購買者 ＋ 課程自身訂單），依 id/姓名去重
function enrolledFor(courseId) {
  const seen = new Set();
  const out = [];
  [...customersForCourse(courseId), ...ordersRoster(courseId)].forEach((r) => {
    if (!r || !r.name) return;
    if (seen.has(r.id) || seen.has(r.name)) return;
    if (r.id) seen.add(r.id);
    seen.add(r.name);
    out.push(r);
  });
  return out;
}

// ── 客戶／課程清單持久化（前端 localStorage；正式版改 API/DB）──
// 注意：一旦有持久化資料，種子（seed）變更不會自動生效；改種子時需 bump 版本鍵或清除。
const CUSTOMERS_KEY = 'hbr_customers_v2'; // v2：潛客分流獨立後重生（移除種子中的潛客）
const COURSES_KEY = 'hbr_courses_v1';
const PROSPECTS_KEY = 'hbr_prospects_v1';
// 記憶體快取：避免每次 render 重複 JSON.parse localStorage（點名等熱路徑常呼叫）。
// 將舊的相對字串（今天／昨天／N 天前）換算成真實 ISO 日期，好讓「最近聯繫」跟著時間走。
// ISO 日期或未知字串原樣保留。一次性轉換，之後寫入即為 ISO。
function normalizeContact(v) {
  if (!v || /^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  const base = new Date(); base.setHours(0, 0, 0, 0);
  let days = null;
  if (v === '今天') days = 0;
  else if (v === '昨天') days = 1;
  else { const m = /^(\d+)\s*天前/.exec(v); if (m) days = +m[1]; }
  if (days == null) return v;
  base.setDate(base.getDate() - days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
}
function migrateContacts(list) {
  let changed = false;
  const out = list.map((r) => {
    const nc = normalizeContact(r.lastContact);
    if (nc !== r.lastContact) { changed = true; return { ...r, lastContact: nc }; }
    return r;
  });
  return changed ? out : list;
}
// 寫入時同步更新快取；回傳值一律以不可變方式使用（map/filter/spread），勿就地 mutate。
let _customersCache = null;
function loadCustomers() {
  if (_customersCache) return _customersCache;
  try { const r = localStorage.getItem(CUSTOMERS_KEY); if (r) { const parsed = JSON.parse(r); const mig = migrateContacts(parsed); _customersCache = mig; if (mig !== parsed) { try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(mig)); } catch (e) {} } return _customersCache; } } catch (e) {}
  _customersCache = migrateContacts(JSON.parse(JSON.stringify(CUSTOMERS)));
  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(_customersCache)); } catch (e) {}
  return _customersCache;
}
function saveCustomers(list) {
  _customersCache = list;
  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list)); } catch (e) {}
}
let _coursesCache = null;
function loadCourses() {
  if (_coursesCache) return _coursesCache;
  try { const r = localStorage.getItem(COURSES_KEY); if (r) { _coursesCache = JSON.parse(r); return _coursesCache; } } catch (e) {}
  _coursesCache = JSON.parse(JSON.stringify(COURSES));
  return _coursesCache;
}
function saveCourses(list) {
  _coursesCache = list;
  try { localStorage.setItem(COURSES_KEY, JSON.stringify(list)); } catch (e) {}
}
let _prospectsCache = null;
function loadProspects() {
  if (_prospectsCache) return _prospectsCache;
  try { const r = localStorage.getItem(PROSPECTS_KEY); if (r) { const parsed = JSON.parse(r); const mig = migrateContacts(parsed); _prospectsCache = mig; if (mig !== parsed) { try { localStorage.setItem(PROSPECTS_KEY, JSON.stringify(mig)); } catch (e) {} } return _prospectsCache; } } catch (e) {}
  _prospectsCache = migrateContacts(JSON.parse(JSON.stringify(PROSPECTS)));
  try { localStorage.setItem(PROSPECTS_KEY, JSON.stringify(_prospectsCache)); } catch (e) {}
  return _prospectsCache;
}
function saveProspects(list) {
  _prospectsCache = list;
  try { localStorage.setItem(PROSPECTS_KEY, JSON.stringify(list)); } catch (e) {}
}
// 單一場次資料源：優先持久化課程的 sessionsList（課程管理新建/編輯而來），否則回退種子 SESSIONS。
// 出缺勤模組與課程詳情都應走此函式，避免兩邊資料不一致。
function sessionsOf(courseId) {
  try {
    const c = loadCourses().find((x) => x.id === courseId);
    if (c && Array.isArray(c.sessionsList) && c.sessionsList.length) return c.sessionsList;
  } catch (e) {}
  return SESSIONS[courseId] || [];
}

// ── 單堂取消（風雨假日等）持久化：取消的堂次不計入出席率與補課扣打 ──
const CANCELLED_KEY = 'hbr_cancelled_v1';
function loadCancelledSessions(courseId) {
  try {
    const r = localStorage.getItem(CANCELLED_KEY);
    if (r) { const all = JSON.parse(r); return new Set(all[courseId] || []); }
  } catch (e) {}
  return new Set();
}
function saveCancelledSessions(courseId, nosSet) {
  try {
    const r = localStorage.getItem(CANCELLED_KEY);
    const all = r ? JSON.parse(r) : {};
    all[courseId] = Array.from(nosSet);
    localStorage.setItem(CANCELLED_KEY, JSON.stringify(all));
  } catch (e) {}
}

// ── 停課名單（手動狀態，持久化）——狀態判定優先於日期規則 ──
const SUSPENDED_KEY = 'hbrCRM.suspendedCourses';
function loadSuspended() {
  try { return new Set(JSON.parse(localStorage.getItem(SUSPENDED_KEY) || '[]')); } catch (e) { return new Set(); }
}
function saveSuspended(set) {
  try { localStorage.setItem(SUSPENDED_KEY, JSON.stringify(Array.from(set))); } catch (e) {}
}

// ── 期數成效管理：說明會場次成效 + 報名追蹤狀態（持久化，仿 prospects 快取）──
//  資料以「期（course）」為鍵；身分（舊客未報名/舊潛客/新潛客）不存個體，依 person×期 動態推導。
//  說明會場次：每場獨立計算、不跨場合併、不做歸因（僅個案共學會顯示）。
const RECRUIT_CLASSES = ['舊客未報名', '舊潛客', '新潛客'];
const PERF_KEY = 'hbr_perf_v2'; // v2：報名追蹤改匯入驅動（poolMembers），種子新增 poolMembers
const PERF_SEED = {
  'ICL-16': {
    seminars: [
      { id: 'SM-1', label: '說明會 第1場', date: '2026-01-10', notified: 120, replied: 45, attended: 38, deals: 12 },
      { id: 'SM-2', label: '說明會 第2場', date: '2026-01-17', notified: 130, replied: 52, attended: 41, deals: 15 },
      { id: 'SM-3', label: '說明會 第3場', date: '2026-01-24', notified: 110, replied: 40, attended: 33, deals: 9 },
      { id: 'SM-4', label: '說明會 第4場', date: '2026-02-07', notified: 95,  replied: 30, attended: 24, deals: 7 },
    ],
    // 報名追蹤覆寫：key = 'C:'+客戶id 或 'P:'+潛客id；預設未報名/未成交，覆寫者顯示成交
    track: {
      'P:P0000006': { signup: '已報名', deal: '已成交', sems: { '說明會 第1場': '已出席' } },
      'P:P0000004': { signup: '已報名', deal: '已成交', sems: { '說明會 第2場': '已出席' } },
      'C:H9999984': { signup: '已報名', deal: '已成交', sems: { '說明會 第1場': '已出席' } },
      'P:P0000003': { sems: { '說明會 第1場': '未出席', '說明會 第2場': '回覆出席' } },
      'P:P0000005': { sems: { '說明會 第2場': '已通知' } },
    },
    newProspectIds: ['P0000004', 'P0000006', 'P0000008'], // 本期新進潛客
    // 招生對象池（匯入驅動）：每期明確匯入的成員清單（不再掃整個客戶/潛客 DB）
    poolMembers: [
      { refType: 'prospect', refId: 'P0000004', name: '孫雅婷', company: '遠傳電信', title: '數位轉型協理', email: 'sun.yt@fetnet.net', phone: '0966-118-374', klass: '新潛客', sources: ['Meta Ads'] },
      { refType: 'prospect', refId: 'P0000006', name: '許文彥', company: '和泰汽車', title: '行銷長', email: 'hsu.wy@hotai.com.tw', phone: '0921-664-882', klass: '新潛客', sources: ['活動開發'] },
      { refType: 'prospect', refId: 'P0000008', name: '林彥廷', company: '台達電', title: '永續長', email: 'lin.yt@deltaww.com', phone: '0917-220-558', klass: '新潛客', sources: ['舊生推薦'] },
      { refType: 'prospect', refId: 'P0000003', name: '趙廷宇', company: '友達光電', title: '營運協理', email: 'chao.ty@auo.com', phone: '0972-336-149', klass: '舊潛客', sources: ['舊生推薦', 'Meta Ads'] },
      { refType: 'prospect', refId: 'P0000005', name: '劉冠廷', company: '玉山銀行', title: '科技長', email: 'liu.gt@esunbank.com', phone: '0955-771-203', klass: '舊潛客', sources: ['員工推薦'] },
      { refType: 'customer', refId: 'H9999984', name: '蔡佳芸', company: '台新銀行', title: '營運長', email: 'tsai.jy@taishinbank.com', phone: '0931-884-225', klass: '舊客未報名', sources: [] },
      { refType: 'customer', refId: 'H9999992', name: '林宜君', company: '台積電', title: '副總經理', email: 'lin.yj@tsmc.com', phone: '0933-776-541', klass: '舊客未報名', sources: [] },
    ],
  },
};
let _perfCache = null;
function loadPerfAll() {
  if (_perfCache) return _perfCache;
  try { const r = localStorage.getItem(PERF_KEY); if (r) { _perfCache = JSON.parse(r); return _perfCache; } } catch (e) {}
  _perfCache = JSON.parse(JSON.stringify(PERF_SEED));
  return _perfCache;
}
function savePerfAll(all) {
  _perfCache = all;
  try { localStorage.setItem(PERF_KEY, JSON.stringify(all)); } catch (e) {}
}
// 取某期成效：說明會場次（無則依 course.seminarCount／類別產生空場）＋報名覆寫＋新潛客集合
function loadPerf(courseId) {
  const all = loadPerfAll();
  const stored = all[courseId] || {};
  const course = loadCourses().find((c) => c.id === courseId);
  let seminars = stored.seminars;
  if (!seminars) {
    const isICL = categoryOf(course) === '個案共學會';
    const n = (course && course.seminarCount != null) ? course.seminarCount : (isICL ? 4 : 0);
    seminars = Array.from({ length: n }, (_, i) => ({ id: 'SM-' + (i + 1), label: '說明會 第' + (i + 1) + '場', date: '', notified: 0, replied: 0, attended: 0, deals: 0 }));
  }
  return { seminars, track: stored.track || {}, newProspectIds: stored.newProspectIds || [], poolMembers: stored.poolMembers || [] };
}
function savePerf(courseId, perf) {
  const all = loadPerfAll();
  all[courseId] = { ...(all[courseId] || {}), ...perf };
  savePerfAll(all);
}
// 招生對象池（報名追蹤表資料源）：改為「匯入驅動」——僅含本期明確匯入的成員（poolMembers）
function poolKey(m) { return (m.refType === 'customer' ? 'C:' : m.refType === 'prospect' ? 'P:' : 'E:') + (m.refId || m.name); }
// 說明會出席紀錄：每人×每場獨立（sems = { 場次label: 狀態 }），改報別場不覆蓋舊場紀錄。
// 舊資料相容：單一 seminar/semStatus → 換算為 sems；'已參加'（無場次）→ sems['未指定場次']='已出席'。
function semsOf(ov) {
  if (ov.sems) return ov.sems;
  if (ov.seminar && ov.seminar !== '未參加') {
    if (ov.seminar === '已參加') return { '未指定場次': '已出席' };
    return { [ov.seminar]: ov.semStatus || '已出席' };
  }
  return {};
}
function recruitingPool(courseId) {
  const perf = loadPerf(courseId);
  const enrolledNames = new Set(enrolledFor(courseId).map((r) => r.name));
  return (perf.poolMembers || []).map((m) => {
    const key = poolKey(m);
    const ov = perf.track[key] || {};
    const signup = ov.signup || (enrolledNames.has(m.name) ? '已報名' : '未報名');
    // 報名＝成交：deal 由 signup 衍生（已報名＝已成交），供成效表/歷期比較沿用
    const deal = signup === '已報名' ? '已成交' : '未成交';
    const sems = semsOf(ov);
    const note = ov.note || '';
    return { ...m, key, signup, deal, sems, note };
  });
}
// 今天（ISO 日期）與最近聯繫顯示：ISO 日期換算 今天/昨天/N 天前；舊字串（'今天'、'3 天前'）原樣顯示
function todayISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function fmtLastContact(v) {
  if (!v) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  if (!m) return v;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((now - d) / 86400000);
  if (diff <= 0) return '今天';
  return `${m[1]}/${+m[2]}/${+m[3]}`;
}
// 加入池成員：依 refId／姓名去重，重複自動略過；markNew → 標記為本期新潛客
function addPoolMembers(courseId, members, opts) {
  opts = opts || {};
  const perf = loadPerf(courseId);
  const existing = perf.poolMembers || [];
  const seenKey = new Set(existing.map(poolKey));
  const seenName = new Set(existing.map((m) => m.name));
  const newProspectIds = new Set(perf.newProspectIds || []);
  const toAdd = [];
  let skipped = 0;
  members.forEach((m) => {
    if (seenKey.has(poolKey(m)) || seenName.has(m.name)) { skipped++; return; }
    seenKey.add(poolKey(m)); seenName.add(m.name); toAdd.push(m);
    if ((opts.markNew || m.klass === '新潛客') && m.refType !== 'customer' && m.refId) newProspectIds.add(m.refId);
  });
  savePerf(courseId, { poolMembers: [...existing, ...toAdd], newProspectIds: [...newProspectIds] });
  return { added: toAdd.length, skipped };
}
// 從本期池移除（僅移出本期池，不刪底層客戶/潛客）
function removePoolMember(courseId, key) {
  const perf = loadPerf(courseId);
  savePerf(courseId, { poolMembers: (perf.poolMembers || []).filter((m) => poolKey(m) !== key) });
}
// 產生下一個潛客編號 P + 7 位
function nextProspectId() {
  const max = loadProspects().reduce((m, p) => Math.max(m, parseInt((p.id || '').replace(/\D/g, ''), 10) || 0), 0);
  return 'P' + String(max + 1).padStart(7, '0');
}
// 產生下一個會員編號 H + 流水
function nextCustomerId(list) {
  const max = (list || loadCustomers()).reduce((m, c) => Math.max(m, parseInt((c.id || '').replace(/\D/g, ''), 10) || 0), 0);
  return 'H' + (max + 1);
}
// 外部名單建立潛客（已存在依 email/姓名跳過），回傳 {id, created}
function createProspectIfAbsent(data) {
  const list = loadProspects();
  const hit = list.find((p) => (data.email && p.email === data.email) || p.name === data.name);
  if (hit) return { id: hit.id, created: false };
  const id = nextProspectId();
  const p = { id, name: data.name, company: data.company || '', title: data.title || '', industry: '', email: data.email || '', phone: data.phone || '', sources: data.sources || [], status: '未接通', note: '', noteTags: [], lastContact: todayISO(), assignee: '謝孟潔' };
  saveProspects([p, ...list]);
  return { id, created: true };
}
// 潛客→顧客轉換（訂單匯入觸發）：原型以「姓名＋公司」比對；正式版改訂單編號＋帳號（見 §5）。
// 比中者自潛客管理移除、於顧客管理建立/更新（purchased 加入本期課名），並於本期池 track 標記已成交。
function convertProspectsByOrders(courseId, orders) {
  const course = loadCourses().find((c) => c.id === courseId);
  const courseName = course && course.name;
  if (!courseName || !Array.isArray(orders) || !orders.length) return { converted: 0 };
  const prospects = loadProspects();
  const matched = [];
  const remaining = [];
  prospects.forEach((p) => {
    const hit = orders.find((o) => o.name === p.name && (!o.company || !p.company || o.company === p.company));
    if (hit) matched.push(p); else remaining.push(p);
  });
  if (!matched.length) return { converted: 0 };
  let custs = [...loadCustomers()];
  matched.forEach((p) => {
    const ex = custs.find((c) => (p.email && c.email === p.email) || c.name === p.name);
    if (ex) {
      custs = custs.map((c) => c === ex ? { ...c, purchased: Array.from(new Set([...(c.purchased || []), courseName])), enrollments: (c.enrollments || 0) + 1 } : c);
    } else {
      custs = [{ id: nextCustomerId(custs), name: p.name, company: p.company, title: p.title, industry: p.industry || '', email: p.email, phone: p.phone, type: '學員', tags: [], purchased: [courseName], enrollments: 1, lastContact: todayISO(), assignee: p.assignee || '謝孟潔', note: p.note || '', noteTags: [] }, ...custs];
    }
  });
  saveCustomers(custs);
  saveProspects(remaining);
  // 於本期池 track 標記成交（池成員仍保留，klass 不變→「新潛客＋已成交」＝本期新客）
  const perf = loadPerf(courseId);
  const track = { ...(perf.track || {}) };
  matched.forEach((p) => { track['P:' + p.id] = { ...(track['P:' + p.id] || {}), signup: '已報名', deal: '已成交' }; });
  savePerf(courseId, { track });
  return { converted: matched.length, names: matched.map((p) => p.name) };
}

// ── 使用者帳號 / 登入 / 角色權限（前端 mock；正式版改後端驗證）──
// 角色：superuser（系統管理員，唯一可進帳號管理）／ staff（課務人員）
const ROLES = [
  { id: 'superuser', label: '系統管理員', desc: '全權；唯一可新增帳號與調整權限' },
  { id: 'staff', label: '課務人員', desc: '日常操作；無法進入帳號管理' },
];
const roleLabel = (id) => (ROLES.find((r) => r.id === id) || {}).label || id;
const USERS_KEY = 'hbr_users_v1';
const SESSION_KEY = 'hbr_session_v1';
const USERS_SEED = [
  { id: 'U-001', name: '謝孟潔', email: 'admin@hbr.tw',  password: 'admin123', role: 'superuser', active: true,  createdAt: '2026-01-02' },
  { id: 'U-002', name: '陳庭宇', email: 'chen@hbr.tw',   password: 'staff123', role: 'staff',     active: true,  createdAt: '2026-02-10' },
  { id: 'U-003', name: '林佩蓉', email: 'lin@hbr.tw',    password: 'staff123', role: 'staff',     active: false, createdAt: '2026-03-05' },
];
let _usersCache = null;
function loadUsers() {
  if (_usersCache) return _usersCache;
  try { const r = localStorage.getItem(USERS_KEY); if (r) { _usersCache = JSON.parse(r); return _usersCache; } } catch (e) {}
  _usersCache = JSON.parse(JSON.stringify(USERS_SEED));
  return _usersCache;
}
function saveUsers(list) {
  _usersCache = list;
  try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {}
}
function nextUserId(list) {
  const max = (list || loadUsers()).reduce((m, u) => Math.max(m, parseInt((u.id || '').replace(/\D/g, ''), 10) || 0), 0);
  return 'U-' + String(max + 1).padStart(3, '0');
}
// 驗證登入：回 { ok, user } 或 { ok:false, reason }
function authenticate(email, password) {
  const u = loadUsers().find((x) => x.email.toLowerCase() === String(email || '').trim().toLowerCase());
  if (!u) return { ok: false, reason: 'notfound' };
  if (!u.active) return { ok: false, reason: 'disabled' };
  if (u.password !== password) return { ok: false, reason: 'badpass' };
  return { ok: true, user: u };
}
// 工作階段：rememberMe → localStorage（跨關閉保留）；否則 sessionStorage（關閉即失效）
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const u = loadUsers().find((x) => x.id === s.userId);
    if (!u || !u.active) return null;
    return u;
  } catch (e) { return null; }
}
function setSession(userId, remember) {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  try {
    if (remember) { localStorage.setItem(SESSION_KEY, payload); sessionStorage.removeItem(SESSION_KEY); }
    else { sessionStorage.setItem(SESSION_KEY, payload); localStorage.removeItem(SESSION_KEY); }
  } catch (e) {}
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) {}
}
// Superuser 安全規則：是否為「最後一個啟用中的 superuser」
function isLastActiveSuperuser(userId) {
  const supers = loadUsers().filter((u) => u.role === 'superuser' && u.active);
  return supers.length === 1 && supers[0].id === userId;
}

// 某人的「期別歷程」：掃所有課程的成效池，回傳此人出現過的每一期身分／報名／成交／當期備註
// ref: { refId, name } — 依 refId 優先、否則姓名比對
function statusHistoryFor(ref) {
  const all = loadPerfAll();
  const out = [];
  loadCourses().forEach((c) => {
    const perf = all[c.id];
    if (!perf || !Array.isArray(perf.poolMembers)) return;
    const m = perf.poolMembers.find((x) => (ref.refId && x.refId === ref.refId) || (x.name && ref.name && x.name === ref.name));
    if (!m) return;
    const ov = (perf.track || {})[poolKey(m)] || {};
    out.push({
      courseId: c.id, term: c.term || c.name, startDate: c.startDate || '',
      klass: m.klass, signup: ov.signup || '未報名', deal: (ov.signup === '已報名') ? '已成交' : '未成交',
      seminar: Object.keys(semsOf(ov)).join('、') || '未參加', note: ov.note || '',
    });
  });
  out.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
  return out;
}

window.DATA = {
  PROGRAMS, COURSES, SESSIONS,
  CUSTOMERS, CUSTOMER_TAGS, NOTE_TAGS, BACKEND_ORDERS, FACULTY, facultyFor,
  PROSPECTS, PROSPECT_SOURCES, PROSPECT_STATUSES, loadProspects, saveProspects,
  customersForCourse, ordersRoster, enrolledFor,
  loadCustomers, saveCustomers, loadCourses, saveCourses, sessionsOf,
  COURSE_CATEGORIES, categoryOf,
  loadCancelledSessions, saveCancelledSessions,
  loadSuspended, saveSuspended,
  RECRUIT_CLASSES, loadPerf, savePerf, recruitingPool, todayISO, fmtLastContact,
  poolKey, addPoolMembers, removePoolMember, createProspectIfAbsent, convertProspectsByOrders, nextProspectId, nextCustomerId, statusHistoryFor,
  ROLES, roleLabel, USERS_SEED, loadUsers, saveUsers, nextUserId, authenticate, getSession, setSession, clearSession, isLastActiveSuperuser,
};
