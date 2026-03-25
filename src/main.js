import { domRootToVNodeTree, parseHtmlToRoot } from "./dom/domToVNode.js";
import { diffWithMeta, formatPatch } from "./diff/diff.js";
import { renderVNodeTree, vNodeTreeToHtml } from "./dom/vNodeToDom.js";
import {
  canGoBack,
  canGoForward,
  createSnapshotHistory,
  goBack,
  goForward,
  pushSnapshot,
} from "./history/snapshotHistory.js";
import { applyPatches } from "./patch/applyPatch.js";

const sampleHtml =
  '<section class="vdom-card" data-key="card-root"><h3 data-key="title">Virtual DOM Mini Project</h3><p>Start with a stable tree before diffing.</p><ul class="vdom-list"><li data-key="step-read">Read DOM into VDOM</li><li data-key="step-diff">Compare old and new trees</li><li data-key="step-patch">Apply only the changed nodes</li></ul></section>';

const presetScenarios = [
  {
    id: "baseline",
    label: "Reset Baseline",
    description: "Restore the sample snapshot, history cursor, and textarea to the original demo state.",
    html: sampleHtml,
    resetBaseline: true,
  },
  {
    id: "text-attr",
    label: "Text + Attr",
    description: "Change heading text, paragraph copy, and root class without replacing the whole section.",
    html:
      '<section class="vdom-card vdom-card--highlight" data-key="card-root"><h3 data-key="title">Virtual DOM Patch Demo</h3><p>Text and props can change without replacing the whole section.</p><ul class="vdom-list"><li data-key="step-read">Read DOM into VDOM</li><li data-key="step-diff">Compare old and new trees</li><li data-key="step-patch">Apply only the changed nodes</li></ul></section>',
  },
  {
    id: "insert-child",
    label: "Insert Child",
    description: "Add one keyed list item so the patch log shows a localized INSERT.",
    html:
      '<section class="vdom-card" data-key="card-root"><h3 data-key="title">Virtual DOM Mini Project</h3><p>Start with a stable tree before diffing.</p><ul class="vdom-list"><li data-key="step-read">Read DOM into VDOM</li><li data-key="step-diff">Compare old and new trees</li><li data-key="step-history">Store snapshot history for undo and redo</li><li data-key="step-patch">Apply only the changed nodes</li></ul></section>',
  },
  {
    id: "keyed-reorder",
    label: "Keyed Reorder",
    description: "Swap keyed list items to highlight identity-aware matching and REORDER output.",
    html:
      '<section class="vdom-card" data-key="card-root"><h3 data-key="title">Virtual DOM Mini Project</h3><p>Start with a stable tree before diffing.</p><ul class="vdom-list"><li data-key="step-diff">Compare old and new trees</li><li data-key="step-read">Read DOM into VDOM</li><li data-key="step-patch">Apply only the changed nodes</li></ul></section>',
  },
  {
    id: "duplicate-key",
    label: "Duplicate Key",
    description: "Intentionally duplicate data-key so the diff warns and falls back to index comparison.",
    html:
      '<section class="vdom-card" data-key="card-root"><h3 data-key="title">Virtual DOM Mini Project</h3><p>Duplicate keys should warn before patching.</p><ul class="vdom-list"><li data-key="step-read">Read DOM into VDOM</li><li data-key="step-read">This duplicate key breaks stable identity</li><li data-key="step-patch">Apply only the changed nodes</li></ul></section>',
  },
];

const dom = {
  actualRoot: document.querySelector("#actual-root"),
  htmlInput: document.querySelector("#html-input"),
  inputMeta: document.querySelector("#input-meta"),
  previewRoot: document.querySelector("#preview-root"),
  previewMeta: document.querySelector("#preview-meta"),
  vdomOutput: document.querySelector("#vdom-output"),
  vdomMeta: document.querySelector("#vdom-meta"),
  patchOutput: document.querySelector("#patch-output"),
  patchMeta: document.querySelector("#patch-meta"),
  historyMeta: document.querySelector("#history-meta"),
  patchLog: document.querySelector("#patch-log"),
  presetBar: document.querySelector("#preset-bar"),
  presetMeta: document.querySelector("#preset-meta"),
  patchButton: document.querySelector("#patch-button"),
  backButton: document.querySelector("#back-button"),
  forwardButton: document.querySelector("#forward-button"),
};

const appState = {
  baselineState: null,
  currentInputState: null,
  currentPatches: [],
  history: null,
  activePresetId: null,
};

