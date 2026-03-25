# M5. History Snapshot

## 1. 오늘의 목표
- patch 후 만들어진 VDOM snapshot을 history에 저장한다.
- `Back` / `Forward`로 snapshot cursor를 이동하며 actual area와 test area를 함께 바꾼다.
- undo 후 새 patch를 만들면 미래 snapshot이 버려지는 규칙을 구현한다.

## 2. 왜 이 단계를 지금 하는가
- M4까지는 한 번 patch를 적용하면 이전 상태로 돌아갈 방법이 없었다.
- 공식 요구사항에는 뒤로가기/앞으로가기로 실제 영역과 테스트 영역이 함께 바뀌어야 한다고 명시돼 있다.
- snapshot history가 붙어야 “현재 기준 상태는 현재 snapshot VDOM”이라는 아키텍처가 완성된다.

## 3. 이번 주차 키워드와 연결
- `tree`: history는 여러 시점의 VDOM tree를 배열로 저장하는 구조다.
- `graph_basic`: 복잡한 역연산보다 “snapshot 배열 + cursor 이동”으로 상태 전환을 단순화한다.
- `dfs`: snapshot 자체는 DFS로 읽고 렌더한 트리 결과물이다.
- `topological_sort`: 필수 구현은 아니지만, state transition을 순서 있게 다룬다는 점에서 확장 감각을 준다.

## 4. 구현 전에 확인한 개념
- undo/redo는 inverse patch보다 snapshot 방식이 짧은 프로젝트에서 설명과 구현이 단순하다.
- history에 넣는 값은 HTML 문자열이 아니라 VDOM snapshot이고, textarea는 필요할 때 snapshot을 다시 HTML로 직렬화해 동기화한다.
- back/forward 시 현재 미저장 입력보다 snapshot이 우선하므로 textarea 내용도 snapshot 기준으로 덮어쓴다.
- actual DOM은 렌더 대상이지 장기 상태 저장소가 아니므로, source of truth를 snapshot VDOM으로 두는 규칙을 분명히 해야 한다.
- history에 저장한 snapshot을 그대로 돌려주지 않고 clone해서 반환해야, 이후 화면 갱신 중 원본 history 데이터가 우발적으로 바뀌지 않는다.

## 5. 구현 계획
- `src/history/snapshotHistory.js`에 history store와 cursor 이동 함수를 만든다.
- `src/model/vnode.js`에 snapshot clone 유틸을 추가한다.
- `src/main.js`에서 patch 성공 시 snapshot을 push하고, `Back` / `Forward` 버튼은 해당 snapshot으로 actual area와 preview, textarea를 동기화한다.
- `tests/history.test.js`로 cursor 이동과 future discard를 검증한다.

## 6. 실제 구현 방식
- history store는 `snapshots` 배열과 `cursor`를 가진다.
- `createSnapshotHistory()`는 초기 baseline VDOM을 첫 snapshot으로 저장한다.
- `pushSnapshot()`은 현재 cursor 뒤의 future snapshot을 잘라 낸 뒤 새 snapshot을 push하고, history 내부에는 clone을 저장한다.
- `goBack()` / `goForward()`는 cursor를 이동시키고 해당 snapshot의 clone을 반환한다.
- `vNodeTreeToHtml()`로 snapshot VDOM을 textarea용 HTML 문자열로 다시 만든다.
- history navigation 시 actual area는 snapshot VDOM으로 다시 렌더하고, preview와 textarea, VDOM inspector도 같은 snapshot 기준으로 함께 갱신한다.
- 이때 textarea는 source of truth가 아니라 “다음 상태를 만들 재료”이므로, 사용자가 방금 입력하던 미저장 값보다 snapshot HTML이 우선한다.
- patch 성공 시 baseline VDOM을 현재 입력으로 전진시키고, 같은 VDOM을 history에도 저장한다.

## 7. 구현 후 달라진 점
- 이전 상태: `Back` / `Forward`는 placeholder 문구만 보여 줬다.
- 현재 상태: patch 후 snapshot이 저장되고, 버튼으로 시점 이동이 가능하다.
- 눈으로 확인 가능한 변화: patch를 여러 번 만든 뒤 `Back` / `Forward`를 누르면 actual area와 textarea/preview가 함께 바뀐다.

## 8. 검증 방법과 결과
- `node tests/history.test.js` 실행 결과 `Passed 5 history test case(s).`가 출력됐다.
- `npm test` 실행으로 `domToVNode`, `vNodeToDom`, `diff`, `applyPatch`, `history` 테스트가 모두 통과했다.
- `node --check src/main.js`, `node --check src/history/snapshotHistory.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답은 `HTTP/1.0 200 OK`였다.
- 브라우저 수동 스모크에서는 patch 3회 후 `Back` 2회, `Forward` 1회, undo 후 새 patch로 redo 불가를 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- snapshot 수가 아주 많아지면 메모리 사용량이 늘 수 있다.
- 현재는 snapshot 비교 중복 제거가 없어서 같은 상태를 여러 번 patch하면 중복 snapshot이 쌓일 수 있다.
- redo/undo는 snapshot rerender 방식이라 inverse patch 기반 최적화는 하지 않는다.
- textarea에서 타이핑 중이던 미저장 입력은 history 이동 시 사라진다. 이는 현재 구조에서 snapshot 일관성을 우선한 선택이다.

## 10. 더 도전하려면
- history panel에 각 snapshot의 요약 정보를 목록으로 보여 줄 수 있다.
- snapshot 저장 개수를 제한하거나 동일 상태 중복 저장을 막는 정책을 추가할 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M6. data-key 기반 identity`다.
- 이유는 이제 diff/patch/history의 기본 흐름이 갖춰졌으므로, 리스트 변경에서 같은 항목을 어떻게 인식할지 정체성 규칙을 강화할 차례이기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 undo/redo를 inverse patch가 아니라 snapshot 배열 + cursor 이동으로 구현하면 설명이 쉬울까?
- 왜 history에 HTML 문자열 대신 VDOM snapshot을 저장하는 것이 이 프로젝트 구조와 더 잘 맞을까?
- 왜 undo 뒤 새 patch를 만들면 미래 snapshot을 버려야 할까?
