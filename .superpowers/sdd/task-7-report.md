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
