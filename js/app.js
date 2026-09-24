const state = {
  chapters: [],
  essence: null,
  view: "home",
  filter: "all",
  query: "",
  currentId: 1,
  tab: "plain",
  flashIndex: 0,
  flashRevealed: false,
};

const app = document.getElementById("app");
const searchInput = document.getElementById("searchInput");
const LAST_KEY = "sunzi-last-chapter";

async function loadData() {
  const [chapters, essence] = await Promise.all([
    fetch("data/chapters.json").then((r) => r.json()),
    fetch("data/essentials.json").then((r) => r.json()),
  ]);
  state.chapters = chapters;
  state.essence = essence;
}

function setNavActive() {
  document.querySelectorAll(".nav button").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.nav === state.view || (state.view === "card" && btn.dataset.nav === "list")
    );
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filteredChapters() {
  let list = state.chapters;
  if (state.filter !== "all") list = list.filter((h) => h.section === state.filter);
  const q = state.query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((h) => {
    const blob = [
      h.name,
      h.alias,
      h.pinyin,
      h.keyword,
      h.oneLiner,
      h.section,
      ...h.passages.map((p) => `${p.pos} ${p.text} ${p.decode || ""}`),
      h.plain.core,
      h.plain.recite,
      ...h.scholars.map((s) => s.name + s.view),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q) || String(h.id) === q;
  });
}

function fullClassic(h) {
  return h.passages.map((p) => p.text).join("\n\n");
}

