import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
  THEME_KEY,
  THEMES,
  applyTheme,
  initThemeSwitcher,
  resolveTheme,
} from "../js/theme.mjs";

const ROOT = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", ROOT), "utf8");
const css = await readFile(new URL("css/style.css", ROOT), "utf8");
const app = await readFile(new URL("js/app.js", ROOT), "utf8");

const EXPECTED_THEMES = {
  paper: {
    "--background": "#f3efe6",
    "--foreground": "#1c1916",
    "--pine": "#1c3d36",
    "--pine-soft": "#e5f0eb",
    "--clay": "#8a4b32",
    "--band": "#efe4d2",
    "--line": "#e0d5c4",
    "--muted": "#5c554c",
    "--paper": "#f7f3eb",
    "--ink": "#1c1916",
    "--on-pine": "#f7f3eb",
    "--selection": "#d7ebe3",
  },
  celadon: {
    "--background": "#e5ede9",
    "--foreground": "#16201d",
    "--pine": "#1d4a5c",
    "--pine-soft": "#dcebf0",
    "--clay": "#9c5236",
    "--band": "#d6e4de",
    "--line": "#c3d4cc",
    "--muted": "#4c5b55",
    "--paper": "#f1f6f3",
    "--ink": "#14201c",
    "--on-pine": "#f1f6f3",
    "--selection": "#c7dfe8",
  },
  night: {
    "--background": "#161412",
    "--foreground": "#e9e2d5",
    "--pine": "#8fc7b0",
    "--pine-soft": "#1f2e29",
    "--clay": "#e0a07c",
    "--band": "#2a251f",
    "--line": "#38322a",
    "--muted": "#a69d90",
    "--paper": "#1f1c18",
    "--ink": "#efe8db",
    "--on-pine": "#13201c",
    "--selection": "#2f4a40",
  },
};

function themeBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `missing CSS block for ${selector}`);
  return match[1];
}

