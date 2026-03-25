const SAMPLE_HTML = `
<section id="product-panel" class="demo-section featured" data-role="product" data-version="1">
  <h2>
    Virtual DOM Demo
    <span class="status-badge" data-tone="warm">Interactive</span>
  </h2>
  <p class="intro">
    This sample shows how <strong>partial patches</strong> update the real DOM.
  </p>
  <ul class="feature-list" data-count="3">
    <li class="feature-item">Change this text node</li>
    <li class="feature-item">Change attributes on this list</li>
    <li class="feature-item">Add or remove list items</li>
  </ul>
  <div class="action-row" data-group="primary">
    <button type="button" class="primary-button">Primary action</button>
    <button type="button" class="secondary-button" disabled>Disabled sample</button>
    <a href="https://example.com/docs" class="inline-link" data-track="docs">Read docs</a>
  </div>
</section>
`.trim();

const BOOLEAN_ATTRIBUTES = new Set([
  "checked",
  "selected",
  "disabled",
  "readonly",
  "multiple",
  "required",
  "hidden",
  "open",
  "autofocus"
]);

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

const MAX_MUTATION_LOGS = 40;
const DEFAULT_PARSER_NOTE = "브라우저 파서는 잘못된 HTML을 자동 보정할 수 있고, script 태그와 on* 이벤트 속성은 제거됩니다.";

const state = {
  currentVNode: null,
  history: [],
  historyIndex: -1,
  lastPatches: [],
  mutationLogs: [],
  observer: null,
  elements: {}
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  bindUIEvents();

  const initialDOM = parseHTMLToDOM(SAMPLE_HTML);
  const initialVNode = domToVirtualDOM(initialDOM);

  state.currentVNode = cloneVNode(initialVNode);
  renderActualTree(initialVNode);
  state.elements.htmlEditor.value = SAMPLE_HTML;
  pushHistory(initialVNode);

  connectObserver();
  renderDiffLog([]);
  renderVDOMPreview(initialVNode);
  renderMutationLog();
  setPatchSummary("초기 샘플 상태를 history[0]에 저장했습니다.");
  updateHistoryUI();
}

function cacheElements() {
  state.elements = {
    patchButton: document.getElementById("patch-button"),
    undoButton: document.getElementById("undo-button"),
    redoButton: document.getElementById("redo-button"),
    historyStatus: document.getElementById("history-status"),
    patchSummary: document.getElementById("patch-summary"),
    actualCanvas: document.getElementById("actual-canvas"),
    htmlEditor: document.getElementById("html-editor"),
    diffLog: document.getElementById("diff-log"),
    vdomPreview: document.getElementById("vdom-preview"),
    mutationLog: document.getElementById("mutation-log"),
    parserNote: document.getElementById("parser-note")
  };
}

function bindUIEvents() {
  state.elements.patchButton.addEventListener("click", handlePatch);
  state.elements.undoButton.addEventListener("click", handleUndo);
  state.elements.redoButton.addEventListener("click", handleRedo);
}

function parseHTMLToDOM(htmlString) {
  // 입력 HTML을 브라우저 파서에 맡기고, 내부 루트 래퍼로 감싼다.
  const template = document.createElement("template");
  const safeHTML = typeof htmlString === "string" ? htmlString : "";

  template.innerHTML = safeHTML;
  sanitizeFragment(template.content);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-vdom-wrapper", "true");

  Array.from(template.content.childNodes).forEach((childNode) => {
    wrapper.appendChild(childNode.cloneNode(true));
  });

  return wrapper;
}

