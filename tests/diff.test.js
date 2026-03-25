import assert from "node:assert/strict";

import { createElementVNode, createRootVNode, createTextVNode } from "../src/model/vnode.js";
import { diff, formatPatch } from "../src/diff/diff.js";

const cases = [
  {
    name: "identical trees produce no patches",
    run() {
      const oldTree = createRootVNode([createElementVNode("p", {}, [createTextVNode("Same")])]);
      const newTree = createRootVNode([createElementVNode("p", {}, [createTextVNode("Same")])]);

      assert.deepEqual(diff(oldTree, newTree), []);
    },
  },
  {
    name: "insert patches use the child path where the new node appears",
    run() {
      const oldTree = createRootVNode([createElementVNode("p", {}, [createTextVNode("First")])]);
      const newTree = createRootVNode([
        createElementVNode("p", {}, [createTextVNode("First")]),
        createElementVNode("span", { class: "new" }, [createTextVNode("Second")]),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "INSERT",
          path: [1],
          node: {
            type: "element",
            tag: "span",
            props: { class: "new" },
            children: [{ type: "text", value: "Second" }],
          },
        },
      ]);
    },
  },
  {
    name: "remove patches point at the removed nested child path",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("div", {}, [
          createTextVNode("Keep"),
          createElementVNode("em", {}, [createTextVNode("Delete me")]),
        ]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("div", {}, [createTextVNode("Keep")]),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "REMOVE",
          path: [0, 1],
        },
      ]);
    },
  },
  {
    name: "replace patches fire when same-position nodes are different kinds",
    run() {
      const oldTree = createRootVNode([createElementVNode("p", {}, [createTextVNode("Title")])]);
      const newTree = createRootVNode([createElementVNode("h2", {}, [createTextVNode("Title")])]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "REPLACE",
          path: [0],
          node: {
            type: "element",
            tag: "h2",
            props: {},
            children: [{ type: "text", value: "Title" }],
          },
        },
      ]);
    },
  },
  {
    name: "text patches fire for changed text nodes and keep the nested path",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("section", {}, [
          createElementVNode("p", {}, [createTextVNode("Before")]),
          createElementVNode("small", {}, [createTextVNode("Meta")]),
        ]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("section", {}, [
          createElementVNode("p", {}, [createTextVNode("After")]),
          createElementVNode("small", {}, [createTextVNode("Meta")]),
          createElementVNode("strong", {}, [createTextVNode("New child")]),
        ]),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "TEXT",
          path: [0, 0, 0],
          value: "After",
        },
        {
          type: "INSERT",
          path: [0, 2],
          node: {
            type: "element",
            tag: "strong",
            props: {},
            children: [{ type: "text", value: "New child" }],
          },
        },
      ]);
    },
  },
  {
    name: "props diff emits set/remove attr patches on the element path",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("div", { class: "card", title: "legacy" }, []),
      ]);
      const newTree = createRootVNode([
        createElementVNode("div", { class: "card-next", "data-key": "card-1" }, []),
      ]);

      assert.deepEqual(diff(oldTree, newTree), [
        {
          type: "SET_ATTR",
          path: [0],
          name: "class",
          value: "card-next",
        },
        {
          type: "SET_ATTR",
          path: [0],
          name: "data-key",
          value: "card-1",
        },
        {
          type: "REMOVE_ATTR",
          path: [0],
          name: "title",
        },
      ]);
    },
  },
  {
    name: "formatPatch turns a patch into a readable log line",
    run() {
      const patch = {
        type: "TEXT",
        path: [0, 1, 0],
        value: "Updated body",
      };

      assert.equal(formatPatch(patch), 'TEXT root.0.1.0 => "Updated body"');
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} diff test case(s).`);
