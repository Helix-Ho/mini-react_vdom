import { VNODE_TYPES } from "../model/vnode.js";

export const PATCH_TYPES = {
  INSERT: "INSERT",
  REMOVE: "REMOVE",
  REPLACE: "REPLACE",
  REORDER: "REORDER",
  TEXT: "TEXT",
  SET_ATTR: "SET_ATTR",
  REMOVE_ATTR: "REMOVE_ATTR",
};

export function getNodeKey(node) {
  if (node?.type !== VNODE_TYPES.ELEMENT) {
    return null;
  }

  return node.props["data-key"] ?? null;
}

export function isSameNode(oldNode, newNode) {
  if (!oldNode || !newNode) {
    return false;
  }

  if (oldNode.type !== newNode.type) {
    return false;
  }

  if (oldNode.type === VNODE_TYPES.ROOT) {
    return true;
  }

  if (oldNode.type === VNODE_TYPES.TEXT) {
    return true;
  }

  if (oldNode.type === VNODE_TYPES.ELEMENT) {
    const oldKey = getNodeKey(oldNode);
    const newKey = getNodeKey(newNode);

    if (oldKey && newKey) {
      return oldNode.tag === newNode.tag && oldKey === newKey;
    }

    return oldNode.tag === newNode.tag;
  }

  return false;
}

export function diffProps(path, oldProps = {}, newProps = {}, patches = []) {
  const propNames = Array.from(new Set([...Object.keys(oldProps), ...Object.keys(newProps)])).sort();

  for (const name of propNames) {
    if (!(name in newProps)) {
      patches.push({
        type: PATCH_TYPES.REMOVE_ATTR,
        path,
        name,
      });
      continue;
    }

    if (!(name in oldProps) || oldProps[name] !== newProps[name]) {
      patches.push({
        type: PATCH_TYPES.SET_ATTR,
        path,
        name,
        value: newProps[name],
      });
    }
  }

  return patches;
}

export function diffChildren(oldChildren = [], newChildren = [], parentPath = [], patches = [], context) {
  if (shouldUseKeyedDiff(oldChildren, newChildren, parentPath, context)) {
    return diffKeyedChildren(oldChildren, newChildren, parentPath, patches, context);
  }

  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let index = 0; index < maxLength; index += 1) {
    walkDiff(oldChildren[index] ?? null, newChildren[index] ?? null, [...parentPath, index], patches, context);
  }

  return patches;
}

function walkDiff(oldNode, newNode, path, patches, context) {
  if (!oldNode && newNode) {
    patches.push({
      type: PATCH_TYPES.INSERT,
      path,
      node: newNode,
    });
    return patches;
  }

  if (oldNode && !newNode) {
    patches.push({
      type: PATCH_TYPES.REMOVE,
      path,
    });
    return patches;
  }

  if (!isSameNode(oldNode, newNode)) {
    patches.push({
      type: PATCH_TYPES.REPLACE,
      path,
      node: newNode,
    });
    return patches;
  }

  if (oldNode.type === VNODE_TYPES.ROOT) {
    return diffChildren(oldNode.children, newNode.children, path, patches, context);
  }

  if (oldNode.type === VNODE_TYPES.TEXT) {
    if (oldNode.value !== newNode.value) {
      patches.push({
        type: PATCH_TYPES.TEXT,
        path,
        value: newNode.value,
      });
    }

    return patches;
  }

  diffProps(path, oldNode.props, newNode.props, patches);
  diffChildren(oldNode.children, newNode.children, path, patches, context);

  return patches;
}

export function diff(oldTree, newTree) {
  return diffWithMeta(oldTree, newTree).patches;
}

export function diffWithMeta(oldTree, newTree) {
  const patches = [];
  const context = {
    warnings: [],
  };

  walkDiff(oldTree, newTree, [], patches, context);

  return {
    patches,
    warnings: [...new Set(context.warnings)],
  };
}

export function pathToString(path) {
  return path.length === 0 ? "root" : `root.${path.join(".")}`;
}

