import assert from "node:assert/strict";

import { diff } from "../src/diff/diff.js";
import { createElementVNode, createRootVNode, createTextVNode } from "../src/model/vnode.js";
import { applyPatches } from "../src/patch/applyPatch.js";
import { renderVNodeTree } from "../src/dom/vNodeToDom.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function attachChild(parentNode, childNode, childIndex = parentNode.childNodes.length) {
  if (childNode.parentNode) {
    childNode.parentNode.removeChild(childNode);
  }

  childNode.parentNode = parentNode;
  parentNode.childNodes.splice(childIndex, 0, childNode);

  return childNode;
}

function detachChild(parentNode, childNode) {
  const childIndex = parentNode.childNodes.indexOf(childNode);

  if (childIndex === -1) {
    throw new Error("Child node not found.");
  }

  parentNode.childNodes.splice(childIndex, 1);
  childNode.parentNode = null;

  return childNode;
}

function createParentNodeBase(nodeType) {
  return {
    nodeType,
    parentNode: null,
    childNodes: [],
    appendChild(childNode) {
      return attachChild(this, childNode);
    },
    insertBefore(childNode, referenceNode) {
      if (!referenceNode) {
        return attachChild(this, childNode);
      }

      const childIndex = this.childNodes.indexOf(referenceNode);

      if (childIndex === -1) {
        throw new Error("Reference node not found.");
      }

      return attachChild(this, childNode, childIndex);
    },
    removeChild(childNode) {
      return detachChild(this, childNode);
    },
    replaceChildren(...childNodes) {
      for (const existingChild of [...this.childNodes]) {
        detachChild(this, existingChild);
      }

      childNodes.forEach((childNode) => {
        attachChild(this, childNode);
      });
    },
  };
}

function attachNodeMutationMethods(node) {
  node.remove = function remove() {
    if (!this.parentNode) {
      return;
    }

    this.parentNode.removeChild(this);
  };

  node.replaceWith = function replaceWith(nextNode) {
    if (!this.parentNode) {
      return;
    }

    const parentNode = this.parentNode;
    const childIndex = parentNode.childNodes.indexOf(this);

    parentNode.removeChild(this);
    parentNode.insertBefore(nextNode, parentNode.childNodes[childIndex] ?? null);
  };

  return node;
}

function createFakeTextNode(textContent) {
  return attachNodeMutationMethods({
    nodeType: TEXT_NODE,
    textContent,
    parentNode: null,
  });
}

function createFakeElement(tagName) {
  const element = createParentNodeBase(ELEMENT_NODE);

  element.tagName = tagName;
  element.attributes = {};
  element.setAttribute = function setAttribute(name, value) {
    this.attributes[name] = String(value);
  };
  element.removeAttribute = function removeAttribute(name) {
    delete this.attributes[name];
  };

  return attachNodeMutationMethods(element);
}

function createFakeContainer() {
  const container = createParentNodeBase(0);
  container.nodeName = "container";
  return container;
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

function serializeNode(node) {
  if (node.nodeType === TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeName === "container") {
    return node.childNodes.map(serializeNode).join("");
  }

  const attributes = Object.entries(node.attributes)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("");

  return `<${node.tagName}${attributes}>${node.childNodes.map(serializeNode).join("")}</${node.tagName}>`;
}

const fakeDocument = createFakeDocument();

function renderIntoContainer(vNodeTree) {
  const container = createFakeContainer();
  renderVNodeTree(vNodeTree, container, fakeDocument);
  return container;
}

const cases = [
  {
    name: "text and attribute patches mutate the existing DOM nodes",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("p", { class: "before", title: "legacy" }, [createTextVNode("Before")]),
      ]);
      const newTree = createRootVNode([
        createElementVNode("p", { class: "after", "data-key": "paragraph-1" }, [createTextVNode("After")]),
      ]);

      const container = renderIntoContainer(oldTree);
      applyPatches(container, diff(oldTree, newTree), fakeDocument);

      assert.equal(
        serializeNode(container),
        '<p class="after" data-key="paragraph-1">After</p>',
      );
    },
  },
  {
    name: "remove patches are applied from higher indexes first",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("p", {}, [createTextVNode("First")]),
        createElementVNode("span", {}, [createTextVNode("Second")]),
      ]);
      const newTree = createRootVNode([]);

      const container = renderIntoContainer(oldTree);
      applyPatches(container, diff(oldTree, newTree), fakeDocument);

      assert.equal(serializeNode(container), "");
    },
  },
  {
    name: "replace and insert patches build the new structure without rerendering the container",
    run() {
      const oldTree = createRootVNode([createElementVNode("p", {}, [createTextVNode("Title")])]);
      const newTree = createRootVNode([
        createElementVNode("h2", {}, [createTextVNode("Title")]),
        createElementVNode("small", {}, [createTextVNode("Meta")]),
      ]);

      const container = renderIntoContainer(oldTree);
      applyPatches(container, diff(oldTree, newTree), fakeDocument);

      assert.equal(serializeNode(container), "<h2>Title</h2><small>Meta</small>");
    },
  },
  {
    name: "pure insert patches preserve sibling order",
    run() {
      const oldTree = createRootVNode([]);
      const newTree = createRootVNode([
        createElementVNode("li", {}, [createTextVNode("A")]),
        createElementVNode("li", {}, [createTextVNode("B")]),
      ]);

      const container = renderIntoContainer(oldTree);
      applyPatches(container, diff(oldTree, newTree), fakeDocument);

      assert.equal(serializeNode(container), "<li>A</li><li>B</li>");
    },
  },
  {
    name: "reorder patches replace only the keyed child list under the target parent",
    run() {
      const oldTree = createRootVNode([
        createElementVNode("ul", {}, [
          createElementVNode("li", { "data-key": "a" }, [createTextVNode("A")]),
          createElementVNode("li", { "data-key": "b" }, [createTextVNode("B")]),
          createElementVNode("li", { "data-key": "c" }, [createTextVNode("C")]),
        ]),
      ]);
      const patches = [
        {
          type: "REORDER",
          path: [0],
          children: [
            createElementVNode("li", { "data-key": "b" }, [createTextVNode("B")]),
            createElementVNode("li", { "data-key": "a" }, [createTextVNode("A")]),
            createElementVNode("li", { "data-key": "c" }, [createTextVNode("C")]),
          ],
        },
      ];

      const container = renderIntoContainer(oldTree);
      applyPatches(container, patches, fakeDocument);

      assert.equal(
        serializeNode(container),
        '<ul><li data-key="b">B</li><li data-key="a">A</li><li data-key="c">C</li></ul>',
      );
    },
  },
];

let passed = 0;

for (const testCase of cases) {
  testCase.run();
  passed += 1;
}

console.log(`Passed ${passed} applyPatch test case(s).`);
