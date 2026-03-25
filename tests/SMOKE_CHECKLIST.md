# Manual Smoke Checklist

## Goal
- Verify the end-to-end browser flow after automated unit tests pass.
- Confirm the demo path works with visible UI changes.

## Preconditions
- Run `npm test`
- Serve the project with `python3 -m http.server 4173`
- Open `http://127.0.0.1:4173`
- Start each independent case by clicking `Reset Baseline` unless the case says to continue from the previous snapshot

## Browser Smoke Cases

### 1. Initial load
- Expected:
  - Actual area shows the sample HTML card
  - Textarea contains the sample HTML string
  - Preview renders the same structure as the actual area
  - Patch output is empty and history shows `Snapshot 1/1`
  - `Reset Baseline` is the active preset

### 2. Text + attribute patch with preset
- Action:
  - Click `Text + Attr`
  - Click `Patch`
- Expected:
  - Patch log contains `TEXT` and `SET_ATTR`
  - Actual area heading text and root class both change without clearing the whole panel
  - History advances to `Snapshot 2/2`

### 3. Insert child patch with preset
- Action:
  - Click `Reset Baseline`
  - Click `Insert Child`
  - Click `Patch`
- Expected:
  - Patch log contains `INSERT`
  - Actual area gains one extra keyed list item
  - Preview and actual area match after patch

### 4. Replace patch by direct edit
- Action:
  - Click `Reset Baseline`
  - Change one tag in the textarea, for example `<p>` to `<h2>`
  - Click `Patch`
- Expected:
  - Patch log shows `REPLACE`
  - Actual area tag changes to the new tag

### 5. Remove patch by direct edit
- Action:
  - Continue from the reset baseline or click `Reset Baseline`
  - Remove one list item in the textarea
  - Click `Patch`
- Expected:
  - Patch log shows `REMOVE`
  - Actual area matches the preview after the removed child disappears

### 6. History undo/redo
- Action:
  - Click `Reset Baseline`
  - Click `Text + Attr`, then `Patch`
  - Click `Insert Child`, then `Patch`
  - Click `Keyed Reorder`, then `Patch`
  - Click `Back` twice
  - Click `Forward` once
- Expected:
  - Actual area, textarea, preview, and VDOM inspector all move together
  - History counter changes with the cursor

### 7. Future discard after undo
- Action:
  - Continue from the previous case
  - Click `Back`
  - Click `Duplicate Key`
  - Click `Patch`
- Expected:
  - Redo is no longer available
  - History counter shows the future snapshots were discarded

### 8. data-key insert/remove
- Action:
  - Click `Reset Baseline`
  - Use `Insert Child` and click `Patch`
  - Click `Reset Baseline`
  - Remove the first keyed list item manually, then click `Patch`
- Expected:
  - Patch log prefers keyed `INSERT` or `REMOVE`
  - Surviving keyed items keep stable identity

### 9. data-key reorder
- Action:
  - Click `Reset Baseline`
  - Click `Keyed Reorder`
  - Click `Patch`
- Expected:
  - Patch log shows a `REORDER` patch
  - A warning explains that full MOVE optimization is intentionally out of scope

### 10. duplicate key warning
- Action:
  - Click `Reset Baseline`
  - Click `Duplicate Key`
  - Click `Patch`
- Expected:
  - Patch log includes a duplicate-key warning
  - Diff falls back to index-based behavior
