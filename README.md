# Vanilla JS Virtual DOM Diff Demo

React의 핵심 개념인 Virtual DOM, Diff 알고리즘, Patch 적용, State History를 순수 HTML/CSS/JavaScript만으로 구현한 데모 프로젝트입니다.

## 파일 구조

```text
.
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## 프로젝트 소개

이 데모는 다음 흐름을 한 번에 보여주는 학습용 프로젝트입니다.

1. 실제 DOM 또는 HTML 문자열을 읽어서 Virtual DOM 트리로 변환
2. 이전 Virtual DOM과 새 Virtual DOM을 비교해 Patch 생성
3. Patch만 실제 DOM에 적용해 부분 업데이트 수행
4. 상태를 history 배열에 저장해 Undo / Redo 지원

핵심은 "전체를 다시 그리지 않고, 바뀐 부분만 찾아 반영한다"는 점입니다.

## 왜 Virtual DOM이 필요한가

브라우저의 실제 DOM은 트리 구조이지만, 직접 수정할 때마다 레이아웃 계산과 페인팅 비용이 발생할 수 있습니다. 특히 변경이 자주 일어나면 브라우저가 reflow, repaint를 반복하게 되고, 복잡한 화면에서는 성능 부담이 커집니다.

Virtual DOM은 실제 DOM의 가벼운 JavaScript 객체 버전입니다. 먼저 메모리 안에서 트리를 비교하고, 변경된 부분만 실제 DOM에 반영하면 불필요한 DOM 접근을 줄일 수 있습니다.

## 브라우저 렌더링 과정 간단 설명

브라우저는 일반적으로 아래 흐름으로 화면을 만듭니다.

1. HTML 파싱
2. DOM 트리 생성
3. CSS 파싱
4. Render Tree 생성
5. Layout 계산
6. Paint
7. Composite

실제 DOM을 자주 건드리면 Layout과 Paint가 다시 일어날 수 있어서 비용이 커집니다.

## 실제 DOM이 느린 이유

실제 DOM이 느린 이유는 단순히 "API가 느리다"기보다, DOM 변경이 브라우저 렌더링 파이프라인과 연결되어 있기 때문입니다.

- Reflow: 요소 크기, 위치, 배치가 다시 계산됩니다.
- Repaint: 색, 텍스트, 배경처럼 보이는 부분이 다시 그려집니다.

따라서 DOM을 자주 직접 수정하는 것보다, 먼저 메모리 상의 Virtual DOM을 비교한 뒤 최소 수정만 적용하는 전략이 유리합니다.

## Virtual DOM 구조 설명

이 프로젝트는 아래 두 형태만 사용합니다.

```js
{
  nodeType: "ELEMENT",
  tag: "div",
  props: {
    id: "card",
    class: "panel",
    "data-role": "product"
  },
  children: []
}
```

```js
{
  nodeType: "TEXT",
  text: "Hello"
}
```

규칙:

- 공백만 있는 text node는 무시
- 주석 노드는 무시
- 속성은 일반 객체에 저장
- childNodes를 재귀 순회해 트리를 구성
- boolean 속성(`disabled`, `checked`, `selected`)은 `true` / 제거 방식으로 처리

## 핵심 함수

### DOM / VDOM 변환

- `parseHTMLToDOM(htmlString)`: HTML 문자열을 DOM으로 파싱하고 `script`, `on*` 속성을 제거합니다.
- `domToVirtualDOM(node)`: 실제 DOM을 재귀 순회해 Virtual DOM 객체를 만듭니다.
- `renderVirtualDOM(vNode)`: Virtual DOM 객체를 실제 DOM 노드로 렌더링합니다.
- `virtualDOMToHTML(vNode)`: Virtual DOM을 다시 HTML 문자열로 직렬화합니다.

### Diff 알고리즘

- `diff(oldVNode, newVNode, path = [])`: 두 Virtual DOM을 비교해 Patch 목록을 반환합니다.
- `diffProps(oldProps, newProps)`: 속성 단위의 추가/삭제/변경을 계산합니다.

### Patch 적용

- `applyPatches(rootElement, patches)`: Patch를 실제 DOM에 반영합니다.
- `getNodeByPath(rootElement, path)`: path 배열로 특정 실제 DOM 노드를 찾습니다.

### State History

- `pushHistory(vNode)`: 새 상태를 history에 저장합니다.
- `restoreHistory(index)`: 특정 history 상태를 통째로 복원합니다.
- `cloneVNode(vNode)`: history 저장 시 깊은 복사를 수행합니다.

### UI 제어

- `handlePatch()`
- `handleUndo()`
- `handleRedo()`
- `updateHistoryUI()`
- `renderDiffLog(patches)`
- `renderVDOMPreview(vNode)`

## Diff 5가지 핵심 케이스 설명

이 프로젝트의 Diff 알고리즘은 아래 5가지 케이스를 처리합니다.

1. `ADD`
   새 자식 노드가 생긴 경우
2. `REMOVE`
   기존 자식 노드가 사라진 경우
3. `REPLACE`
   노드 타입 또는 태그가 달라서 통째 교체해야 하는 경우
4. `TEXT`
   텍스트 노드 내용만 변경된 경우
5. `PROPS`
   속성 추가/삭제/변경이 필요한 경우

예시 Patch:

```js
[
  { type: "TEXT", path: [0, 1], text: "새 문구" },
  { type: "PROPS", path: [0], set: { class: "active" }, remove: ["disabled"] },
  { type: "ADD", path: [0], index: 2, node: { nodeType: "ELEMENT", tag: "li", props: {}, children: [] } },
  { type: "REMOVE", path: [0], index: 1 },
  { type: "REPLACE", path: [0, 0], node: { nodeType: "ELEMENT", tag: "div", props: {}, children: [] } }
]
```

## Patch 반영 방식 설명

Patch 버튼을 누르면 아래 순서로 동작합니다.

1. textarea의 HTML 문자열 읽기
2. 브라우저 DOM으로 파싱
3. 새 Virtual DOM 생성
4. 이전 Virtual DOM과 Diff 수행
5. 실제 DOM에 Patch 적용
6. 현재 상태 갱신
7. history 저장
8. Diff 로그와 Virtual DOM 미리보기 갱신

중요한 점은 일반적인 Patch에서는 전체를 다시 렌더링하지 않고, 필요한 노드만 찾아서 수정한다는 것입니다.

## History 동작 방식 설명

- 초기 로드 시 `history[0]` 에 초기 상태 저장
- Patch 성공 시 새 상태를 history에 추가
- Undo 시 index 감소
- Redo 시 index 증가
- Undo 후 새 Patch를 하면 future history 삭제
- Undo / Redo 는 안정성을 위해 실제 DOM을 통째 재렌더링
- 복원 시 textarea도 함께 동기화

즉, Patch는 부분 업데이트, History 복원은 전체 업데이트 전략을 사용합니다.

## 사용한 브라우저 API

- `document.createElement`
- `template.innerHTML`
- `childNodes`
- `attributes`
- `MutationObserver`
- `Node.TEXT_NODE`
- `Node.ELEMENT_NODE`
- `replaceWith`
- `insertBefore`
- `removeChild`

## 테스트 케이스 및 검증 결과

아래 테스트는 화면 체크리스트와 함께 바로 확인할 수 있습니다.

1. 텍스트만 변경
   `li` 또는 `p` 내부 문구를 바꾸고 Patch
   결과: `TEXT` Patch 생성
2. 속성만 변경
   `class`, `id`, `data-*`, `href` 변경
   결과: `PROPS` Patch 생성
3. 새 노드 추가
   `ul` 안에 새 `li` 추가
   결과: `ADD` Patch 생성
4. 노드 삭제
   기존 `li` 하나 삭제
   결과: `REMOVE` Patch 생성
5. 태그 타입 변경
   `p` 를 `div` 로 변경
   결과: `REPLACE` Patch 생성
6. 중첩 자식 노드 변경
   `strong` 또는 `span` 텍스트 변경
   결과: 깊은 path의 `TEXT` 또는 `REPLACE`
7. disabled 속성 변경
   disabled 제거 또는 추가
   결과: `PROPS` Patch에서 boolean 속성 반영
8. Undo / Redo 동작
   여러 번 Patch 후 뒤로가기 / 앞으로가기
   결과: 실제 영역과 textarea 모두 복원
9. Undo 후 새 Patch
   Undo 한 뒤 다른 변경 적용
   결과: 기존 future history 삭제
10. MutationObserver 로그
    Patch 후 추가/삭제/속성/텍스트 변경 로그 확인
    결과: 사람이 읽기 쉬운 요약 메시지 출력

## 잘못된 HTML 입력 처리

- 브라우저는 잘못된 HTML을 자동 보정할 수 있습니다.
- 예를 들어 닫히지 않은 태그나 중첩 규칙이 틀린 태그는 파서가 구조를 바꿔서 해석할 수 있습니다.
- 이 데모는 파싱 후 정규화된 결과를 textarea에 다시 보여주므로, 실제 반영된 구조를 확인할 수 있습니다.

## 현재 구현의 한계점

1. 리스트 비교는 `key` 기반이 아니라 index 기반입니다.
2. 복잡한 리스트 재정렬은 최적화하지 않았습니다.
3. 스타일 속성은 문자열 전체 비교만 수행합니다.
4. HTML 직렬화 결과는 브라우저 파서에 따라 원본 입력과 다를 수 있습니다.
5. 이벤트 핸들러 문자열 속성(`onclick` 등)은 보안상 무시합니다.
6. `script` 태그는 제거합니다.
7. Undo / Redo 는 안정성을 위해 전체 재렌더링을 허용합니다.

## 실행 방법

1. 프로젝트 폴더에서 `index.html` 을 브라우저로 엽니다.
2. 좌측 실제 영역에 초기 샘플 HTML이 렌더링됩니다.
3. 우측 textarea에서 HTML을 수정합니다.
4. `Patch` 버튼을 눌러 Diff와 Patch 결과를 확인합니다.
5. `뒤로가기`, `앞으로가기` 버튼으로 history를 확인합니다.

## 발표용 1분 요약

"이 프로젝트는 React의 핵심 개념인 Virtual DOM과 Diff 알고리즘을 Vanilla JavaScript로 직접 구현한 데모입니다. 먼저 HTML 문자열이나 실제 DOM을 재귀적으로 읽어 Virtual DOM 객체 트리로 바꾸고, 이전 상태와 새 상태를 비교해 ADD, REMOVE, REPLACE, TEXT, PROPS 다섯 종류의 Patch를 만듭니다. 그리고 이 Patch만 실제 DOM에 적용해서 전체를 다시 그리지 않고 필요한 부분만 업데이트합니다. 추가로 상태를 history 배열에 저장해서 Undo/Redo를 지원하고, MutationObserver로 실제 DOM 변경까지 눈으로 확인할 수 있게 했습니다. 현재 구현은 key 없이 index 기반 비교를 사용하기 때문에 복잡한 리스트 재정렬에는 한계가 있지만, Virtual DOM의 핵심 흐름을 설명하기에는 충분한 구조입니다."
