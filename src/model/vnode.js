export const VNODE_TYPES = {
  ROOT: "root",
  ELEMENT: "element",
  TEXT: "text",
};

export function createRootVNode(children = []) {
  return {
    type: VNODE_TYPES.ROOT,
    children,
  };
}

export function createElementVNode(tag, props = {}, children = []) {
  return {
    type: VNODE_TYPES.ELEMENT,
    tag,
    props,
    children,
  };
}

export function createTextVNode(value) {
  return {
    type: VNODE_TYPES.TEXT,
    value,
  };
}

export function cloneVNode(vNode) {
  if (!vNode) {
    return null;
  }

  if (vNode.type === VNODE_TYPES.ROOT) {
    return createRootVNode(vNode.children.map(cloneVNode));
  }

  if (vNode.type === VNODE_TYPES.ELEMENT) {
    return createElementVNode(
      vNode.tag,
      { ...vNode.props },
      vNode.children.map(cloneVNode),
    );
  }

  if (vNode.type === VNODE_TYPES.TEXT) {
    return createTextVNode(vNode.value);
  }

  throw new Error(`Unsupported vnode type for clone: ${vNode.type}`);
}
