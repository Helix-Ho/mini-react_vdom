# Virtual DOM Mini Project

브라우저 DOM을 Virtual DOM 트리로 읽고, old/new VDOM diff 결과를 path 기반 patch로 계산한 뒤, 실제 DOM에 필요한 변경만 반영하고 snapshot history 로 undo/redo 까지 보여 주는 Vanilla JS 미니 프로젝트입니다.

## 1. 프로젝트 소개

이 프로젝트의 목적은 단순히 동작하는 결과물을 만드는 것이 아니라, `DOM -> VDOM -> diff -> patch -> history` 흐름을 직접 구현하고 설명 가능한 상태로 만드는 것입니다.

현재 구현 범위:
- 실제 영역 / 테스트 영역 / Patch / Back / Forward UI
- DOM -> VDOM 변환
- VDOM -> DOM 렌더링
- diff 핵심 5케이스 + path 기반 patch
- 실제 DOM patch 적용
- snapshot history 기반 undo/redo
- `data-key` 기반 identity

의도적으로 뒤로 미룬 범위:
- full MOVE 최적화
- inverse patch 기반 undo
- React 수준 batching / scheduler
- 모든 HTML edge case 완전 지원

## 2. 실행 방법

정적 HTML/CSS/JS 프로젝트입니다.

1. 저장소 루트에서 `npm test`
2. `python3 -m http.server 4173`
3. 브라우저에서 `http://127.0.0.1:4173` 열기

## 3. 데모 시나리오

### 3-1. 초기 상태
- actual area 에 baseline sample HTML 이 보인다.
- textarea 에 같은 sample HTML 이 들어 있다.
- preview 는 현재 textarea 로부터 다시 렌더된 DOM 이다.
- history 는 `Snapshot 1/1`에서 시작한다.
- demo presets 에서 `Reset Baseline` 이 활성 상태다.

### 3-2. Patch 시연
- `Text + Attr` preset 을 누른다.
- `Patch` 를 누른다.
- patch JSON 과 patch log 를 확인한다.
- actual area 가 전체 rerender 대신 patch 결과만 반영한 상태로 바뀐다.

### 3-3. Undo / Redo 시연
- `Reset Baseline` 후 `Text + Attr`, `Insert Child`, `Keyed Reorder` 를 순서대로 patch 한다.
- `Back` 을 눌러 이전 snapshot 으로 돌아간다.
- actual area, textarea, preview, VDOM inspector 가 함께 바뀌는지 확인한다.
- `Forward` 로 다시 앞으로 이동한다.

### 3-4. data-key 시연
- `Reset Baseline` 후 `Insert Child` 또는 `Keyed Reorder` preset 을 사용한다.
- `Patch` 를 눌러 keyed insert/remove 또는 `REORDER` patch 를 확인한다.
- `Duplicate Key` preset 으로 warning 과 index fallback 도 바로 보여 줄 수 있다.

## 4. 핵심 개념

### DOM
- 브라우저가 실제로 렌더하는 트리
- 변경 비용이 커서 작은 변경만 반영하는 것이 중요하다

### Virtual DOM
- 실제 DOM 을 비교/설명하기 쉬운 순수 데이터 트리로 표현한 것
- 이 프로젝트에서는 `root`, `element`, `text` 세 타입으로 표현한다
- 브라우저 `body`를 그대로 상태로 쓰지 않고, body 아래 의미 있는 children을 감싸는 synthetic `root` VNode를 둔다

### Diff
- old VDOM 과 new VDOM 을 비교해 어떤 위치가 달라졌는지 patch 목록으로 만든다
- patch path 는 `root.0.1.0` 같은 위치 주소 역할을 한다
- “같은 노드인가?”와 “내용이 같은가?”를 분리해서 본다. 예를 들어 text node는 같은 위치의 같은 종류면 identity 는 유지하고, 값 차이는 `TEXT` patch 로 처리한다

