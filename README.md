# Mini React VDOM Demo

React의 핵심 개념인 Virtual DOM, Diff, Patch, State History를 Vanilla JavaScript로 직접 구현한 프로젝트입니다.

## 1. 프로젝트 한 줄 소개

브라우저 DOM을 JavaScript 객체 트리인 Virtual DOM으로 바꾸고, 이전 상태와 다음 상태를 비교한 뒤, 변경된 부분만 실제 DOM에 반영하는 과정을 시각적으로 보여주는 데모입니다.

## 2. 우리가 해결하려고 한 문제

브라우저의 실제 DOM은 직접 자주 수정할수록 부담이 커질 수 있습니다.

- DOM 변경은 렌더링과 연결됩니다.
- 변경 내용에 따라 Reflow, Repaint 비용이 발생할 수 있습니다.
- 그래서 전체를 계속 다시 그리기보다, 바뀐 부분만 반영하는 전략이 중요합니다.

이 프로젝트는 그 과정을 직접 구현해서 눈으로 확인하는 데 목적이 있습니다.

## 3. 핵심 기능

### 3-1. DOM / HTML -> Virtual DOM 변환

- HTML 문자열을 파싱해 DOM 구조를 만든 뒤 Virtual DOM으로 변환합니다.
- Element 노드는 `tag`, `props`, `children` 형태로 저장합니다.
- Text 노드는 `nodeType: "TEXT"` 형태로 저장합니다.
- 공백만 있는 텍스트 노드와 comment 노드는 제외합니다.

예시:

```js
{
  nodeType: "ELEMENT",
  tag: "section",
  props: { id: "product-panel", class: "demo-section featured" },
  children: [
    { nodeType: "TEXT", text: "Virtual DOM Demo" }
  ]
}
```

### 3-2. Diff 알고리즘

이전 Virtual DOM과 새 Virtual DOM을 비교해서 Patch 목록을 만듭니다.

현재 구현한 핵심 케이스는 5가지입니다.

1. `TEXT`
텍스트 내용만 바뀐 경우

2. `PROPS`
속성이 추가, 삭제, 변경된 경우

3. `ADD`
새 자식 노드가 생긴 경우

4. `REMOVE`
기존 자식 노드가 제거된 경우

5. `REPLACE`
태그나 노드 타입이 달라서 통째로 교체해야 하는 경우

### 3-3. Patch 적용

- Diff 결과를 실제 DOM에 바로 반영합니다.
- 전체를 다시 렌더하지 않고 path 기반으로 대상 노드를 찾아 수정합니다.
- 텍스트 변경, 속성 변경, 추가, 삭제, 교체를 각각 분리해 적용합니다.

### 3-4. History 관리

- Patch가 성공할 때마다 Virtual DOM 상태를 history에 저장합니다.
- Undo / Redo 버튼으로 특정 상태로 이동할 수 있습니다.
- 실제 영역과 편집 상태를 함께 복원합니다.

### 3-5. 로그 시각화

- Diff Log: 어떤 Patch가 만들어졌는지 보여줍니다.
- Mutation Log: 실제 DOM이 어떻게 바뀌었는지 `MutationObserver`로 보여줍니다.

## 4. 화면 구성

프로젝트 화면은 크게 다음 영역으로 구성되어 있습니다.

- 실제 영역: Patch 결과가 반영되는 DOM
- 미리보기 영역: 현재 입력값을 기준으로 렌더된 예상 결과
- HTML 입력 영역: 사용자가 수정하는 샘플 HTML
- DOM 구조 영역: 현재 Virtual DOM 구조를 JSON으로 표시
- Diff Log: 생성된 Patch 로그
- Mutation Log: 실제 DOM 변경 로그
- 버튼 영역: Undo / Patch / Redo / 테스트 케이스

## 5. 구현 상세

### 주요 함수

- `parseHTMLToDOM(htmlString)`
- `domToVirtualDOM(node)`
- `renderVirtualDOM(vNode)`
- `virtualDOMToHTML(vNode)`
- `diff(oldVNode, newVNode, path)`
- `diffProps(oldProps, newProps)`
- `applyPatches(rootElement, patches)`
- `pushHistory(vNode)`
- `restoreHistory(index)`

### 사용한 브라우저 API

- `document.createElement`
- `template.innerHTML`
- `childNodes`
- `attributes`
- `MutationObserver`
- `replaceWith`
- `insertBefore`
- `removeChild`

## 6. 잘한 점

- Virtual DOM 생성부터 실제 DOM 반영까지 전체 흐름을 직접 구현했습니다.
- Diff 결과를 로그로 보여줘서 설명 가능한 구조를 만들었습니다.
- `MutationObserver`로 실제 DOM 변화까지 검증 가능하게 했습니다.
- Undo / Redo를 통해 상태 관리 흐름도 함께 보여줍니다.
- 테스트 버튼으로 주요 케이스를 빠르게 재현할 수 있습니다.

## 7. 한계와 개선 포인트

- 현재 Diff는 인덱스 기반 비교라 노드 이동이나 리스트 재정렬 최적화에는 한계가 있습니다.
- `key` 기반 비교나 `MOVE` patch는 아직 구현하지 않았습니다.
- 테스트 영역을 실제 DOM 편집 영역으로 확장하면 과제 요구사항과 더 가까워질 수 있습니다.
- 추가적인 엣지 케이스 테스트를 더 보강할 수 있습니다.

## 8. 실행 방법

1. 프로젝트 루트에서 `index.html`을 브라우저로 엽니다.
2. HTML 입력 영역에서 샘플 코드를 수정합니다.
3. `PATCH` 버튼을 눌러 Diff와 Patch 결과를 확인합니다.
4. `UNDO`, `REDO`로 history를 확인합니다.
5. `TEST 1~5` 버튼으로 핵심 케이스를 빠르게 시연합니다.
