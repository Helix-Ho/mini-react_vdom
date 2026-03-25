import { createElementVNode, createRootVNode, createTextVNode } from "../model/vnode.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export function parseHtmlToRoot(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html").body;
}

export function attributesToProps(attributes = []) {
  const props = {};

  for (const attribute of Array.from(attributes)) {
    props[attribute.name] = attribute.value;
  }

  return props;
}

export function isWhitespaceOnlyTextNode(node) {
  return node?.nodeType === TEXT_NODE && node.textContent.trim() === "";
}

export function domChildrenToVNodes(node) {
  return Array.from(node?.childNodes ?? []).map(domToVNode).filter(Boolean);
}

export function domToVNode(node) {
  if (!node) {
    return null;
  }

  if (node.nodeType === TEXT_NODE) {
    if (isWhitespaceOnlyTextNode(node)) {
      return null;
    }

    return createTextVNode(node.textContent);
  }

  if (node.nodeType === ELEMENT_NODE) {
    return createElementVNode(
      node.tagName.toLowerCase(),
      attributesToProps(node.attributes),
      domChildrenToVNodes(node),
    );
  }

  return null;
}

export function domRootToVNodeTree(rootNode) {
  return createRootVNode(domChildrenToVNodes(rootNode));
}

export function htmlToVNodeTree(html) {
  return domRootToVNodeTree(parseHtmlToRoot(html));
}