function sanitizeFragment(fragment) {
  // script와 on* 속성은 학습 데모에서 제외하고 안전하게 제거한다.
  Array.from(fragment.querySelectorAll("script")).forEach((scriptNode) => {
    scriptNode.remove();
  });

  Array.from(fragment.querySelectorAll("*")).forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();

      if (attributeName.startsWith("on")) {
        element.removeAttribute(attribute.name);
      }

      if ((attributeName === "href" || attributeName === "src") && attributeValue.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
}

function domToVirtualDOM(node) {
  // 실제 DOM을 재귀 순회하며 ELEMENT / TEXT 형태의 VDOM 트리로 바꾼다.
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return null;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.textContent || !node.textContent.trim()) {
      return null;
    }

    return {
      nodeType: "TEXT",
      text: node.textContent
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tag = node.tagName.toLowerCase();

  if (tag === "script") {
    return null;
  }

  const props = {};

  Array.from(node.attributes).forEach((attribute) => {
    const name = attribute.name;
    const lowerName = name.toLowerCase();

    if (lowerName.startsWith("on")) {
      return;
    }

    if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
      props[name] = node.hasAttribute(name);
      return;
    }

    props[name] = attribute.value;
  });

  const children = Array.from(node.childNodes)
    .map((childNode) => domToVirtualDOM(childNode))
    .filter(Boolean);

  return {
    nodeType: "ELEMENT",
    tag,
    props,
    children
  };
}

function renderVirtualDOM(vNode) {
  // VDOM 객체를 실제 DOM 노드로 다시 렌더링한다.
  if (!vNode) {
    return document.createTextNode("");
  }

  if (vNode.nodeType === "TEXT") {
    return document.createTextNode(vNode.text);
  }

  const element = document.createElement(vNode.tag);

  Object.entries(vNode.props || {}).forEach(([key, value]) => {
    setDOMProp(element, key, value);
  });

  (vNode.children || []).forEach((childVNode) => {
    element.appendChild(renderVirtualDOM(childVNode));
  });

  return element;
}

function virtualDOMToHTML(vNode) {
  return serializeVNode(vNode, 0).trim();
}

function serializeVNode(vNode, depth) {
  if (!vNode) {
    return "";
  }

  if (vNode.nodeType === "TEXT") {
    return escapeHTML(vNode.text);
  }

  if (isInternalWrapperVNode(vNode)) {
    return (vNode.children || [])
      .map((childNode) => serializeVNode(childNode, depth))
      .filter(Boolean)
      .join("\n");
  }

  const indent = "  ".repeat(depth);
  const propsHTML = serializeProps(vNode.props || {});
  const openTag = `<${vNode.tag}${propsHTML}>`;

  if (VOID_TAGS.has(vNode.tag)) {
    return `${indent}${openTag}`;
  }

  const children = vNode.children || [];

  if (children.length === 0) {
    return `${indent}${openTag}</${vNode.tag}>`;
  }

  const hasTextChild = children.some((child) => child.nodeType === "TEXT");

  if (hasTextChild) {
    const inlineHTML = children
      .map((child) => serializeVNode(child, 0))
      .join("");

    return `${indent}${openTag}${inlineHTML}</${vNode.tag}>`;
  }

  const childrenHTML = children
    .map((child) => serializeVNode(child, depth + 1))
    .join("\n");

  return `${indent}${openTag}\n${childrenHTML}\n${indent}</${vNode.tag}>`;
}

function serializeProps(props) {
  return Object.entries(props)
    .filter(([key, value]) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey.startsWith("on")) {
        return false;
      }

      if (BOOLEAN_ATTRIBUTES.has(lowerKey)) {
        return Boolean(value);
      }

      return value !== undefined && value !== null && value !== false;
    })
    .map(([key, value]) => {
      if (BOOLEAN_ATTRIBUTES.has(key.toLowerCase())) {
        return ` ${key}`;
      }

      return ` ${key}="${escapeAttribute(String(value))}"`;
    })
    .join("");
}

