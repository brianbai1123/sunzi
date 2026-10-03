import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const appSource = await readFile(new URL("js/app.js", ROOT), "utf8");
const chapters = JSON.parse(
  await readFile(new URL("data/chapters.json", ROOT), "utf8"),
);
const essence = JSON.parse(
  await readFile(new URL("data/essentials.json", ROOT), "utf8"),
);

function makeElement() {
  const listeners = new Map();
  return {
    dataset: {},
    value: "",
    classList: { toggle() {} },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type) {
      listeners.get(type)?.({
        currentTarget: this,
        preventDefault() {},
        target: this,
      });
    },
  };
}

async function runApp({ blocked = false, storedChapter = null, hash = "#home" } = {}) {
  const errors = [];
  const writes = [];
  const location = { hash };
  const app = {
    innerHTML: "",
    querySelector() {
      return makeElement();
    },
    querySelectorAll() {
      return [];
    },
  };
  const searchInput = makeElement();
  const localStorage = {
    getItem(key) {
      if (blocked) {
        throw new DOMException("storage blocked", "SecurityError");
      }
      assert.equal(key, "sunzi-last-chapter");
      return storedChapter;
    },
    setItem(key, value) {
      if (blocked) {
        throw new DOMException("storage blocked", "SecurityError");
      }
      writes.push([key, value]);
    },
  };
  const context = {
    clearTimeout,
    console: {
      error(error) {
        errors.push(error);
      },
    },
    document: {
      addEventListener() {},
      getElementById(id) {
        return id === "app" ? app : searchInput;
      },
      querySelectorAll() {
        return [];
      },
    },
    DOMException,
    fetch(url) {
      const value = url.endsWith("chapters.json") ? chapters : essence;
      return Promise.resolve({
        json: () => Promise.resolve(value),
      });
    },
    history: {
      pushState(_state, _unused, nextHash) {
        location.hash = nextHash;
      },
    },
    localStorage,
    location,
    setTimeout,
    window: {
      addEventListener() {},
      scrollTo() {},
    },
  };

  vm.runInNewContext(
    `${appSource}\n;globalThis.__APP_TEST__ = { go, state };`,
    context,
    { filename: "js/app.js" },
  );

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (context.__APP_TEST__.state.chapters.length > 0) {
      await new Promise((resolve) => setImmediate(resolve));
      break;
    }
    await new Promise((resolve) => setImmediate(resolve));
  }

  return {
    app,
    errors,
    go: context.__APP_TEST__.go,
    location,
    state: context.__APP_TEST__.state,
    writes,
  };
}

test("blocked storage keeps the home flow on default chapter 1 without errors", async () => {
  const result = await runApp({ blocked: true });

  assert.equal(result.state.currentId, 1);
  assert.match(result.app.innerHTML, /data-id="1"/);
  assert.match(result.app.innerHTML, /从始计开始/);
  assert.doesNotMatch(result.app.innerHTML, /加载失败/);
  assert.deepEqual(result.errors, []);
});

test("blocked storage does not throw when a chapter is opened", async () => {
  const result = await runApp({ blocked: true });

  assert.doesNotThrow(() => result.go("card", 2));
  assert.equal(result.state.currentId, 2);
  assert.equal(result.location.hash, "#chapter/2");
  assert.deepEqual(result.errors, []);
});

test("storage protection does not swallow unrelated rendering errors", async () => {
  const result = await runApp({ blocked: true });
  const businessError = new Error("render failed");
  result.app.querySelector = () => {
    throw businessError;
  };

  assert.throws(() => result.go("card", 2), businessError);
});

test("available storage preserves resume reads and chapter writes", async () => {
  const result = await runApp({ storedChapter: "4" });

  assert.match(result.app.innerHTML, /data-id="4"/);
  assert.match(result.app.innerHTML, /继续读军形/);
  result.go("card", 5);
  assert.deepEqual(result.writes, [["sunzi-last-chapter", "5"]]);
  assert.equal(result.location.hash, "#chapter/5");
});
