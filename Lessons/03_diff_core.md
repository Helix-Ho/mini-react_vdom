# M3. Diff Core

## 1. 오늘의 목표
- old/new VNode tree를 비교하는 `diff()`를 만든다.
- path 기반 patch 표현을 정하고 핵심 5케이스를 모두 생성한다.
- `Patch` 버튼을 눌렀을 때 사람이 읽을 수 있는 patch log를 화면에 보여 준다.

## 2. 왜 이 단계를 지금 하는가
- M2까지는 VDOM을 읽고 다시 그릴 수만 있었고, 아직 “어디가 바뀌었는지”를 계산하지 못했다.
- 실제 DOM에 최소 변경만 반영하려면 먼저 변경 목록인 patch를 만들어야 한다.
- diff가 있어야 M4의 `applyPatch()`가 전체 rerender 대신 필요한 부분만 건드릴 수 있다.

## 3. 이번 주차 키워드와 연결
- `tree`: 두 트리를 같은 위치 기준으로 비교하는 문제다.
- `dfs`: `diff()`는 현재 노드를 비교한 뒤 자식으로 내려가는 DFS 흐름을 따른다.
- `bst`: `same type`, `same tag` 같은 규칙이 비교 비용을 줄여 준다는 점에서 “규칙이 탐색을 쉽게 만든다”는 감각과 닮아 있다.
- `graph_basic`: path는 트리에서 특정 노드 위치를 가리키는 간단한 주소 역할을 한다.

## 4. 구현 전에 확인한 개념
- 1차 버전에서는 key matching 없이 index 기반 child 비교로 시작한다.
- 같은 노드 판정은 현재 단계에서 `same type` + element라면 `same tag`로 둔다.
- 같은 노드 판정과 같은 내용 판정은 분리해야 한다. text node는 같은 위치의 같은 종류면 identity를 유지하고, 실제 값 차이는 `TEXT` patch로 처리한다.
- patch는 나중에 DOM에 적용될 수 있어야 하므로 path 의미가 일관돼야 한다.

## 5. 구현 계획
- `src/diff/diff.js`에 `diff()`, `isSameNode()`, `diffProps()`, `diffChildren()`, `formatPatch()`를 만든다.
- patch path는 root 기준 index 배열로 둔다.
- `src/main.js`에서 `Patch` 클릭 시 baseline/current VDOM을 비교해 patch JSON과 patch log를 보여 준다.
- `tests/diff.test.js`로 5케이스와 nested path를 검증한다.

## 6. 실제 구현 방식
- patch 타입은 `INSERT`, `REMOVE`, `REPLACE`, `TEXT`, `SET_ATTR`, `REMOVE_ATTR` 여섯 종류로 뒀다.
- `INSERT`, `REMOVE`, `REPLACE`, `TEXT`는 노드 수준 변경이고, props 변경은 `SET_ATTR` / `REMOVE_ATTR`로 쪼갰다.
- path는 `root` 아래 child index를 순서대로 쌓는 배열이다. 예를 들면 `[0, 1, 0]`은 `root -> 0번 child -> 1번 child -> 0번 child`를 뜻한다.
- `isSameNode()`는 “여기서 비교를 계속할지, 아니면 통째로 갈아끼울지”를 정하는 identity 규칙이다.
- text node는 `isSameNode()`에서 같은 type이면 같은 노드로 보고, 실제 문자열이 다를 때만 `TEXT` patch를 만든다.
- element node는 type이 같고 tag가 같을 때 같은 노드로 보고, 그 뒤에 props diff와 children diff를 이어서 수행한다.
- `diffProps()`는 old/new prop 이름을 합쳐 정렬한 뒤 변경/삭제를 patch로 만든다.
- `diffChildren()`은 child 배열을 index 기준으로 끝까지 순회하며 재귀 diff를 수행한다.
- UI에서는 현재 textarea 입력을 baseline VDOM과 비교해 patch JSON과 사람이 읽을 수 있는 log line을 함께 보여 준다.
- 실제 DOM 반영은 아직 하지 않고 baseline actual area는 그대로 둔다.

## 7. 구현 후 달라진 점
- 이전 상태: `Patch` 버튼은 placeholder 문구만 남겼다.
- 현재 상태: `Patch` 버튼이 baseline/current VDOM diff를 계산해 patch 목록을 생성한다.
- 눈으로 확인 가능한 변화: patch panel에 JSON patch 배열이 보이고, patch log에는 `TEXT root.0.1 => "..."` 같은 사람이 읽는 문장이 보인다.

## 8. 검증 방법과 결과
- `node tests/diff.test.js` 실행 결과 `Passed 7 diff test case(s).`가 출력됐다.
- `node tests/domToVNode.test.js`, `node tests/vNodeToDom.test.js`도 다시 통과했다.
- `npm test` 실행으로 세 테스트 파일이 모두 통과하는 것을 확인했다.
- `node --check src/main.js`, `node --check src/diff/diff.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답은 `HTTP/1.0 200 OK`였다.

## 9. 놓친 점 / 엣지 케이스
- 현재 child 비교는 index 기반이라 reorder에 약하다. `data-key` 기반 identity는 M6에서 다룬다.
- `style` diff를 object 단위로 쪼개지 않고 속성 문자열 전체 비교로 본다.
- path 기반 patch는 만들어졌지만 실제 DOM에 적용하는 단계는 아직 없다.
- identity 규칙을 너무 느슨하게 두면 불필요한 세부 patch가 늘고, 너무 엄격하게 두면 `REPLACE`가 과도해진다. 이 균형은 발표에서 꼭 설명해야 한다.

## 10. 더 도전하려면
- patch log에 old/new 값을 같이 보여 주는 richer formatter를 만들 수 있다.
- diff 결과를 path depth 기준으로 색상 표시해 시각화할 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M4. 실제 DOM에 Patch 적용`이다.
- 이유는 이제 patch 목록이 생겼으므로, 이 목록을 actual area DOM에 적용하는 단계로 바로 이어질 수 있기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 `same type + same tag` 규칙이 없으면 REPLACE가 과도하게 많이 생길 수 있을까?
- 왜 text node는 값이 달라도 먼저 `TEXT` patch 후보로 보고, 곧바로 `REPLACE`하지 않을까?
- 왜 patch path를 배열 형태로 두는 것이 이후 `applyPatch()` 구현에 유리할까?
- 왜 props 변경을 하나의 큰 PROPS patch가 아니라 `SET_ATTR` / `REMOVE_ATTR`로 쪼개는 편이 설명하기 쉬울까?