export function summarizeVNode(vNode) {
  if (!vNode) {
    return "null";
  }

  if (vNode.type === VNODE_TYPES.TEXT) {
    return `text("${truncateText(vNode.value)}")`;
  }

  if (vNode.type === VNODE_TYPES.ELEMENT) {
    return `<${vNode.tag}>`;
  }

  return "root";
}

export function formatPatch(patch) {
  if (patch.type === PATCH_TYPES.INSERT) {
    return `INSERT ${pathToString(patch.path)} <= ${summarizeVNode(patch.node)}`;
  }

  if (patch.type === PATCH_TYPES.REMOVE) {
    return `REMOVE ${pathToString(patch.path)}`;
  }

  if (patch.type === PATCH_TYPES.REPLACE) {
    return `REPLACE ${pathToString(patch.path)} <= ${summarizeVNode(patch.node)}`;
  }

  if (patch.type === PATCH_TYPES.REORDER) {
    return `REORDER ${pathToString(patch.path)} <= keyed children`;
  }

  if (patch.type === PATCH_TYPES.TEXT) {
    return `TEXT ${pathToString(patch.path)} => "${truncateText(patch.value)}"`;
  }

  if (patch.type === PATCH_TYPES.SET_ATTR) {
    return `SET_ATTR ${pathToString(patch.path)} ${patch.name}="${patch.value}"`;
  }

  if (patch.type === PATCH_TYPES.REMOVE_ATTR) {
    return `REMOVE_ATTR ${pathToString(patch.path)} ${patch.name}`;
  }

  return `UNKNOWN ${pathToString(patch.path)}`;
}

function truncateText(value, maxLength = 24) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function shouldUseKeyedDiff(oldChildren, newChildren, parentPath, context) {
  const combinedChildren = [...oldChildren, ...newChildren].filter(Boolean);

  if (combinedChildren.length === 0) {
    return false;
  }

  if (!combinedChildren.every((node) => Boolean(getNodeKey(node)))) {
    return false;
  }

  const duplicateKeys = [
    ...findDuplicateKeys(oldChildren),
    ...findDuplicateKeys(newChildren),
  ];

  if (duplicateKeys.length > 0) {
    context?.warnings.push(
      `Duplicate data-key detected at ${pathToString(parentPath)}: ${duplicateKeys.join(", ")}. Falling back to index-based diff.`,
    );
    return false;
  }

  return true;
}

function diffKeyedChildren(oldChildren, newChildren, parentPath, patches, context) {
  const oldEntries = oldChildren.map((node, index) => ({
    key: getNodeKey(node),
    node,
    index,
  }));
  const newEntries = newChildren.map((node, index) => ({
    key: getNodeKey(node),
    node,
    index,
  }));
  const oldMap = new Map(oldEntries.map((entry) => [entry.key, entry]));
  const newMap = new Map(newEntries.map((entry) => [entry.key, entry]));
  const sharedOldOrder = oldEntries.filter((entry) => newMap.has(entry.key)).map((entry) => entry.key);
  const sharedNewOrder = newEntries.filter((entry) => oldMap.has(entry.key)).map((entry) => entry.key);

  if (!areKeyOrdersEqual(sharedOldOrder, sharedNewOrder)) {
    patches.push({
      type: PATCH_TYPES.REORDER,
      path: parentPath,
      children: newChildren,
    });
    context?.warnings.push(
      `Keyed reorder detected at ${pathToString(parentPath)}. Applying a REORDER patch because full MOVE optimization is out of scope.`,
    );
    return patches;
  }

  for (const entry of newEntries) {
    if (!oldMap.has(entry.key)) {
      patches.push({
        type: PATCH_TYPES.INSERT,
        path: [...parentPath, entry.index],
        node: entry.node,
      });
      continue;
    }

    walkDiff(oldMap.get(entry.key).node, entry.node, [...parentPath, entry.index], patches, context);
  }

  for (const entry of oldEntries) {
    if (!newMap.has(entry.key)) {
      patches.push({
        type: PATCH_TYPES.REMOVE,
        path: [...parentPath, entry.index],
      });
    }
  }

  return patches;
}

function findDuplicateKeys(children = []) {
  const counts = new Map();

  for (const child of children) {
    const key = getNodeKey(child);

    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

function areKeyOrdersEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((key, index) => key === right[index]);
}
