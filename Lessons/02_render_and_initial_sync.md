# M2. Render and Initial Sync

## 1. 오늘의 목표
- `vNodeToDom()`을 구현해 VNode를 다시 실제 DOM 노드로 렌더한다.
- 초기 샘플 HTML에서 만든 VNode로 실제 영역과 테스트 미리보기를 렌더한다.
- DOM -> VDOM -> DOM 왕복 흐름을 화면에서 확인할 수 있게 만든다.

## 2. 왜 이 단계를 지금 하는가
- M1에서 읽은 VNode가 실제 렌더 가능한 상태 표현인지 증명하려면 다시 DOM으로 만들 수 있어야 한다.
- 이후 diff는 old/new VNode를 비교하고 patch는 실제 DOM에 반영하므로, 지금은 “VDOM을 결과 UI로 바꾸는 단계”를 먼저 고정해야 한다.
- M2가 있어야 이후 변경 전후를 같은 렌더 경로로 비교할 수 있다.

## 3. 이번 주차 키워드와 연결
- `tree`: 같은 트리를 HTML 문자열, 브라우저 DOM, VNode, 다시 DOM으로 옮겨 다니는 단계다.
- `dfs`: `vNodeToDom()`도 현재 노드를 만들고 자식을 재귀적으로 붙이는 DFS 성격의 함수다.
- `graph_basic`: 부모-자식 관계를 잃지 않고 다른 표현으로 다시 구성하는 과정이다.
- `topological_sort`: 아직 필수는 아니지만, 나중에 patch 적용 순서를 고민할 때 “어떤 순서로 붙일지” 감각의 기초가 된다.

## 4. 구현 전에 확인한 개념
- VNode root는 직접 DOM 노드가 아니라 top-level children을 담는 wrapper로 보는 편이 단순하다.
- props는 일단 `setAttribute()`로 그대로 적용해도 1차 렌더링에는 충분하다.
- 실제 영역과 테스트 미리보기를 같은 렌더 함수로 그리면 “상태 -> UI” 흐름을 설명하기 쉬워진다.

## 5. 구현 계획
- `src/dom/vNodeToDom.js`에 `setDomProps()`, `vNodeToDom()`, `renderVNodeTree()`를 만든다.
- `src/main.js`에서 baseline sample HTML과 현재 textarea 입력을 모두 VNode로 바꾼 뒤, 렌더 함수로 실제 영역과 미리보기를 만든다.
- `tests/vNodeToDom.test.js`로 렌더 결과를 검증한다.

## 6. 실제 구현 방식
- `vNodeToDom()`은 `text`면 text node를 만들고, `element`면 `createElement()` 후 props와 children을 재귀적으로 붙인다.
- `renderVNodeTree()`는 `root` vnode의 children을 컨테이너에 한 번에 교체 렌더한다.
- 초기 로드 시 sample HTML을 `parseHtmlToRoot()` -> `domRootToVNodeTree()`로 읽은 뒤, 같은 VNode tree를 actual area와 preview 쪽에 각각 사용한다.
- textarea 입력이 바뀌면 현재 입력을 새 VNode tree로 만들고 preview와 VDOM inspector를 갱신한다.
- actual area는 patch 단계 전까지 초기 baseline VNode tree를 계속 유지한다.

## 7. 구현 후 달라진 점
- 이전 상태: preview가 DOMParser 결과 HTML을 그대로 `innerHTML`로 보여 줬다.
- 현재 상태: preview는 현재 VNode tree를 다시 DOM으로 렌더한 결과를 보여 준다.
- 눈으로 확인 가능한 변화: “입력 HTML -> VNode JSON -> 다시 렌더된 DOM” 흐름이 한 화면에서 이어진다.

## 8. 검증 방법과 결과
- `node tests/vNodeToDom.test.js` 실행 결과 `Passed 2 vNodeToDom test case(s).`가 출력됐다.
- `node tests/domToVNode.test.js`도 다시 통과해 읽기 로직이 깨지지 않았음을 확인했다.
- `node --check src/main.js`, `node --check src/dom/vNodeToDom.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답은 `HTTP/1.0 200 OK`였다.
- 브라우저 수동 스모크에서는 textarea 수정 후 preview가 여전히 같은 구조로 렌더되는지 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- 현재 props는 모두 `setAttribute()`로 처리하므로 이벤트 핸들러나 property 기반 동작은 아직 다루지 않는다.
- empty root일 때는 placeholder 문구를 렌더하지만, 이후 diff 단계에서 empty tree path 규칙은 별도로 정리해야 한다.
- boolean attribute나 style object 정규화는 아직 하지 않는다.

## 10. 더 도전하려면
- actual area와 preview area의 DOM을 직렬화해서 완전히 같은지 비교하는 디버그 패널을 둘 수 있다.
- 렌더 함수에 DocumentFragment를 써서 더 명시적인 배치 렌더 경로를 보여 줄 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M3. Diff 핵심 5케이스`다.
- 이유는 이제 old/new VNode를 둘 다 만들고 다시 렌더할 수 있으므로, 둘 사이 차이를 patch 목록으로 만드는 단계로 바로 넘어갈 수 있기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 preview를 `innerHTML`이 아니라 `vNodeToDom()` 경로로 렌더해야 “VDOM이 실제 렌더 가능한 상태”라는 점을 증명할 수 있을까?
- 왜 actual area와 preview area를 같은 렌더 함수로 그리는 것이 이후 diff 설명에 유리할까?
- 왜 `root` vnode는 직접 DOM 노드 하나로 만들지 않고 children 집합으로 취급하는 편이 단순할까?
