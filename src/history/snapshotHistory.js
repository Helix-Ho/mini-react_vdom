import { cloneVNode } from "../model/vnode.js";

export function createSnapshotHistory(initialSnapshot) {
  return {
    snapshots: [cloneVNode(initialSnapshot)],
    cursor: 0,
  };
}

export function canGoBack(history) {
  return history.cursor > 0;
}

export function canGoForward(history) {
  return history.cursor < history.snapshots.length - 1;
}

export function getCurrentSnapshot(history) {
  return cloneVNode(history.snapshots[history.cursor]);
}

export function pushSnapshot(history, snapshot) {
  history.snapshots = history.snapshots.slice(0, history.cursor + 1);
  history.snapshots.push(cloneVNode(snapshot));
  history.cursor = history.snapshots.length - 1;

  return getCurrentSnapshot(history);
}

export function goBack(history) {
  if (!canGoBack(history)) {
    return null;
  }

  history.cursor -= 1;
  return getCurrentSnapshot(history);
}

export function goForward(history) {
  if (!canGoForward(history)) {
    return null;
  }

  history.cursor += 1;
  return getCurrentSnapshot(history);
}