### Patch
- diff 결과를 실제 DOM 에 적용하는 단계
- 이 프로젝트에서는 `INSERT`, `REMOVE`, `REPLACE`, `TEXT`, `SET_ATTR`, `REMOVE_ATTR`, `REORDER` 를 사용한다
- `REORDER` 는 full MOVE 최적화가 아니라, keyed child list 를 그 부모 아래에서 다시 맞추는 localized rerender 성격의 patch 다

### data-key
- list item 의 identity 를 유지하기 위한 규칙
- 성능 최적화 옵션이 아니라 “누가 누구인가”를 알려 주는 라벨이다

### History snapshot
- patch 후의 VDOM 을 시점별 snapshot 으로 저장한다
- undo/redo 는 inverse patch 가 아니라 snapshot 배열 + cursor 이동으로 구현한다
- actual area DOM 과 textarea HTML 은 파생 결과이고, 장기 상태 저장소는 현재 VDOM snapshot 이다

## 5. 핵심 알고리즘 설명

### 5-1. DOM -> VDOM
- `parseHtmlToRoot()` 가 textarea HTML 을 `DOMParser` 로 읽는다
- `domToVNode()` 가 DOM node 를 재귀적으로 순회하며 VNode 로 바꾼다
- `domToVNode()` 는 `children` 이 아니라 `childNodes` 를 읽어서 text node 도 비교 대상에 포함한다
- whitespace-only text node 는 1차 버전에서 버려 diff noise 를 줄인다
- comment 같은 비핵심 node type 은 현재 범위에서 건너뛴다

### 5-2. VDOM -> DOM
- `vNodeToDom()` 이 text node 또는 element node 를 다시 실제 DOM 으로 만든다
- preview 와 actual area 모두 같은 렌더 경로를 사용한다
- 이 단계 덕분에 “VDOM 은 실제로 렌더 가능한 상태 표현”이라고 설명할 수 있다

### 5-3. Diff
- `diff()` 는 old/new VDOM 을 DFS 방식으로 비교한다
- 기본 케이스는 `INSERT`, `REMOVE`, `REPLACE`, `TEXT`, props diff 다
- `isSameNode()` 는 node identity 판정 규칙이고, 그 뒤에 props/text 차이를 세부 patch 로 나눈다
- `data-key` 가 있으면 keyed child matching 으로 identity 를 유지한다
- keyed diff 는 sibling 전체가 keyed 일 때만 켜지고, duplicate key 나 mixed keyed/unkeyed list 는 안전하게 fallback 한다
- reorder 는 full MOVE 최적화 대신 `REORDER` patch 로 처리한다

### 5-4. Patch apply
- `applyPatch()` 가 path 로 실제 DOM node 를 찾는다
- patch 타입에 따라 text 수정, attr 수정, insert/remove/replace 를 수행한다
- `REMOVE` 는 path drift 를 막기 위해 더 깊고 더 큰 index 부터 적용한다
- root wrapper 는 실제 DOM node 가 아니므로, patch path 는 actual area container 의 `childNodes` 기준으로 해석한다

### 5-5. History
- patch 성공 후 current VDOM 을 snapshot history 에 push 한다
- `Back` / `Forward` 는 cursor 를 움직이고 해당 snapshot 으로 actual area, textarea, preview 를 함께 다시 맞춘다
- undo 뒤 새 patch 를 만들면 미래 snapshot 은 버린다
- textarea 는 source of truth 가 아니라 새 상태를 만드는 재료이므로, history 이동 시에는 snapshot 에서 다시 만든 HTML 로 덮어쓴다

## 6. 이번 주차 알고리즘 키워드와 연결

### tree
- DOM, VDOM, history snapshot 모두 트리 구조다

### dfs
- `domToVNode`, `vNodeToDom`, `diff`, `applyPatch` 전부 DFS 감각이 강하다

### graph_basic
- history 는 시점 이동, key 는 identity 관계를 이해하는 데 도움 된다