function go(view, id) {
  state.view = view;
  if (id) state.currentId = id;
  const hash =
    view === "card" ? `#chapter/${state.currentId}` : view === "home" ? "#home" : `#${view}`;
  if (location.hash !== hash) history.pushState(null, "", hash);
  if (view === "card") {
    state.tab = "plain";
    state.flashIndex = 0;
    state.flashRevealed = false;
    localStorage.setItem(LAST_KEY, String(state.currentId));
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  const last = Number(localStorage.getItem(LAST_KEY) || 1);
  const ch = state.chapters.find((x) => x.id === last) || state.chapters[0];
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero-brand">孙子</h1>
      <p>十三篇做成十三张读书卡：原文可背，白话能懂，名家观点可比较。专为想把《孙子兵法》读进心里的中学生与初学者。</p>
      <div class="hero-actions">
        <button class="btn" type="button" data-go="list">打开十三篇</button>
        <button class="btn ghost" type="button" data-go="card" data-id="${ch.id}">${last > 1 ? `继续读${escapeHtml(ch.name)}` : "从始计开始"}</button>
        <button class="btn ghost" type="button" data-go="essence">先读兵法精要</button>
      </div>
      <div class="map-row" aria-label="十三篇">
        ${state.chapters
          .map(
            (h) =>
              `<button type="button" data-go="card" data-id="${h.id}"><span class="n">${h.id}</span><span class="s">${escapeHtml(h.seal)}</span></button>`
          )
          .join("")}
      </div>
    </section>
  `;
  bindGo();
}

function renderList() {
  const list = filteredChapters();
  const sections = ["筹划", "形势", "机动", "地利"];
  app.innerHTML = `
    <h2 class="section-title">十三篇</h2>
    <p class="section-lead">前三篇定计与目标，中三篇讲形、势、虚实，接着三篇讲会战与应变，最后四篇讲地形、军心、火攻与情报。点进任一篇，即是一张完整读书卡。</p>
    <div class="filter-row">
      <button class="chip ${state.filter === "all" ? "active" : ""}" data-filter="all">全部</button>
      ${sections
        .map(
          (s) =>
            `<button class="chip ${state.filter === s ? "active" : ""}" data-filter="${s}">${s}</button>`
        )
        .join("")}
    </div>
    <div class="grid">
      ${
        list
          .map(
            (h, i) => `
        <button class="hex-tile" type="button" data-id="${h.id}" style="animation-delay:${Math.min(i, 12) * 0.03}s">
          <span class="id">第${h.id}篇 · ${escapeHtml(h.section)}</span>
          <span class="sym">${escapeHtml(h.seal)}</span>
          <span class="nm">${escapeHtml(h.name)}</span>
          <span class="kw">${escapeHtml(h.keyword)}</span>
        </button>`
          )
          .join("") || `<div class="empty">没有匹配的篇目，试试别的关键词。</div>`
      }
    </div>
  `;
  app.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });
  app.querySelectorAll(".hex-tile").forEach((btn) => {
    btn.addEventListener("click", () => go("card", Number(btn.dataset.id)));
  });
}

function renderCard() {
  const h = state.chapters.find((x) => x.id === state.currentId);
  if (!h) {
    app.innerHTML = `<div class="empty">未找到该篇</div>`;
    return;
  }
  const total = state.chapters.length;
  const prev = h.id > 1 ? h.id - 1 : total;
  const next = h.id < total ? h.id + 1 : 1;
  const tabs = [
    ["plain", "通俗讲解"],
    ["classic", "篇文原文"],
    ["lines", "句读导读"],
    ["scholars", "名家对比"],
    ["flash", "背诵卡"],
  ];

  app.innerHTML = `
    <div class="card-shell">
      <div class="card-nav">
        <button class="btn ghost" type="button" data-go="list">← 篇目录</button>
        <div class="pager">
          <button class="btn ghost" type="button" data-id="${prev}">上一篇</button>
          <button class="btn ghost" type="button" data-id="${next}">下一篇</button>
        </div>
      </div>
      <article class="reading-card">
        <div class="card-top">
          <div class="seal" aria-hidden="true">${escapeHtml(h.seal)}</div>
          <div class="card-head">
            <h1>${escapeHtml(h.name)}篇</h1>
            <p class="meta">第${h.id}篇 · ${escapeHtml(h.alias)} · ${escapeHtml(h.pinyin)} · ${escapeHtml(h.section)}</p>
            <div class="keyword">${escapeHtml(h.keyword)}</div>
            <p class="one-liner">${escapeHtml(h.oneLiner)}</p>
          </div>
        </div>

        <div class="tabs">
          ${tabs
            .map(
              ([id, label]) =>
                `<button type="button" data-tab="${id}" class="${state.tab === id ? "active" : ""}">${label}</button>`
            )
            .join("")}
        </div>

        <div class="panel ${state.tab === "plain" ? "active" : ""}" data-panel="plain">
          <div class="block"><h3>本篇场景</h3><p class="rich">${escapeHtml(h.plain.scene)}</p></div>
          <div class="block"><h3>核心深讲</h3><p class="rich">${escapeHtml(h.plain.core)}</p></div>
          <div class="block"><h3>篇旨白话</h3><p class="rich">${escapeHtml(h.plain.plain)}</p></div>
          <div class="block"><h3>生活故事</h3><p class="rich">${escapeHtml(h.plain.story)}</p></div>
          <div class="block"><h3>深刻启发</h3><p class="rich">${escapeHtml(h.plain.wisdom)}</p></div>
          <div class="block"><h3>今日可做</h3><p class="rich practice">${escapeHtml(h.plain.practice)}</p></div>
          <div class="recite-box"><strong>背诵提纲</strong><div>${escapeHtml(h.plain.recite)}</div></div>
        </div>

        <div class="panel ${state.tab === "classic" ? "active" : ""}" data-panel="classic">
          <p class="yao-lead">以下为十三篇通行本全文，按自然段断开。异文在句读导读里点出，不把校勘符号写进正文。</p>
          ${h.passages
            .map(
              (p) => `
            <div class="block">
              <h3>${escapeHtml(p.pos)}</h3>
              <div class="classic">${escapeHtml(p.text)}</div>
            </div>`
            )
            .join("")}
        </div>

        <div class="panel ${state.tab === "lines" ? "active" : ""}" data-panel="lines">
          <p class="yao-lead">按段读，像看一部连续的决策短剧。先懂原文，再看它在全篇中的位置，最后落到怎么做、警惕什么。</p>
          <div class="yao-list">
            ${h.passages
              .map(
                (p, idx) => `
              <div class="yao-item rich-yao">
                <div class="yao-head">
                  <span class="pos">${escapeHtml(p.pos)}</span>
                  <span class="yao-ord">第${idx + 1}段</span>
                </div>
                <div class="classic yao-text">${escapeHtml(p.text)}</div>
                <div class="yao-grid">
                  <div><h4>白话拆解</h4><p>${escapeHtml(p.decode)}</p></div>
                  <div><h4>在本篇的位置</h4><p>${escapeHtml(p.why)}</p></div>
                  <div><h4>此时怎么做</h4><p>${escapeHtml(p.do)}</p></div>
                  <div><h4>要警惕什么</h4><p>${escapeHtml(p.avoid)}</p></div>
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>

        <div class="panel ${state.tab === "scholars" ? "active" : ""}" data-panel="scholars">
          <p class="yao-lead">每位名家按五步展开：先理解 → 核心观点 → 重建逻辑 → 简单表达 → 快速理解检查。注家大意是导读综述，不是逐字引用。</p>
          <div class="scholar-grid">
            ${h.scholars
              .map(
                (s) => `
              <article class="scholar-card">
                <header class="scholar-card-head">
                  <div class="who">${escapeHtml(s.name)}</div>
                  <div class="scholar-view">${escapeHtml(s.view)}</div>
                </header>
                <div class="scholar-steps">
                  <div class="scholar-step"><h4><span class="step-no">1</span>先理解</h4><p>${escapeHtml(s.understand)}</p></div>
                  <div class="scholar-step"><h4><span class="step-no">2</span>核心观点</h4><p>${escapeHtml(s.core)}</p></div>
                  <div class="scholar-step"><h4><span class="step-no">3</span>重建逻辑</h4><p>${escapeHtml(s.logic)}</p></div>
                  <div class="scholar-step"><h4><span class="step-no">4</span>简单表达</h4><p>${escapeHtml(s.plain)}</p></div>
                  <div class="scholar-step check"><h4><span class="step-no">5</span>快速理解检查</h4><p>${escapeHtml(s.check)}</p></div>
                </div>
              </article>`
              )
              .join("")}
          </div>
          <div class="contrast"><strong>对比小结</strong><p style="margin:.4rem 0 0;">${escapeHtml(h.contrast)}</p></div>
        </div>

        <div class="panel ${state.tab === "flash" ? "active" : ""}" data-panel="flash">
          ${renderFlashInner(h)}
        </div>
      </article>
    </div>
  `;

  app.querySelector('[data-go="list"]').addEventListener("click", () => go("list"));
  app.querySelectorAll(".pager [data-id]").forEach((btn) => {
    btn.addEventListener("click", () => go("card", Number(btn.dataset.id)));
  });
  app.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      state.flashRevealed = false;
      renderCard();
    });
  });
  bindFlash(h);
}

