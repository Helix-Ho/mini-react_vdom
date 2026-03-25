import assert from "node:assert/strict";

import { createElementVNode, createRootVNode, createTextVNode } from "../src/model/vnode.js";
import {
  canGoBack,
  canGoForward,
  createSnapshotHistory,
  getCurrentSnapshot,
  goBack,
  goForward,
  pushSnapshot,
} from "../src/history/snapshotHistory.js";

function snapshotOf(text, extraTag = null) {
  const children = [createElementVNode("p", {}, [createTextVNode(text)])];

  if (extraTag) {
    children.push(createElementVNode(extraTag, {}, [createTextVNode(extraTag.toUpperCase())]));
  }

  return createRootVNode(children);
}

const cases = [
  {
    name: "initial history starts with one snapshot and no navigation",
    run() {
      const history = createSnapshotHistory(snapshotOf("Initial"));

      assert.equal(history.snapshots.length, 1);
      assert.equal(history.cursor, 0);
      assert.equal(canGoBack(history), false);
      assert.equal(canGoForward(history), false);
    },
  },
  {
    name: "pushSnapshot appends a new snapshot and advances the cursor",
    run() {
      const history = createSnapshotHistory(snapshotOf("Initial"));
      pushSnapshot(history, snapshotOf("Second"));

      assert.equal(history.snapshots.length, 2);
      assert.equal(history.cursor, 1);
      assert.equal(canGoBack(history), true);
      assert.equal(getCurrentSnapshot(history).children[0].children[0].value, "Second");
    },
  },
  {
    name: "goBack and goForward move between snapshots",
    run() {
      const history = createSnapshotHistory(snapshotOf("Initial"));
      pushSnapshot(history, snapshotOf("Second"));
      pushSnapshot(history, snapshotOf("Third"));

      assert.equal(goBack(history).children[0].children[0].value, "Second");
      assert.equal(history.cursor, 1);
      assert.equal(goBack(history).children[0].children[0].value, "Initial");
      assert.equal(canGoBack(history), false);
      assert.equal(goForward(history).children[0].children[0].value, "Second");
      assert.equal(canGoForward(history), true);
    },
  },
  {
    name: "pushing after undo discards the previous future snapshots",
    run() {
      const history = createSnapshotHistory(snapshotOf("Initial"));
      pushSnapshot(history, snapshotOf("Second"));
      pushSnapshot(history, snapshotOf("Third"));

      goBack(history);
      pushSnapshot(history, snapshotOf("Branch", "small"));

      assert.equal(history.snapshots.length, 3);
      assert.equal(history.cursor, 2);
      assert.equal(canGoForward(history), false);
      assert.equal(getCurrentSnapshot(history).children[1].tag, "small");
    },
  },
  {
    name: "getCurrentSnapshot returns clones so callers cannot mutate stored history",
    run() {
      const history = createSnapshotHistory(snapshotOf("Initial"));
      const currentSnapshot = getCurrentSnapshot(history);

      currentSnapshot.children[0].children[0].value = "Changed outside";

      assert.equal(getCurrentSnapshot(history).children[0].children[0].value, "Initial");
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} history test case(s).`);