function bootstrapSource() {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const match = head.match(
    /<script\s+id=["']theme-bootstrap["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  assert.ok(match, "missing synchronous theme bootstrap in <head>");
  return match[1];
}

function runBootstrap({ search = "", stored = null, getThrows = false, setThrows = false } = {}) {
  const attributes = new Map();
  const writes = [];
  const localStorage = {
    getItem(key) {
      if (getThrows) throw new Error("storage unavailable");
      assert.equal(key, "sunzi:theme");
      return stored;
    },
    setItem(key, value) {
      if (setThrows) throw new Error("storage unavailable");
      writes.push([key, value]);
    },
  };
  const documentElement = {
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };

  vm.runInNewContext(bootstrapSource(), {
    URLSearchParams,
    document: { documentElement },
    localStorage,
    location: { search },
  });

  return { attributes, writes };
}

function makeRadio(value) {
  const attributes = new Map();
  const listeners = new Map();
  return {
    value,
    checked: false,
    setAttribute(name, nextValue) {
      attributes.set(name, nextValue);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    dispatch(name) {
      listeners.get(name)?.({ currentTarget: this });
    },
  };
}

async function withBrowserGlobals(callback, { theme = null, storageThrows = false } = {}) {
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const attributes = new Map(theme ? [["data-theme", theme]] : []);
  const radios = ["paper", "celadon", "night"].map(makeRadio);
  const writes = [];

  globalThis.document = {
    documentElement: {
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      setAttribute(name, value) {
        attributes.set(name, value);
      },
    },
    querySelectorAll(selector) {
      assert.equal(selector, 'input[name="theme"]');
      return radios;
    },
  };
  globalThis.localStorage = {
    setItem(key, value) {
      if (storageThrows) throw new Error("storage unavailable");
      writes.push([key, value]);
    },
  };

  try {
    await callback({ attributes, radios, writes });
  } finally {
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
  }
}

test("theme contract exposes only the three site themes and its own storage key", () => {
  assert.equal(THEME_KEY, "sunzi:theme");
  assert.deepEqual(THEMES, ["paper", "celadon", "night"]);
});

test("resolveTheme gives a valid URL theme highest priority", () => {
  assert.equal(resolveTheme("night", "celadon"), "night");
});

test("resolveTheme falls back to a valid stored theme", () => {
  assert.equal(resolveTheme(null, "celadon"), "celadon");
});

test("resolveTheme defaults to paper with no preferences", () => {
  assert.equal(resolveTheme(null, null), "paper");
});

test("resolveTheme rejects illegal URL and stored values", () => {
  assert.equal(resolveTheme("sepia", "system"), "paper");
});

test("head bootstrap applies and persists a valid URL theme", () => {
  const result = runBootstrap({ search: "?theme=night", stored: "celadon" });
  assert.equal(result.attributes.get("data-theme"), "night");
  assert.deepEqual(result.writes, [["sunzi:theme", "night"]]);
});

test("head bootstrap uses stored theme when query is absent", () => {
  const result = runBootstrap({ stored: "celadon" });
  assert.equal(result.attributes.get("data-theme"), "celadon");
  assert.deepEqual(result.writes, []);
});

test("head bootstrap defaults to attribute-free paper theme", () => {
  const result = runBootstrap();
  assert.equal(result.attributes.has("data-theme"), false);
});

test("head bootstrap ignores an illegal URL theme without persisting it", () => {
  const result = runBootstrap({ search: "?theme=sepia", stored: "night" });
  assert.equal(result.attributes.get("data-theme"), "night");
  assert.deepEqual(result.writes, []);
});

test("head bootstrap survives blocked storage reads and writes", () => {
  const fallback = runBootstrap({ getThrows: true });
  assert.equal(fallback.attributes.has("data-theme"), false);

  const query = runBootstrap({ search: "?theme=celadon", setThrows: true });
  assert.equal(query.attributes.get("data-theme"), "celadon");
});

test("bootstrap runs synchronously before the stylesheet and body", () => {
  const scriptIndex = html.indexOf('id="theme-bootstrap"');
  const stylesheetIndex = html.indexOf('rel="stylesheet"');
  const bodyIndex = html.indexOf("<body");
  assert.ok(scriptIndex > -1);
  assert.ok(scriptIndex < stylesheetIndex);
  assert.ok(stylesheetIndex < bodyIndex);
  assert.doesNotMatch(
    html.slice(html.lastIndexOf("<script", scriptIndex), html.indexOf(">", scriptIndex) + 1),
    /\bsrc=|\bdefer\b|\basync\b/,
  );
});

test("applyTheme keeps paper attribute-free and applies the other themes", async () => {
  await withBrowserGlobals(({ attributes }) => {
    applyTheme("night");
    assert.equal(attributes.get("data-theme"), "night");
    applyTheme("paper");
    assert.equal(attributes.has("data-theme"), false);
  });
});

test("the three theme radios initialize from the active theme", async () => {
  await withBrowserGlobals(({ radios }) => {
    initThemeSwitcher();
    assert.equal(radios.length, 3);
    assert.deepEqual(
      radios.map(({ value, checked }) => [value, checked]),
      [
        ["paper", true],
        ["celadon", false],
        ["night", false],
      ],
    );
    assert.deepEqual(
      radios.map((radio) => radio.getAttribute("aria-checked")),
      ["true", "false", "false"],
    );
  });

  await withBrowserGlobals(
    ({ radios }) => {
      initThemeSwitcher();
      assert.equal(radios[2].checked, true);
      assert.equal(radios[2].getAttribute("aria-checked"), "true");
    },
    { theme: "night" },
  );
});

test("radio changes apply and store the selected theme even when storage is blocked", async () => {
  await withBrowserGlobals(({ attributes, radios, writes }) => {
    initThemeSwitcher();
    radios[1].checked = true;
    radios[1].dispatch("change");
    assert.equal(attributes.get("data-theme"), "celadon");
    assert.deepEqual(writes, [["sunzi:theme", "celadon"]]);
    assert.deepEqual(
      radios.map((radio) => radio.getAttribute("aria-checked")),
      ["false", "true", "false"],
    );
  });

  await withBrowserGlobals(
    ({ attributes, radios }) => {
      initThemeSwitcher();
      radios[2].checked = true;
      assert.doesNotThrow(() => radios[2].dispatch("change"));
      assert.equal(attributes.get("data-theme"), "night");
    },
    { storageThrows: true },
  );
});

test("HTML contains three responsive header radios and the runtime module", () => {
  for (const theme of ["paper", "celadon", "night"]) {
    assert.match(
      html,
      new RegExp(
        `<input[^>]+type=["']radio["'][^>]+name=["']theme["'][^>]+value=["']${theme}["']`,
      ),
    );
  }
  assert.match(html, /class=["'][^"']*theme-switcher[^"']*["']/);
  assert.match(html, /<script\s+src=["']js\/theme\.mjs["']\s+type=["']module["']/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.theme-switcher/);
});

test("all three themes use the exact shared palette", () => {
  for (const [theme, variables] of Object.entries(EXPECTED_THEMES)) {
    const selector = theme === "paper" ? ":root" : `:root[data-theme="${theme}"]`;
    const block = themeBlock(selector);
    for (const [name, value] of Object.entries(variables)) {
      assert.match(block, new RegExp(`${name}:\\s*${value.replace("#", "\\#")}\\s*;`));
    }
  }
});

test("font resources and all four shared font roles are declared", () => {
  assert.match(
    css,
    /https:\/\/fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond:[^"')]+family=Noto\+Sans\+SC:[^"')]+family=Noto\+Serif\+SC:[^"')]+display=swap/,
  );
  assert.match(
    css,
    /https:\/\/cdn\.jsdelivr\.net\/npm\/lxgw-wenkai-screen-web@1\.522\.0\/lxgwwenkaiscreen\/result\.css/,
  );
  assert.match(css, /--font-sans:\s*"Noto Sans SC"/);
  assert.match(css, /--font-serif:\s*"Noto Serif SC"/);
  assert.match(css, /--font-kai:\s*"LXGW WenKai Screen"/);
  assert.match(css, /--font-numerals:\s*"Cormorant Garamond"/);
});

test("existing chapter hash routing and content script remain intact", () => {
  assert.match(app, /`#chapter\/\$\{state\.currentId\}`/);
  assert.match(app, /raw\.startsWith\("chapter\/"\)/);
  assert.match(app, /window\.addEventListener\("hashchange"/);
  assert.match(html, /<script src=["']js\/app\.js["'] type=["']module["']/);
});
