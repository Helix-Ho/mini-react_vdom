# M0. Project Skeleton

## 1. 오늘의 목표
- 실제 영역, 테스트 입력, 테스트 미리보기, 버튼, patch log가 보이는 최소 화면을 만든다.
- 샘플 HTML 문자열을 보관하고 초기 화면에 주입하는 엔트리 파일을 만든다.
- 이후 `domToVNode`, `diff`, `applyPatch`, history가 붙을 자리를 먼저 고정한다.

## 2. 왜 이 단계를 지금 하는가
- 공식 요구사항의 필수 UI가 먼저 있어야 이후 알고리즘을 어디에 연결할지 흔들리지 않는다.
- M1의 DOM 읽기와 M2의 초기 동기화도 결국 어떤 영역을 기준 상태로 볼지 먼저 정해야 안정적으로 구현된다.
- M0를 건너뛰면 이후 모든 마일스톤에서 UI 구조와 알고리즘을 동시에 바꾸게 되어 설명도 구현도 불안정해진다.

## 3. 이번 주차 키워드와 연결
- `tree`: 실제 영역과 테스트 미리보기는 같은 트리를 서로 다른 시점에 보여 주는 자리다.
- `dfs`: 아직 구현 전이지만 `domToVNode`, `vNodeToDom`, `diff`, `applyPatch`가 들어갈 입출력 위치를 먼저 확보했다.
- `graph_basic`: history를 복잡한 역연산 대신 시점 배열과 현재 포인터로 설명할 준비 단계다.
- `bst`: 이후 `same tag`, `same key` 같은 비교 규칙을 둘 수 있도록 구조를 먼저 고정했다.

## 4. 구현 전에 확인한 개념
- 1차 버전 입력 방식은 `textarea + DOMParser`가 가장 단순하다.
- M0에서는 알고리즘보다 연결 지점을 먼저 만드는 것이 중요하다.
- whitespace-only text node 문제를 줄이기 위해 샘플 HTML은 한 줄 문자열로 시작한다.

## 5. 구현 계획
- `index.html`에 필수 영역과 버튼을 배치한다.
- `src/main.js`에 샘플 HTML, DOM 참조, 초기 렌더, placeholder 버튼 핸들러를 둔다.
- `src/styles.css`에 레이아웃과 패널 구분 스타일을 만든다.
- `README.md`에 실행 방법과 현재 상태를 적는다.

## 6. 실제 구현 방식
- 샘플 HTML은 `data-key`를 포함한 단일 문자열로 두고 실제 영역과 테스트 입력의 초기값으로 사용했다.
- 테스트 입력은 `textarea`로 두고 `DOMParser`로 파싱한 결과를 테스트 미리보기에 바로 보여 준다.
- `Patch` 버튼은 아직 실제 DOM을 바꾸지 않고 patch log에 placeholder 이벤트만 남긴다.
- `Back`, `Forward`는 M5 전까지 disabled 상태로 유지한다.
- patch log는 사람이 읽을 수 있는 문장형 이벤트를 최근 순으로 보이게 했다.

## 7. 구현 후 달라진 점
- 이전 상태: 문서만 있고 실행 가능한 화면이 없었다.
- 현재 상태: 브라우저에서 열 수 있는 정적 앱 뼈대가 생겼다.
- 눈으로 확인 가능한 변화: 실제 영역, 테스트 입력, 테스트 미리보기, 버튼, patch log가 모두 화면에 보인다.

## 8. 검증 방법과 결과
- `node --check src/main.js` 실행 결과 문법 오류가 없었다.
- `python3 -m http.server 4173`로 정적 서버를 띄운 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답이 `HTTP/1.0 200 OK`였다.
- 자동 브라우저 테스트는 아직 없으므로, textarea 입력 변경에 따라 테스트 미리보기가 바뀌는지와 `Patch` 클릭 시 placeholder 로그가 쌓이는지는 브라우저 수동 스모크 체크 대상으로 남겼다.

## 9. 놓친 점 / 엣지 케이스
- 현재는 보안이나 HTML sanitization이 목적이 아니므로 textarea 입력을 그대로 미리보기에 렌더한다.
- 잘못된 HTML도 `DOMParser`가 자동 보정할 수 있으므로, M1에서 파싱 규칙 설명을 더 보강해야 한다.
- 실제 diff와 history가 아직 없어서 `Patch`, `Back`, `Forward`는 학습용 자리만 마련한 상태다.

## 10. 더 도전하려면
- patch log에 path나 node count를 시각적으로 더 보여 줄 수 있다.
- 테스트 입력 아래에 normalized HTML 출력 패널을 추가해 DOMParser 보정 결과를 비교할 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M1. VNode shape + DOM/HTML 읽기`다.
- 이유는 현재 확보된 실제 영역과 테스트 입력을 이용해 `parseHtmlToRoot()`와 `domToVNode()`를 바로 붙일 수 있기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 `contenteditable` 대신 `textarea + DOMParser`를 먼저 선택했는가?
- 왜 M1 전에 실제 영역, 테스트 입력, 테스트 미리보기, 버튼 자리를 먼저 고정했는가?
- 샘플 HTML을 한 줄 문자열로 두는 것이 text node 처리 측면에서 어떤 장점이 있는가?