function diff(oldVNode, newVNode, path = []) {
  // 두 VDOM을 비교해 ADD / REMOVE / REPLACE / TEXT / PROPS 패치를 만든다.
  const patches = [];

  if (!oldVNode && newVNode) {
    patches.push({ type: "REPLACE", path, node: cloneVNode(newVNode) });
    return patches;
  }

  if (oldVNode && !newVNode) {
    patches.push({
      type: "REMOVE",
      path: path.slice(0, -1),
      index: path[path.length - 1],
      node: cloneVNode(oldVNode)
    });
    return patches;
  }

  if (!oldVNode || !newVNode) {
    return patches;
  }

  if (oldVNode.nodeType !== newVNode.nodeType) {
    patches.push({
      type: "REPLACE",
      path,
      oldNode: cloneVNode(oldVNode),
      node: cloneVNode(newVNode)
    });
    return patches;
  }

  if (oldVNode.nodeType === "TEXT" && newVNode.nodeType === "TEXT") {
    if (oldVNode.text !== newVNode.text) {
      patches.push({
        type: "TEXT",
        path,
        oldText: oldVNode.text,
        text: newVNode.text
      });
    }

    return patches;
  }

  if (oldVNode.tag !== newVNode.tag) {
    patches.push({
      type: "REPLACE",
      path,
      oldNode: cloneVNode(oldVNode),
      node: cloneVNode(newVNode)
    });
    return patches;
  }

  const propChanges = diffProps(oldVNode.props || {}, newVNode.props || {});

  if (Object.keys(propChanges.set).length > 0 || propChanges.remove.length > 0) {
    patches.push({
      type: "PROPS",
      path,
      set: propChanges.set,
      remove: propChanges.remove
    });
  }

  const oldChildren = oldVNode.children || [];
  const newChildren = newVNode.children || [];
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let index = 0; index < maxLength; index += 1) {
    const oldChild = oldChildren[index];
    const newChild = newChildren[index];

    if (!oldChild && newChild) {
      patches.push({
        type: "ADD",
        path,
        index,
        node: cloneVNode(newChild)
      });
      continue;
    }

    if (oldChild && !newChild) {
      patches.push({
        type: "REMOVE",
        path,
        index,
        node: cloneVNode(oldChild)
      });
      continue;
    }

    patches.push(...diff(oldChild, newChild, path.concat(index)));
  }

  return patches;
}

function diffProps(oldProps, newProps) {
  // 속성 변경은 set / remove 두 그룹으로 분리한다.
  const set = {};
  const remove = [];
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  allKeys.forEach((key) => {
    const oldValue = normalizePropValue(oldProps[key]);
    const newValue = normalizePropValue(newProps[key]);

    if (newValue === undefined) {
      if (oldValue !== undefined) {
        remove.push(key);
      }
      return;
    }

    if (oldValue !== newValue) {
      set[key] = newProps[key];
    }
  });

  return { set, remove };
}

