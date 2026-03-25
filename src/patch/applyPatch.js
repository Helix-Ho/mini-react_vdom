import { PATCH_TYPES, pathToString } from "../diff/diff.js";
import { vNodeToDom } from "../dom/vNodeToDom.js";

export function getNodeAtPath(container, path) {
  let current = container;

  for (const index of path) {
    current = current?.childNodes?.[index] ?? null;

    if (!current) {
      throw new Error(`Cannot resolve node at ${pathToString(path)}.`);
    }
  }

  return current;
}

export function getParentAndIndex(container, path) {
  if (path.length === 0) {
    throw new Error("Patch path must point below the root container.");
  }

  return {
    parentNode: path.length === 1 ? container : getNodeAtPath(container, path.slice(0, -1)),
    childIndex: path[path.length - 1],
  };
}

export function applyPatch(container, patch, targetDocument = document) {
  if (patch.type === PATCH_TYPES.INSERT) {
    const { parentNode, childIndex } = getParentAndIndex(container, patch.path);
    const referenceNode = parentNode.childNodes[childIndex] ?? null;
    const nextNode = vNodeToDom(patch.node, targetDocument);

    parentNode.insertBefore(nextNode, referenceNode);
    return container;
  }

  if (patch.type === PATCH_TYPES.REMOVE) {
    const targetNode = getNodeAtPath(container, patch.path);
    targetNode.remove();
    return container;
  }

  if (patch.type === PATCH_TYPES.REPLACE) {
    const targetNode = getNodeAtPath(container, patch.path);
    targetNode.replaceWith(vNodeToDom(patch.node, targetDocument));
    return container;
  }

  if (patch.type === PATCH_TYPES.REORDER) {
    const parentNode = patch.path.length === 0 ? container : getNodeAtPath(container, patch.path);
    const childNodes = patch.children.map((childVNode) => vNodeToDom(childVNode, targetDocument));

    parentNode.replaceChildren(...childNodes);
    return container;
  }

  if (patch.type === PATCH_TYPES.TEXT) {
    const targetNode = getNodeAtPath(container, patch.path);
    targetNode.textContent = patch.value;
    return container;
  }

  if (patch.type === PATCH_TYPES.SET_ATTR) {
    const targetNode = getNodeAtPath(container, patch.path);
    targetNode.setAttribute(patch.name, patch.value);
    return container;
  }

  if (patch.type === PATCH_TYPES.REMOVE_ATTR) {
    const targetNode = getNodeAtPath(container, patch.path);
    targetNode.removeAttribute(patch.name);
    return container;
  }

  throw new Error(`Unsupported patch type: ${patch.type}`);
}

export function compareRemovalPaths(pathA, pathB) {
  const maxLength = Math.max(pathA.length, pathB.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (pathA[index] === undefined) {
      return 1;
    }

    if (pathB[index] === undefined) {
      return -1;
    }

    if (pathA[index] !== pathB[index]) {
      return pathB[index] - pathA[index];
    }
  }

  return 0;
}

export function applyPatches(container, patches, targetDocument = document) {
  const removals = patches
    .filter((patch) => patch.type === PATCH_TYPES.REMOVE)
    .sort((left, right) => compareRemovalPaths(left.path, right.path));
  const others = patches.filter((patch) => patch.type !== PATCH_TYPES.REMOVE);

  for (const patch of removals) {
    applyPatch(container, patch, targetDocument);
  }

  for (const patch of others) {
    applyPatch(container, patch, targetDocument);
  }

  return container;
}
