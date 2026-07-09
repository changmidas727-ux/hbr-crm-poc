# HBR 課務 CRM — 前端原型（POC）

純前端 React 原型，展示課程管理、期數成效、潛客管理、客戶管理、帳號權限等六大模組。**無後端、無 build 流程**：瀏覽器直接以 [Babel standalone](https://babeljs.io/docs/babel-standalone) 即時編譯 `app/*.jsx` 並執行，資料全存於瀏覽器 `localStorage`（皆為 mock 假資料）。

## Demo 網址

`https://<owner>.github.io/hbr-crm-poc/`（推送並開啟 GitHub Pages 後取得）

## Demo 帳號

| Email | 密碼 | 角色 |
|---|---|---|
| admin@hbr.tw | admin123 | 系統管理員（superuser，可進帳號權限管理） |
| chen@hbr.tw | staff123 | 課務人員（staff） |

## 本機預覽

需透過 HTTP server 開啟（`app/*.jsx` 以 `<script src>` 載入，`file://` 會被瀏覽器 CORS 擋下，無法雙擊開啟）：

```bash
npx serve .
# 或
python -m http.server 8000
```

再開瀏覽器造訪對應網址（例如 `http://localhost:8000`）。

## 目錄結構

- `index.html` — 進入點（原名 `出缺勤系統.html`，已更名以取得乾淨網址）
- `app/` — 應用程式原始碼（React 元件、資料層 `data.js`、樣式 token）
- `vendor/` — React（production build）與 Babel standalone，本機打包避免依賴外部 CDN
- `docs/` — 需求規格（PRD、使用者流程、功能細項、元件互動、主管簽核、開發紀錄）

## 已知限制（原型階段）

- 資料存於瀏覽器 `localStorage`，單機、非多人協作。
- 密碼為明文比對（demo 用途）。
- 「系統匯入」為示範假資料，非真實後台串接。
- 詳見 `docs/開發文件.md` 與 `docs/規格.md`。