function applyPatches(rootElement, patches) {
  // 구조가 흔들리지 않도록 텍스트/속성/교체 -> 제거 -> 추가 순서로 적용한다.
  if (!rootElement || !Array.isArray(patches) || patches.length === 0) {
    return rootElement;
  }

  let nextRoot = rootElement;
  const phaseOne = patches.filter((patch) => patch.type === "TEXT" || patch.type === "PROPS" || patch.type === "REPLACE");
  const removePatches = patches
    .filter((patch) => patch.type === "REMOVE")
    .sort(compareRemovePatches);
  const addPatches = patches
    .filter((patch) => patch.type === "ADD")
    .sort(compareAddPatches);

  phaseOne.forEach((patch) => {
    if (patch.type === "TEXT") {
      const targetNode = getNodeByPath(nextRoot, patch.path);

      if (targetNode) {
        targetNode.textContent = patch.text;
      }
      return;
    }

    if (patch.type === "PROPS") {
      const targetNode = getNodeByPath(nextRoot, patch.path);

      if (targetNode && targetNode.nodeType === Node.ELEMENT_NODE) {
        patch.remove.forEach((propName) => {
          removeDOMProp(targetNode, propName);
        });

        Object.entries(patch.set).forEach(([propName, propValue]) => {
          setDOMProp(targetNode, propName, propValue);
        });
      }
      return;
    }

    if (patch.type === "REPLACE") {
      const targetNode = getNodeByPath(nextRoot, patch.path);

      if (!targetNode) {
        return;
      }

      const replacementNode = renderVirtualDOM(patch.node);

      if (patch.path.length === 0) {
        targetNode.replaceWith(replacementNode);
        nextRoot = replacementNode;
        return;
      }

      targetNode.replaceWith(replacementNode);
    }
  });

  removePatches.forEach((patch) => {
    const parentNode = getNodeByPath(nextRoot, patch.path);

    if (!parentNode || !parentNode.childNodes[patch.index]) {
      return;
    }

    parentNode.removeChild(parentNode.childNodes[patch.index]);
  });

  addPatches.forEach((patch) => {
    const parentNode = getNodeByPath(nextRoot, patch.path);

    if (!parentNode) {
      return;
    }

    const newChildNode = renderVirtualDOM(patch.node);
    const referenceNode = parentNode.childNodes[patch.index] || null;
    parentNode.insertBefore(newChildNode, referenceNode);
  });

  return nextRoot;
}

function getNodeByPath(rootElement, path) {
  // path 배열은 childNodes 인덱스를 따라가는 간단한 탐색 규칙이다.
  if (!rootElement) {
    return null;
  }

  let currentNode = rootElement;

  for (let index = 0; index < path.length; index += 1) {
    currentNode = currentNode.childNodes[path[index]];

    if (!currentNode) {
      return null;
    }
  }

  return currentNode;
}