### bst 규칙 감각
- `same tag`, `same key` 같은 규칙이 비교 범위를 줄이고 설명 가능성을 높인다

### topological 확장 아이디어
- 1차 구현 필수는 아니지만, remove 순서나 patch commit 순서를 이해하는 데 연결된다

## 7. 핵심 설계 선택

### 왜 textarea + DOMParser 인가
- 구현 복잡도가 낮다
- HTML 파싱과 디버깅이 명확하다
- contenteditable 특유의 selection/whitespace 문제를 줄일 수 있다

### 왜 snapshot history 인가
- inverse patch 보다 구현과 설명이 단순하다
- “현재 상태 = 현재 VDOM snapshot” 구조와 잘 맞는다

### 왜 root wrapper 와 path 배열을 같이 썼는가
- 여러 top-level node 를 허용하면서도 일관된 diff 시작점을 만들 수 있다
- `root -> child index -> child index` 형태의 path 가 `applyPatch()` 와 history 설명에 자연스럽게 이어진다

### 왜 text node 규칙을 따로 설명해야 하는가
- 브라우저는 text 도 node 로 다루기 때문에, `childNodes` 기준으로 읽어야 `TEXT` patch 가 생긴다
- 대신 whitespace-only text 는 1차 버전에서 버려 노이즈를 줄였고, 이 선택은 범위 축소라는 점을 분명히 해야 한다

### 왜 data-key 를 범위에 넣었는가
- list item identity 를 설명하는 핵심 규칙이기 때문이다
- key 가 없을 때 index diff 가 왜 한계가 있는지 데모하기 좋다

### 무엇을 일부러 구현하지 않았는가
- full MOVE 최적화
- inverse patch undo
- event/property diff 고도화
- React 내부 scheduler / batching

## 8. 테스트 / 검증

### 8-1. 자동 테스트

실행:

```bash
npm test
```

현재 커버하는 파일:
- `tests/domToVNode.test.js`: DOM -> VDOM shape, whitespace rule, props 변환
- `tests/vNodeToDom.test.js`: VDOM -> DOM 렌더
- `tests/diff.test.js`: diff 5케이스와 nested path
- `tests/applyPatch.test.js`: patch apply, remove ordering, reorder apply
- `tests/history.test.js`: snapshot push, cursor 이동, future discard
- `tests/keyedIdentity.test.js`: keyed insert/remove/reorder, duplicate key warning

### 8-2. 수동 스모크 체크

브라우저 시나리오는 [`tests/SMOKE_CHECKLIST.md`](tests/SMOKE_CHECKLIST.md)에 정리했습니다.

핵심 확인 항목:
- initial load
- text / attr / insert / remove / replace patch
- history undo/redo
- undo 후 새 patch 시 redo 불가
- keyed insert/remove/reorder
- duplicate key warning

### 8-3. 확인한 한계
- reorder 는 `REORDER` patch 로 처리하고 full MOVE 최적화는 하지 않는다
- duplicate key 는 경고만 남기고 자동 복구는 하지 않는다
- `DOMParser` 가 invalid HTML 을 브라우저 방식으로 보정하므로, textarea 원문과 실제 비교 트리가 완전히 같지 않을 수 있다
- mixed keyed/unkeyed child list 는 keyed diff 를 쓰지 않고 index 기반 비교로 fallback 한다
- attribute 기반 업데이트만 다루므로 DOM property, boolean attr, form control edge case 는 단순화했다
- browser automation 기반 E2E 는 아직 없다

## 9. 프로젝트 구조

```text
src/
  model/    VNode shape, clone 유틸
  dom/      DOM 읽기, DOM 렌더, HTML 직렬화
  diff/     diff core, props diff, keyed identity
  patch/    실제 DOM patch 적용
  history/  snapshot store, cursor 이동
tests/
  unit test + manual smoke checklist
Lessons/
  마일스톤별 학습 기록
```