function flashItems(h) {
  return [
    { front: `${h.name} · 关键词`, back: h.keyword },
    { front: `${h.name} · 一句话`, back: h.oneLiner },
    { front: `${h.name} · 背诵提纲`, back: h.plain.recite },
    { front: `${h.name} · 核心`, back: h.plain.core },
    ...h.passages.map((p) => ({
      front: `${h.name} · ${p.pos}\n${p.text}`,
      back: `${p.decode}\n怎么做：${p.do}\n警惕：${p.avoid}`,
    })),
  ];
}

function renderFlashInner(h) {
  const items = flashItems(h);
  const i = ((state.flashIndex % items.length) + items.length) % items.length;
  const item = items[i];
  return `
    <div class="flash-controls">
      <button class="btn ghost" type="button" data-flash="prev">上一张</button>
      <button class="btn ghost" type="button" data-flash="next">下一张</button>
      <button class="btn" type="button" data-flash="toggle">${state.flashRevealed ? "隐藏答案" : "显示答案"}</button>
      <span style="color:var(--ink-soft);align-self:center;">${i + 1} / ${items.length}</span>
    </div>
    <div class="flash-face" data-flash="toggle" role="button" tabindex="0">
      <div>
        <div class="big">${escapeHtml(state.flashRevealed ? item.back : item.front)}</div>
        <div class="small">${state.flashRevealed ? "点击继续背下一张，或按「隐藏答案」" : "先回想，再点击翻面"}</div>
      </div>
    </div>
  `;
}

function bindFlash(h) {
  const items = flashItems(h);
  app.querySelectorAll("[data-flash]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.flash;
      if (act === "prev") {
        state.flashIndex = (state.flashIndex - 1 + items.length) % items.length;
        state.flashRevealed = false;
      } else if (act === "next") {
        state.flashIndex = (state.flashIndex + 1) % items.length;
        state.flashRevealed = false;
      } else if (act === "toggle") {
        state.flashRevealed = !state.flashRevealed;
      }
      renderCard();
    });
  });
}