function summarizeVNodeTree(vNodeTree) {
  const summary = {
    rootChildren: vNodeTree.children.length,
    elements: 0,
    texts: 0,
    keyed: 0,
  };

  function visit(node) {
    if (node.type === "root") {
      node.children.forEach(visit);
      return;
    }

    if (node.type === "element") {
      summary.elements += 1;

      if (node.props["data-key"]) {
        summary.keyed += 1;
      }

      node.children.forEach(visit);
      return;
    }

    if (node.type === "text") {
      summary.texts += 1;
    }
  }

  visit(vNodeTree);

  return summary;
}

function renderActualArea(html) {
  const baselineState = buildStateFromHtml(html);
  renderVNodeTree(baselineState.vNodeTree, dom.actualRoot);
  return baselineState;
}

function renderPreviewArea(vNodeTree, summary) {
  if (summary.rootChildren === 0) {
    dom.previewRoot.innerHTML =
      '<p class="empty-state">Enter HTML in the textarea to see the parsed preview.</p>';
    dom.previewMeta.textContent = "Preview is empty";
    return;
  }

  renderVNodeTree(vNodeTree, dom.previewRoot);
  dom.previewMeta.textContent =
    `${summary.rootChildren} root node(s), ${summary.elements} element vnode(s), ${summary.texts} text vnode(s), ${summary.keyed} keyed node(s)`;
}

function renderVNodeInspector(vNodeTree, summary) {
  dom.vdomOutput.textContent = JSON.stringify(vNodeTree, null, 2);
  dom.vdomMeta.textContent =
    `${summary.rootChildren} root child(ren), ${summary.elements} element node(s), ${summary.texts} text node(s)`;
}

function renderPatchInspector(patches, metaText) {
  dom.patchOutput.textContent = JSON.stringify(patches, null, 2);
  dom.patchMeta.textContent = metaText;
}

function renderPatchLogEntries(entries) {
  const items = entries.map(({ message, tone }) => {
    const item = document.createElement("li");
    item.className = `patch-log__item patch-log__item--${tone}`;
    item.textContent = message;
    return item;
  });

  dom.patchLog.replaceChildren(...items);
}

function buildStateFromHtml(html) {
  const rootNode = parseHtmlToRoot(html);
  const vNodeTree = domRootToVNodeTree(rootNode);
  const summary = summarizeVNodeTree(vNodeTree);

  return { vNodeTree, summary, html };
}

function renderCurrentInput(html, sourceLabel = "Current input") {
  const state = buildStateFromHtml(html);
  const { vNodeTree, summary } = state;

  renderPreviewArea(vNodeTree, summary);
  renderVNodeInspector(vNodeTree, summary);
  dom.inputMeta.textContent = `${sourceLabel}: HTML length ${html.length} characters`;

  return state;
}

function renderSnapshotState(snapshotState, sourceLabel) {
  renderVNodeTree(snapshotState.vNodeTree, dom.actualRoot);
  renderPreviewArea(snapshotState.vNodeTree, snapshotState.summary);
  renderVNodeInspector(snapshotState.vNodeTree, snapshotState.summary);
  dom.htmlInput.value = snapshotState.html;
  dom.inputMeta.textContent = `${sourceLabel}: HTML length ${snapshotState.html.length} characters`;

  appState.baselineState = snapshotState;
  appState.currentInputState = snapshotState;
}

function updateHistoryControls() {
  dom.backButton.disabled = !canGoBack(appState.history);
  dom.forwardButton.disabled = !canGoForward(appState.history);
  dom.historyMeta.textContent =
    `Snapshot ${appState.history.cursor + 1}/${appState.history.snapshots.length}`;
}

function updatePresetSelection(activePresetId, message) {
  appState.activePresetId = activePresetId;
  dom.presetMeta.textContent = message;

  dom.presetBar
    .querySelectorAll("[data-preset-id]")
    .forEach((button) => {
      button.classList.toggle("button--active", button.dataset.presetId === activePresetId);
    });
}

function resetPatchOutput(message = "Click Patch to compare the baseline VDOM with the current textarea VDOM and apply the patches.") {
  appState.currentPatches = [];
  renderPatchInspector([], message);
  renderPatchLogEntries([{ message, tone: "muted" }]);
}

function loadPresetIntoInput(preset) {
  dom.htmlInput.value = preset.html;
  appState.currentInputState = renderCurrentInput(preset.html, `Preset ${preset.label}`);
  updatePresetSelection(preset.id, preset.description);
  resetPatchOutput(
    `${preset.label} loaded into the test area. Actual area stays at the current baseline until you click Patch.`,
  );
}