## 10. Lessons

각 마일스톤별 기록:
- [`Lessons/00_project_skeleton.md`](Lessons/00_project_skeleton.md)
- [`Lessons/01_vnode_and_dom_reading.md`](Lessons/01_vnode_and_dom_reading.md)
- [`Lessons/02_render_and_initial_sync.md`](Lessons/02_render_and_initial_sync.md)
- [`Lessons/03_diff_core.md`](Lessons/03_diff_core.md)
- [`Lessons/04_patch_application.md`](Lessons/04_patch_application.md)
- [`Lessons/05_history_snapshot.md`](Lessons/05_history_snapshot.md)
- [`Lessons/06_data_key_identity.md`](Lessons/06_data_key_identity.md)
- [`Lessons/07_validation_readme_demo.md`](Lessons/07_validation_readme_demo.md)
- [`Lessons/08_demo_presets.md`](Lessons/08_demo_presets.md)
- [`Lessons/09_preset_smoke_flow.md`](Lessons/09_preset_smoke_flow.md)
- [`Lessons/10_explanation_reinforcement.md`](Lessons/10_explanation_reinforcement.md)
- [`Lessons/11_compact_frontend_layout.md`](Lessons/11_compact_frontend_layout.md)

이 폴더를 보면 “왜 구현했는지 / 어떻게 구현했는지 / 어떻게 검증했는지 / 무엇이 남았는지”를 단계별로 다시 복습할 수 있다.

## 11. 4분 데모 스크립트

### 0:00 - 0:30
- 프로젝트 한 줄 소개
- 왜 실제 DOM 대신 VDOM + diff + patch 를 직접 구현했는지 설명

### 0:30 - 1:20
- 화면 구조 소개: actual area / textarea / preview / patch output / history
- source of truth 를 current VDOM snapshot 으로 본다고 설명

### 1:20 - 2:10
- `Text + Attr` preset 선택
- `Patch` 클릭
- patch JSON 과 patch log 설명
- actual area 가 전체 rerender 대신 patch 로 바뀌는 점 강조

### 2:10 - 2:50
- `Insert Child`, `Keyed Reorder` 를 이어서 patch
- `Back` / `Forward` 로 snapshot history 시연
- actual area 와 textarea/preview 가 함께 바뀌는 점 보여 주기

### 2:50 - 3:35
- `Reset Baseline` 후 `Keyed Reorder` 또는 `Duplicate Key` preset 시연
- `data-key` 가 없으면 index diff 가 흔들릴 수 있고, key 가 있으면 identity 를 유지한다는 점 설명

### 3:35 - 4:00
- 테스트와 검증 흔적 소개
- `npm test`, smoke checklist, Lessons 문서, README 구조를 짧게 마무리

## 12. 예상 질문 5개

1. 왜 actual DOM 이 아니라 VDOM snapshot 을 source of truth 로 봤나요?
2. 왜 undo/redo 를 inverse patch 가 아니라 snapshot 으로 구현했나요?
3. 왜 reorder 를 full MOVE patch 가 아니라 `REORDER` 로 처리했나요?
4. 왜 key 가 없으면 리스트 앞 삽입에서 문제가 생기나요?
5. 어떤 edge case 는 아직 일부러 구현하지 않았나요?

## 13. 회고

잘된 점:
- DOM -> VDOM -> diff -> patch -> history 흐름을 단계별로 직접 설명할 수 있게 됐다
- 자동 테스트와 수동 스모크 체크를 분리해서 검증 흔적을 남겼다
- Lessons 문서가 구현 기록과 학습 기록을 동시에 맡게 됐다

아쉬운 점:
- reorder 는 아직 full MOVE 최적화가 아니다
- browser automation 기반 E2E 테스트는 없다

다음에 확장하고 싶은 점:
- MOVE patch 최적화
- preset 기반 smoke flow 자동화
- README 에 GIF / screenshot 추가
