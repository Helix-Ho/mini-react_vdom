import assert from "node:assert/strict";

import { createElementVNode, createRootVNode, createTextVNode } from "../src/model/vnode.js";
import { diff, diffWithMeta, formatPatch } from "../src/diff/diff.js";

function keyedItem(key, text) {
  return createElementVNode("li", { "data-key": key }, [createTextVNode(text)]);
}

const cases = [
  {
    name: "front insertion with data-key becomes a single INSERT instead of text churn",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("a", "A"), keyedItem("b", "B")]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("x", "X"), keyedItem("a", "A"), keyedItem("b", "B")]),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "INSERT",
          path: [0, 0],
          node: {
            type: "element",
            tag: "li",
            props: { "data-key": "x" },
            children: [{ type: "text", value: "X" }],
          },
        },
      ]);
    },
  },
  {
    name: "front removal with data-key becomes a single REMOVE and keeps the surviving keyed item stable",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("a", "A"), keyedItem("b", "B")]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("b", "B")]),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "REMOVE",
          path: [0, 0],
        },
      ]);
    },
  },
  {
    name: "keyed reorder emits a REORDER patch plus a warning because MOVE optimization is deferred",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("a", "A"), keyedItem("b", "B"), keyedItem("c", "C")]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("b", "B"), keyedItem("a", "A"), keyedItem("c", "C")]),
      ]);

      const result = diffWithMeta(oldTree, newTree);

      assert.deepEqual(result.patches, [
        {
          type: "REORDER",
          path: [0],
          children: [
            { type: "element", tag: "li", props: { "data-key": "b" }, children: [{ type: "text", value: "B" }] },
            { type: "element", tag: "li", props: { "data-key": "a" }, children: [{ type: "text", value: "A" }] },
            { type: "element", tag: "li", props: { "data-key": "c" }, children: [{ type: "text", value: "C" }] },
          ],
        },
      ]);
      assert.equal(result.warnings.length, 1);
      assert.equal(formatPatch(result.patches[0]), "REORDER root.0 <= keyed children");
    },
  },
  {
    name: "duplicate keys add a warning and fall back to index diff",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("dup", "A"), keyedItem("dup", "B")]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("ul", {}, [keyedItem("dup", "A"), keyedItem("dup", "C")]),
      ]);

      const result = diffWithMeta(oldTree, newTree);

      assert.equal(result.warnings.length, 1);
      assert.deepEqual(result.patches, [
        {
          type: "TEXT",
          path: [0, 1, 0],
          value: "C",
        },
      ]);
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} keyed identity test case(s).`);
