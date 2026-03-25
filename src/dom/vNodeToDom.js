import { VNODE_TYPES } from "../model/vnode.js";

export function setDomProps(element, props = {}) {
  for (const [name, value] of Object.entries(props)) {
    element.setAttribute(name, value);
  }

  return element;
}

export function vNodeToDom(vNode, targetDocument = document) {
  if (vNode.type === VNODE_TYPES.TEXT) {
    return targetDocument.createTextNode(vNode.value);
  }

  if (vNode.type === VNODE_TYPES.ELEMENT) {
    const element = targetDocument.createElement(vNode.tag);
    setDomProps(element, vNode.props);

    for (const childVNode of vNode.children) {
      element.appendChild(vNodeToDom(childVNode, targetDocument));
    }

    return element;
  }

  throw new Error(`Unsupported vnode type for direct DOM rendering: ${vNode.type}`);
}

export function renderVNodeTree(rootVNode, container, targetDocument = document) {
  if (rootVNode.type !== VNODE_TYPES.ROOT) {
    throw new Error("renderVNodeTree expects a root vnode.");
  }

  const childNodes = rootVNode.children.map((childVNode) => vNodeToDom(childVNode, targetDocument));
  container.replaceChildren(...childNodes);

  return container;
}

export function vNodeTreeToHtml(rootVNode, targetDocument = document) {
  const container = targetDocument.createElement("div");
  renderVNodeTree(rootVNode, container, targetDocument);
  return container.innerHTML;
}
