# M1. VNode Shape and DOM Reading

## 1. 오늘의 목표
- `element`와 `text`를 표현할 수 있는 VNode shape를 고정한다.
- `parseHtmlToRoot()`와 `domToVNode()`를 구현해 textarea HTML을 VDOM 트리로 읽는다.
- 화면에서 현재 입력 HTML의 VDOM 결과를 바로 확인할 수 있게 만든다.

## 2. 왜 이 단계를 지금 하는가
- 이후 `diff()`는 문자열이 아니라 트리와 트리를 비교해야 하므로, 먼저 DOM을 일관된 VNode shape로 바꾸는 단계가 필요하다.
- 어떤 노드를 같은 노드로 볼지 판단하려면 최소한 tag, props, children, text 값을 안정적으로 읽어야 한다.
- M0에서 만든 입력/출력 자리가 이제 처음으로 “알고리즘이 실제 데이터를 만드는 자리”가 된다.

## 3. 이번 주차 키워드와 연결
- `tree`: HTML과 DOM은 트리이고, VNode도 같은 구조를 다른 표현으로 들고 있는 트리다.
- `dfs`: `domToVNode()`는 현재 노드를 읽고 자식을 재귀적으로 내려가며 변환하는 전형적인 DFS 패턴이다.
- `graph_basic`: 부모-자식 관계와 identity를 나중에 비교하기 위해 먼저 구조를 잃지 않고 옮겨야 한다.
- `bst`: 아직 탐색 트리는 아니지만 `same tag`, `same key` 같은 비교 규칙을 위한 기초 shape를 지금 만든다.

## 4. 구현 전에 확인한 개념
- whitespace-only text node는 1차 버전에서 버려야 diff 노이즈를 줄일 수 있다.
- non-empty text node는 그대로 보존해야 이후 TEXT patch가 가능하다.
- HTML 문자열은 `DOMParser`로 body 아래에 파싱하고, 실제 VDOM은 `root` wrapper 아래 children 배열로 관리하는 편이 단순하다.
- `children`이 아니라 `childNodes`를 읽어야 text node도 VDOM으로 옮길 수 있다.
- `DOMParser`는 invalid HTML을 브라우저 방식으로 보정할 수 있으므로, textarea 원문과 최종 DOM tree가 완전히 같지 않을 수 있다.

## 5. 구현 계획
- `src/model/vnode.js`에 root/element/text VNode 생성 함수를 둔다.
- `src/dom/domToVNode.js`에 `parseHtmlToRoot()`, `attributesToProps()`, `domToVNode()`, `domRootToVNodeTree()`를 둔다.
- `src/main.js`에서 textarea 입력을 파싱한 뒤 미리보기와 VDOM 출력 패널을 같이 갱신한다.
- `tests/domToVNode.test.js`로 핵심 변환 규칙을 검증한다.

## 6. 실제 구현 방식
- VNode는 `root`, `element`, `text` 세 타입으로 나눴다.
- `element`는 `tag`, `props`, `children`을 가진다.
- `text`는 `value`만 가진다.
- `root`는 body 아래 의미 있는 top-level children만 들고 있다.
- 이 `root`는 실제 브라우저 DOM node가 아니라 diff와 patch path의 시작점을 고정하기 위한 synthetic wrapper다.
- `attributesToProps()`는 DOM attribute를 `{ [name]: value }` 형태의 plain object로 바꾼다.
- `domToVNode()`는 `childNodes`를 순회하면서 text node를 만나면 whitespace-only인지 먼저 검사하고, element node를 만나면 tag/props/children을 재귀적으로 읽는다.
- comment 같은 비핵심 node type은 `null`로 건너뛴다.
- UI에서는 현재 textarea 입력으로 만든 VDOM JSON을 별도 inspector 패널에 보여 준다.

## 7. 구현 후 달라진 점
- 이전 상태: HTML 문자열은 DOM 미리보기까지만 연결되어 있었다.
- 현재 상태: 같은 입력 HTML이 VDOM root tree로도 변환되어 화면에 출력된다.
- 눈으로 확인 가능한 변화: textarea를 바꾸면 parsed DOM 미리보기와 serialized VDOM이 함께 갱신된다.

## 8. 검증 방법과 결과
- `node tests/domToVNode.test.js` 실행 결과 `Passed 4 domToVNode test case(s).`가 출력됐다.
- `node --check src/main.js`, `node --check src/dom/domToVNode.js`, `node --check src/model/vnode.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답이 `HTTP/1.0 200 OK`였다.
- 브라우저 수동 스모크에서는 textarea 수정 시 preview와 VDOM JSON이 함께 바뀌는지 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- 현재는 HTML comment, CDATA 같은 비핵심 node type을 무시한다.
- boolean attribute와 style object 정규화는 아직 하지 않고 문자열 props로만 보관한다.
- 여러 top-level root를 허용하기 위해 `root` wrapper를 도입했지만, 이후 diff path 설계에서 root 처리 규칙을 한 번 더 정리해야 한다.
- 공백-only text를 버리는 규칙은 diff noise를 줄여 주지만, `pre`류처럼 공백 자체가 의미인 문맥까지 완벽히 다루지는 못한다.

## 10. 더 도전하려면
- VDOM inspector에 path나 depth 정보를 함께 보여 줄 수 있다.
- whitespace-only text node를 버릴지 보존할지 토글하는 학습용 옵션을 둘 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M2. VDOM -> DOM 렌더링 + 초기 동기화`다.
- 이유는 이제 읽은 VDOM을 다시 DOM으로 만들 수 있어야 VDOM이 실제 렌더 가능한 상태 표현이라는 점을 증명할 수 있기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 `textContent.trim() === ""`인 text node는 1차 버전에서 버리는 것이 좋은가?
- 왜 body를 그대로 VDOM root로 쓰지 않고 `root` wrapper를 두는 방식이 설명하기 쉬운가?
- `attributesToProps()`가 단순 object를 반환하는 것이 이후 diff 단계에서 왜 유리한가?
