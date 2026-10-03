# Task 7 报告：孙子兵法静态站字体与三主题

## 状态

完成。分支为 `cursor/sunzi-theme-sync-3ee2`，未 push、未创建 PR。

## 实现

- 主题仅含 `paper`、`celadon`、`night`，独立存储键为 `sunzi:theme`。
- `resolveTheme(query, stored)` 严格执行“合法 URL > 合法 stored > paper”。
- `<head>` 中的同步内联脚本先于 CSS 执行；合法 URL 会写回，storage 读写异常均安全降级。
- `js/theme.mjs` 管理 header 内三个 radio 的初始化、切换、`aria-checked` 和持久化。
- 三套色板逐项同步 `/tmp/7habit-theme/src/app/globals.css`；字体角色同步为 sans、serif、kai、numerals。
- Google Fonts CSS 与固定版本 `lxgw-wenkai-screen-web@1.522.0` 使用绝对 CDN URL；站内 CSS/JS 继续使用相对 URL，兼容 GitHub Pages 子路径。
- 未修改 `js/app.js`、`data/` 或 `#chapter/<id>` 路由。

## TDD 与验证证据

1. RED：`node --test tests/theme.test.mjs`
   - 退出码 1。
   - 预期失败：`ERR_MODULE_NOT_FOUND`，缺少 `js/theme.mjs`。
2. GREEN：`node --test tests/theme.test.mjs`
   - 退出码 0。
   - 18/18 通过，0 失败。
   - 覆盖四种 `resolveTheme` 优先级、VM bootstrap 的 query/stored/default/非法值/storage 异常、radio 初始化与点击、精确主题变量、字体 URL/角色、同步脚本顺序及 chapter hash 路由。
3. 本地 HTTP + Chrome：
   - `python3 -m http.server 4171`。
   - 打开 `/?theme=night#chapter/1` 后，首屏 `data-theme=night` 且存储值为 `night`。
   - 点击“青瓷”后，属性、radio、`aria-checked` 和存储均为 `celadon`，`--background` 为 `#e5ede9`。
   - 切换后 hash 仍为 `#chapter/1`，页面标题仍为“始计篇”。
4. 保护范围：
   - `git diff origin/main -- js/app.js data/` 无输出。
   - `git diff --check` 通过。

## Commit SHA

- `2667d5a` — RED 验收测试。
- `e4d5e1d` — 字体、首屏 bootstrap、运行时切换器与三主题视觉。

## 自审

逐项对照 brief 后未发现阻断问题。页面运行时、首屏脚本与测试共用相同三主题集合和存储键；paper 保持无 `data-theme` 属性；所有新增站内资源均为相对路径。

## 顾虑

- Web 字体首次加载依赖 Google Fonts 与 jsDelivr 的网络可达性；两者不可用时会使用已声明的系统中文字体回退，不影响主题和内容功能。
- 切换器视觉增强使用现代 CSS `:has()` 与 `color-mix()`；旧浏览器仍可通过原生 radio 和 JavaScript 切换主题，但高亮与混色效果可能降级。

## Task 9 集成回归修复

Task 9 发现浏览器禁止 storage 时，主题仍能应用，但 `js/app.js` 的续读读写会抛 `SecurityError`。根因是 `LAST_KEY` 的两处 `localStorage` 调用未受保护。

- RED：`node --test tests/app-storage.test.mjs`
  - 退出码 1。
  - 1/4 通过，3/4 按预期失败：首页进入加载失败、章节写入抛错、storage 异常先于模拟业务错误抛出。
  - 正常 storage 的续读读取与章节写入在 RED 阶段已通过。
- 修复：新增最小 `safeStorageGet` / `safeStorageSet`，只包裹 `LAST_KEY` 的直接 storage 调用；读取异常返回默认值，写入异常安全忽略。render、路由等后续业务逻辑不在 catch 范围内。
- GREEN：`node --test tests/*.test.mjs`
  - 22/22 通过，0 失败。
  - blocked storage 使用默认章节 1，章节写入流程不抛；模拟的非 storage render 错误仍原样抛出；正常续读和 `#chapter/<id>` 路由不变。
- 本地 Chrome：在文档脚本前覆写 `Storage.prototype.getItem/setItem` 抛 `SecurityError`，打开 `/?theme=celadon`。
  - celadon 主题与 radio 正确，首页默认续读章节为 1。
  - 点击第二篇后进入 `#chapter/2` 并显示“作战篇”。
  - console error 0，page error 0，storage error log 0。
- 修复 commit：`81fce51`。

新增顾虑：无。storage 不可用时无法保存续读位置属于预期降级；页面功能、主题与 hash 路由保持可用。
