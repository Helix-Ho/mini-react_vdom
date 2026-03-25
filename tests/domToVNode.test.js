import assert from "node:assert/strict";

import { domRootToVNodeTree, domToVNode, isWhitespaceOnlyTextNode } from "../src/dom/domToVNode.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

function attribute(name, value) {
  return { name, value };
}

function textNode(textContent) {
  return {
    nodeType: TEXT_NODE,
    textContent,
  };
}

function commentNode(textContent) {
  return {
    nodeType: COMMENT_NODE,
    textContent,
  };
}

function elementNode(tagName, attributes = [], childNodes = []) {
  return {
    nodeType: ELEMENT_NODE,
    tagName: tagName.toUpperCase(),
    attributes,
    childNodes,
  };
}

const cases = [
  {
    name: "element nodes become element vnodes with props and text children",
    run() {
      const vnode = domToVNode(
        elementNode("section", [attribute("class", "card"), attribute("data-key", "root")], [
          elementNode("h3", [], [textNode("Title")]),
          textNode("Body text"),
        ]),
      );

      assert.deepEqual(vnode, {
        type: "element",
        tag: "section",
        props: {
          class: "card",
          "data-key": "root",
        },
        children: [
          {
            type: "element",
            tag: "h3",
            props: {},
            children: [
              {
                type: "text",
                value: "Title",
              },
            ],
          },
          {
            type: "text",
            value: "Body text",
          },
        ],
      });
    },
  },
  {
    name: "whitespace-only text nodes are ignored",
    run() {
      assert.equal(domToVNode(textNode("   ")), null);
      assert.equal(isWhitespaceOnlyTextNode(textNode("\n\t  ")), true);
    },
  },
  {
    name: "non-empty text nodes keep their original text content",
    run() {
      assert.deepEqual(domToVNode(textNode(" Hello ")), {
        type: "text",
        value: " Hello ",
      });
    },
  },
  {
    name: "root wrapper keeps only meaningful top-level nodes",
    run() {
      const rootTree = domRootToVNodeTree(
        elementNode("body", [], [
          textNode(" "),
          elementNode("p", [], [textNode("First")]),
          commentNode("ignore me"),
          elementNode("span", [attribute("data-key", "second")], [textNode("Second")]),
        ]),
      );

      assert.deepEqual(rootTree, {
        type: "root",
        children: [
          {
            type: "element",
            tag: "p",
            props: {},
            children: [
              {
                type: "text",
                value: "First",
              },
            ],
          },
          {
            type: "element",
            tag: "span",
            props: {
              "data-key": "second",
            },
            children: [
              {
                type: "text",
                value: "Second",
              },
            ],
          },
        ],
      });
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} domToVNode test case(s).`);