function pushHistory(vNode) {
  // Undo 후 새 Patch가 오면 future history를 잘라낸 뒤 현재 상태를 저장한다.
  let trimmedFutureCount = 0;

  if (state.historyIndex < state.history.length - 1) {
    trimmedFutureCount = state.history.length - state.historyIndex - 1;
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  state.history.push(cloneVNode(vNode));
  state.historyIndex = state.history.length - 1;
  updateHistoryUI();

  return trimmedFutureCount;
}

function restoreHistory(index) {
  // History 복원은 안정성을 위해 실제 DOM을 통째로 다시 그린다.
  if (index < 0 || index >= state.history.length) {
    return;
  }

  const restoredVNode = cloneVNode(state.history[index]);

  state.historyIndex = index;
  state.currentVNode = restoredVNode;
  renderActualTree(restoredVNode);
  syncEditorWithVNode(restoredVNode);
  renderDiffLog([]);
  renderVDOMPreview(restoredVNode);
  updateParserNote(state.elements.htmlEditor.value, virtualDOMToHTML(restoredVNode));
  updateHistoryUI();
}

function cloneVNode(vNode) {
  // History에 안전하게 저장하려고 VDOM을 깊은 복사한다.
  if (!vNode) {
    return null;
  }

  if (vNode.nodeType === "TEXT") {
    return {
      nodeType: "TEXT",
      text: vNode.text
    };
  }

  return {
    nodeType: "ELEMENT",
    tag: vNode.tag,
    props: { ...(vNode.props || {}) },
    children: (vNode.children || []).map((childVNode) => cloneVNode(childVNode))
  };
}

function handlePatch() {
  // textarea -> DOM -> VDOM -> diff -> patch -> history 순서로 한 사이클을 실행한다.
  const rawHTML = state.elements.htmlEditor.value;
  const nextDOM = parseHTMLToDOM(rawHTML);
  const nextVNode = domToVirtualDOM(nextDOM);
  const patches = diff(state.currentVNode, nextVNode);
  const normalizedHTML = virtualDOMToHTML(nextVNode);

  updateParserNote(rawHTML, normalizedHTML);
  renderDiffLog(patches);
  renderVDOMPreview(nextVNode);

  if (patches.length === 0) {
    syncEditorWithVNode(nextVNode);
    state.currentVNode = cloneVNode(nextVNode);
    setPatchSummary("변경점이 없어 Patch를 건너뛰었습니다.");
    return;
  }

  const currentRoot = state.elements.actualCanvas.firstChild;
  applyPatches(currentRoot, patches);

  state.currentVNode = cloneVNode(nextVNode);
  const trimmedFutureCount = pushHistory(nextVNode);

  syncEditorWithVNode(nextVNode);
  state.lastPatches = patches;

  setPatchSummary(summarizePatchRun(patches, trimmedFutureCount));
  updateHistoryUI();
}

function handleUndo() {
  if (state.historyIndex <= 0) {
    return;
  }

  restoreHistory(state.historyIndex - 1);
  setPatchSummary(`Undo 완료: history[${state.historyIndex}] 상태를 전체 렌더링으로 복원했습니다.`);
}

function handleRedo() {
  if (state.historyIndex >= state.history.length - 1) {
    return;
  }

  restoreHistory(state.historyIndex + 1);
  setPatchSummary(`Redo 완료: history[${state.historyIndex}] 상태를 전체 렌더링으로 복원했습니다.`);
}

function updateHistoryUI() {
  state.elements.historyStatus.textContent = `${state.historyIndex} / ${state.history.length}`;
  state.elements.undoButton.disabled = state.historyIndex <= 0;
  state.elements.redoButton.disabled = state.historyIndex >= state.history.length - 1;
}

function renderDiffLog(patches) {
  const container = state.elements.diffLog;

  if (!patches.length) {
    container.innerHTML = `
      <div class="empty-log">
        <strong>변경 없음</strong>
        <span>현재 상태와 비교했을 때 새로운 Patch가 없습니다.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = patches
    .map((patch) => {
      const tagClass = patch.type.toLowerCase();
      const detail = describePatch(patch);
      const pathLabel = formatPathLabel(patch);

      return `
        <article class="log-entry">
          <div class="log-topline">
            <span class="log-tag ${tagClass}">${patch.type}</span>
            <span class="log-meta">${pathLabel}</span>
          </div>
          <div class="log-message">${escapeHTML(detail)}</div>
        </article>
      `;
    })
    .join("");
}

function renderVDOMPreview(vNode) {
  state.elements.vdomPreview.textContent = JSON.stringify(vNode, null, 2);
}

function connectObserver() {
  // 실제 DOM에서 발생한 mutation을 사람이 읽기 쉬운 로그로 바꿔 보여준다.
  if (state.observer) {
    state.observer.disconnect();
  }

  state.observer = new MutationObserver((mutations) => {
    const nextEntries = mutations
      .flatMap((mutation) => summarizeMutation(mutation))
      .filter(Boolean);

    if (!nextEntries.length) {
      return;
    }

    state.mutationLogs = [...nextEntries.reverse(), ...state.mutationLogs].slice(0, MAX_MUTATION_LOGS);
    renderMutationLog();
  });

  state.observer.observe(state.elements.actualCanvas, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeOldValue: true,
    characterDataOldValue: true
  });
}

function renderMutationLog() {
  const container = state.elements.mutationLog;

  if (!state.mutationLogs.length) {
    container.innerHTML = `
      <div class="empty-log">
        <strong>Mutation 대기 중</strong>
        <span>Patch 또는 Undo/Redo를 실행하면 실제 DOM 변경 로그가 여기에 쌓입니다.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = state.mutationLogs
    .map((entry) => {
      return `
        <article class="log-entry">
          <div class="log-topline">
            <span class="log-tag ${entry.kind}">${entry.kind.toUpperCase()}</span>
            <span class="log-meta">${entry.time}</span>
          </div>
          <div class="log-message">${escapeHTML(entry.message)}</div>
        </article>
      `;
    })
    .join("");
}

function renderActualTree(vNode) {
  const canvas = state.elements.actualCanvas;

  canvas.innerHTML = "";
  canvas.appendChild(renderVirtualDOM(vNode));
}

function syncEditorWithVNode(vNode) {
  state.elements.htmlEditor.value = virtualDOMToHTML(vNode);
}

function setPatchSummary(message) {
  state.elements.patchSummary.textContent = message;
}

function summarizePatchRun(patches, trimmedFutureCount) {
  const counts = patches.reduce((accumulator, patch) => {
    accumulator[patch.type] = (accumulator[patch.type] || 0) + 1;
    return accumulator;
  }, {});

  const countMessage = Object.entries(counts)
    .map(([type, count]) => `${type} ${count}개`)
    .join(", ");

  if (trimmedFutureCount > 0) {
    return `${patches.length}개 Patch 적용 (${countMessage}), future history ${trimmedFutureCount}개를 삭제하고 새 상태를 저장했습니다.`;
  }

  return `${patches.length}개 Patch 적용 (${countMessage}) 후 새 상태를 history[${state.historyIndex}]에 저장했습니다.`;
}

function describePatch(patch) {
  if (patch.type === "TEXT") {
    return `텍스트를 "${truncateText(patch.oldText || "", 42)}" -> "${truncateText(patch.text, 42)}" 로 변경합니다.`;
  }

  if (patch.type === "PROPS") {
    const setKeys = Object.keys(patch.set);
    const removeKeys = patch.remove;
    const parts = [];

    if (setKeys.length) {
      parts.push(`추가/변경: ${setKeys.map((key) => `${key}=${JSON.stringify(patch.set[key])}`).join(", ")}`);
    }

    if (removeKeys.length) {
      parts.push(`삭제: ${removeKeys.join(", ")}`);
    }

    return parts.join(" | ");
  }

  if (patch.type === "ADD") {
    return `${patch.index}번 위치에 ${describeVNode(patch.node)} 노드를 추가합니다. 추가 대상: ${formatVNodeSnippet(patch.node)}`;
  }

  if (patch.type === "REMOVE") {
    return `${patch.index}번 위치의 자식 노드를 제거합니다. 삭제 대상: ${formatVNodeSnippet(patch.node)}`;
  }

  if (patch.type === "REPLACE") {
    return `${describeVNode(patch.oldNode)} 를 ${describeVNode(patch.node)} 로 교체합니다. 교체 전: ${formatVNodeSnippet(patch.oldNode)} | 교체 후: ${formatVNodeSnippet(patch.node)}`;
  }

  return "알 수 없는 Patch";
}

function formatPathLabel(patch) {
  if (patch.type === "ADD" || patch.type === "REMOVE") {
    return `parent path: [${patch.path.join(", ")}], index: ${patch.index}, target path: [${patch.path.concat(patch.index).join(", ")}]`;
  }

  return `path: [${patch.path.join(", ")}]`;
}

function describeVNode(vNode) {
  if (!vNode) {
    return "빈 노드";
  }

  if (vNode.nodeType === "TEXT") {
    return `TEXT("${truncateText(vNode.text, 28)}")`;
  }

  return `<${vNode.tag}>`;
}

function formatVNodeSnippet(vNode) {
  if (!vNode) {
    return "빈 노드";
  }

  if (vNode.nodeType === "TEXT") {
    return `"${truncateText(vNode.text, 72)}"`;
  }

  const htmlSnippet = serializeVNode(vNode, 0).replace(/\s+/g, " ").trim();
  return truncateText(htmlSnippet, 96);
}

function summarizeMutation(mutation) {
  const timestamp = formatTime(new Date());

  if (mutation.type === "childList") {
    const additions = Array.from(mutation.addedNodes)
      .map((node) => describeMutationNode(node))
      .filter(Boolean)
      .map((label) => ({
        kind: "add",
        time: timestamp,
        message: `childList: ${label} 노드 추가`
      }));

    const removals = Array.from(mutation.removedNodes)
      .map((node) => describeMutationNode(node))
      .filter(Boolean)
      .map((label) => ({
        kind: "remove",
        time: timestamp,
        message: `childList: ${label} 노드 삭제`
      }));

    return [...additions, ...removals];
  }

  if (mutation.type === "attributes") {
    const element = mutation.target;
    const attributeName = mutation.attributeName;
    const oldValue = mutation.oldValue;
    const nextValue = element.getAttribute(attributeName);

    return [{
      kind: "props",
      time: timestamp,
      message: `attributes: ${describeElement(element)}.${attributeName} 변경 (${String(oldValue)} -> ${String(nextValue)})`
    }];
  }

  if (mutation.type === "characterData") {
    const oldText = (mutation.oldValue || "").trim();
    const nextText = (mutation.target.textContent || "").trim();

    return [{
      kind: "text",
      time: timestamp,
      message: `characterData: 텍스트 "${truncateText(oldText, 26)}" -> "${truncateText(nextText, 26)}"`
    }];
  }

  return [];
}

function describeMutationNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent || "").trim();
    return text ? `TEXT("${truncateText(text, 26)}")` : null;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    return describeElement(node);
  }

  return null;
}