function resetToSampleSnapshot(reasonLabel = "Baseline reset") {
  dom.htmlInput.value = sampleHtml;
  const baselineState = renderActualArea(sampleHtml);
  const currentInputState = renderCurrentInput(sampleHtml, reasonLabel);

  appState.baselineState = baselineState;
  appState.currentInputState = currentInputState;
  appState.history = createSnapshotHistory(baselineState.vNodeTree);

  updateHistoryControls();
  updatePresetSelection(
    "baseline",
    "Baseline preset is active. Load another preset into the textarea or edit HTML directly.",
  );
  resetPatchOutput(`${reasonLabel}. Actual area, preview, and history returned to the original sample snapshot.`);
}

function renderPresetButtons() {
  const buttons = presetScenarios.map((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button--preset";
    button.dataset.presetId = preset.id;
    button.textContent = preset.label;
    button.title = preset.description;
    return button;
  });

  dom.presetBar.replaceChildren(...buttons);
}

function handlePatchClick() {
  appState.currentInputState = renderCurrentInput(dom.htmlInput.value, "Current input");
  const diffResult = diffWithMeta(appState.baselineState.vNodeTree, appState.currentInputState.vNodeTree);
  appState.currentPatches = diffResult.patches;

  if (appState.currentPatches.length === 0) {
    renderPatchInspector(appState.currentPatches, "No changes found between baseline and current VDOM.");
    renderPatchLogEntries([
      {
        message: "No changes between baseline and current VDOM.",
        tone: "success",
      },
    ]);
    return;
  }

  try {
    applyPatches(dom.actualRoot, appState.currentPatches);
    appState.baselineState = appState.currentInputState;
    pushSnapshot(appState.history, appState.currentInputState.vNodeTree);
    updateHistoryControls();

    renderPatchInspector(
      appState.currentPatches,
      `${appState.currentPatches.length} patch(es) applied. Snapshot ${appState.history.cursor + 1}/${appState.history.snapshots.length} is now current.`,
    );
    renderPatchLogEntries(
      [
        ...diffResult.warnings.map((message) => ({
          message,
          tone: "warning",
        })),
        ...appState.currentPatches.map((patch) => ({
          message: formatPatch(patch),
          tone:
            patch.type === "REMOVE"
              ? "warning"
              : patch.type === "TEXT" || patch.type === "REPLACE" || patch.type === "REORDER"
                ? "success"
                : "info",
        })),
      ],
    );
  } catch (error) {
    renderPatchInspector(appState.currentPatches, "Patch application failed.");
    renderPatchLogEntries([
      {
        message: error instanceof Error ? error.message : "Unknown patch application error.",
        tone: "warning",
      },
    ]);
  }
}

function handleHistoryClick(direction) {
  const snapshotTree = direction === "Back" ? goBack(appState.history) : goForward(appState.history);

  if (!snapshotTree) {
    renderPatchLogEntries([
      {
        message: `${direction} is not available at the current history cursor.`,
        tone: "muted",
      },
    ]);
    return;
  }

  const snapshotHtml = vNodeTreeToHtml(snapshotTree);
  const snapshotState = buildStateFromHtml(snapshotHtml);
  renderSnapshotState(snapshotState, `${direction} snapshot`);
  updateHistoryControls();
  updatePresetSelection(
    null,
    `${direction} loaded a stored snapshot. Presets can replace the textarea with a repeatable demo case.`,
  );
  resetPatchOutput(
    `${direction} moved to snapshot ${appState.history.cursor + 1}/${appState.history.snapshots.length}. Current input was replaced with the stored snapshot.`,
  );
}

function initializeApp() {
  renderPresetButtons();
  resetToSampleSnapshot("Sample HTML loaded");
}

dom.htmlInput.addEventListener("input", () => {
  appState.currentInputState = renderCurrentInput(dom.htmlInput.value, "Custom input");
  updatePresetSelection(
    null,
    "Custom input is active. Preset buttons load repeatable scenarios without changing the actual area yet.",
  );
  resetPatchOutput("Input changed. Click Patch to regenerate the diff against the baseline VDOM.");
});

dom.presetBar.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("[data-preset-id]");

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const preset = presetScenarios.find((scenario) => scenario.id === button.dataset.presetId);

  if (!preset) {
    return;
  }

  if (preset.resetBaseline) {
    resetToSampleSnapshot("Baseline reset");
    return;
  }

  loadPresetIntoInput(preset);
});

dom.patchButton.addEventListener("click", handlePatchClick);
dom.backButton.addEventListener("click", () => handleHistoryClick("Back"));
dom.forwardButton.addEventListener("click", () => handleHistoryClick("Forward"));

initializeApp();
