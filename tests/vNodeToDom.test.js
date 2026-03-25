import assert from "node:assert/strict";

import { createElementVNode, createRootVNode, createTextVNode } from "../src/model/vnode.js";
import { renderVNodeTree, vNodeToDom } from "../src/dom/vNodeToDom.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function createFakeTextNode(textContent) {
  return {
    nodeType: TEXT_NODE,
    textContent,
  };
}

function createFakeElement(tagName) {
  return {
    nodeType: ELEMENT_NODE,
    tagName,
    attributes: {},
    childNodes: [],
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    appendChild(childNode) {
      this.childNodes.push(childNode);
      return childNode;
    },
  };
}

function createFakeContainer() {
  return {
    childNodes: [],
    replaceChildren(...childNodes) {
      this.childNodes = childNodes;
    },
  };
}

function createFakeDocument() {
  return {
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    createTextNode(textContent) {
      return createFakeTextNode(textContent);
    },
  };
}

function serializeFakeNode(node) {
  if (node.nodeType === TEXT_NODE) {
    return node.textContent;
  }

  const attributes = Object.entries(node.attributes)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");
  const children = node.childNodes.map(serializeFakeNode).join("");

  return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
}

const fakeDocument = createFakeDocument();

const cases = [
  {
    name: "element vnode becomes nested DOM with props and text content",
    run() {
      const domNode = vNodeToDom(
        createElementVNode("section", { class: "card", "data-key": "root" }, [
          createElementVNode("h3", {}, [createTextVNode("Title")]),
          createTextVNode("Body text"),
        ]),
        fakeDocument,
      );

      assert.equal(
        serializeFakeNode(domNode),
        '<section class="card" data-key="root"><h3>Title</h3>Body text</section>',
      );
    },
  },
  {
    name: "root vnode renders multiple top-level children into the container",
    run() {
      const container = createFakeContainer();
      const rootVNode = createRootVNode([
        createElementVNode("p", {}, [createTextVNode("First")]),
        createElementVNode("span", { "data-key": "second" }, [createTextVNode("Second")]),
      ]);

      renderVNodeTree(rootVNode, container, fakeDocument);

      assert.equal(container.childNodes.length, 2);
      assert.equal(
        container.childNodes.map(serializeFakeNode).join(""),
        '<p>First</p><span data-key="second">Second</span>',
      );
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} vNodeToDom test case(s).`);