function describeElement(element) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const className = typeof element.className === "string" && element.className.trim()
    ? `.${element.className.trim().split(/\s+/).join(".")}`
    : "";

  return `<${tag}${id}${className}>`;
}

function setDOMProp(element, key, value) {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey.startsWith("on")) {
    return;
  }

  if (BOOLEAN_ATTRIBUTES.has(normalizedKey)) {
    if (value) {
      element.setAttribute(key, "");
      element[normalizedKey] = true;
    } else {
      element.removeAttribute(key);
      element[normalizedKey] = false;
    }
    return;
  }

  if (value === undefined || value === null || value === false) {
    element.removeAttribute(key);
    return;
  }

  element.setAttribute(key, String(value));
}

function removeDOMProp(element, key) {
  const normalizedKey = key.toLowerCase();

  element.removeAttribute(key);

  if (BOOLEAN_ATTRIBUTES.has(normalizedKey)) {
    element[normalizedKey] = false;
  }
}

function normalizePropValue(value) {
  if (value === false || value === null) {
    return undefined;
  }

  return value;
}

function isInternalWrapperVNode(vNode) {
  return Boolean(
    vNode &&
    vNode.nodeType === "ELEMENT" &&
    vNode.tag === "div" &&
    vNode.props &&
    vNode.props["data-vdom-wrapper"] === "true"
  );
}