function renderEssence() {
  const x = state.essence;
  app.innerHTML = `
    <h2 class="section-title">${escapeHtml(x.title)}</h2>
    <p class="section-lead">${escapeHtml(x.note)}</p>
    <div class="xici-grid">
      ${x.cards
        .map(
          (c, i) => `
        <article class="xici-card" style="animation-delay:${i * 0.02}s">
          <h3>${escapeHtml(c.title)}</h3>
          <div class="classic">${escapeHtml(c.classic)}</div>
          <p>${escapeHtml(c.plain)}</p>
          <div class="recite-box"><strong>背一句</strong>${escapeHtml(c.recite)} · 出自${escapeHtml(c.from)}</div>
        </article>`
        )
        .join("")}
    </div>
    <div class="contrast" style="margin-top:1.5rem;">
      <strong>十三篇怎么串起来</strong>
      <p style="margin:.4rem 0 0;">${escapeHtml(x.arc)}</p>
    </div>
  `;
}

function renderMethod() {
  app.innerHTML = `
    <section class="method">
      <h2 class="section-title">怎么用这套读书卡</h2>
      <p class="section-lead">目标不是学骗人，而是学会用「算—势—虚实—情报」理解竞争，并把句子真正背进心里。</p>
      <ol>
        <li><strong>先看印与关键词</strong>：这一篇在十三篇里管哪一段决策。</li>
        <li><strong>读篇文原文</strong>：先把整篇文言过一遍，不急着翻译。</li>
        <li><strong>用「通俗讲解」把文言变成故事</strong>：场景、核心、生活里的对照。</li>
        <li><strong>扫一遍句读导读</strong>：每段先拆字，再看位置，最后问自己怎么做。</li>
        <li><strong>对照名家</strong>：曹操偏实用，杜牧爱战例，张预串篇次，郭化若讲条件与辩证，李零对简本，钮先钟把它当战略。</li>
        <li><strong>打开背诵卡</strong>：遮住答案，先背关键词和提纲，再背原文。</li>
      </ol>
      <div class="recite-box">
        <strong>建议节奏</strong>
        每天 1 篇：上午读原文与讲解，晚上只用背诵卡自测 5 分钟。读完十三篇，再用「兵法精要」把名句串成一条线。
      </div>
      <div class="contrast">
        <strong>阅读边界</strong>
        <p style="margin:.4rem 0 0;">诡道、用间、示形，讲的是古代敌我之间的军事竞争。用在课堂、团队和正当竞赛里，学的是准备、信息和时机；不用来欺骗合作的人，也不用来伤害没有敌对关系的人。</p>
      </div>
      <div class="hero-actions">
        <button class="btn" type="button" data-go="list">开始选篇</button>
        <button class="btn ghost" type="button" data-go="card" data-id="1">从始计背起</button>
      </div>
    </section>
  `;
  bindGo();
}

function bindGo() {
  app.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const dest = el.dataset.go;
      if (dest === "card") go("card", Number(el.dataset.id || 1));
      else go(dest);
    });
  });
}

function render() {
  setNavActive();
  if (state.view === "home") renderHome();
  else if (state.view === "list") renderList();
  else if (state.view === "card") renderCard();
  else if (state.view === "essence") renderEssence();
  else if (state.view === "method") renderMethod();
}

function applyHash() {
  const raw = location.hash.replace(/^#/, "");
  if (raw.startsWith("chapter/")) {
    const id = Number(raw.split("/")[1]);
    if (state.chapters.some((h) => h.id === id)) {
      state.currentId = id;
      state.view = "card";
      return;
    }
  }
  if (["home", "list", "essence", "method"].includes(raw)) state.view = raw;
}

function bindChrome() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      go(el.dataset.nav);
    });
  });
  let t = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.query = searchInput.value;
      if (state.view !== "list" && state.query) {
        state.view = "list";
        history.pushState(null, "", "#list");
      }
      render();
    }, 150);
  });
  window.addEventListener("hashchange", () => {
    applyHash();
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (state.view !== "card") return;
    if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.key === "ArrowLeft") go("card", state.currentId > 1 ? state.currentId - 1 : state.chapters.length);
    if (e.key === "ArrowRight") go("card", state.currentId < state.chapters.length ? state.currentId + 1 : 1);
  });
}

async function main() {
  await loadData();
  applyHash();
  bindChrome();
  render();
}

main().catch((err) => {
  app.innerHTML = `<div class="empty">加载失败：${escapeHtml(err.message)}。请用本地静态服务器打开本目录。</div>`;
  console.error(err);
});