function compareRemovePatches(a, b) {
  if (b.path.length !== a.path.length) {
    return b.path.length - a.path.length;
  }

  for (let index = 0; index < a.path.length; index += 1) {
    if (a.path[index] !== b.path[index]) {
      return b.path[index] - a.path[index];
    }
  }

  return b.index - a.index;
}

function compareAddPatches(a, b) {
  if (a.path.length !== b.path.length) {
    return a.path.length - b.path.length;
  }

  for (let index = 0; index < a.path.length; index += 1) {
    if (a.path[index] !== b.path[index]) {
      return a.path[index] - b.path[index];
    }
  }

  return a.index - b.index;
}

function updateParserNote(rawHTML, normalizedHTML) {
  const trimmedRaw = (rawHTML || "").trim();
  const trimmedNormalized = (normalizedHTML || "").trim();

  if (trimmedRaw !== trimmedNormalized) {
    state.elements.parserNote.textContent = "입력 HTML이 브라우저 파서/보안 규칙에 의해 정규화되었습니다. textarea도 정규화된 결과로 갱신됩니다.";
    return;
  }

  state.elements.parserNote.textContent = DEFAULT_PARSER_NOTE;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll('"', "&quot;");
}

function truncateText(text, maxLength) {
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function formatTime(date) {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
