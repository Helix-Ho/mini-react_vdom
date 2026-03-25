# M4. Patch Application

## 1. 오늘의 목표
- path 기반 patch 목록을 실제 DOM에 적용하는 `applyPatch()`와 `applyPatches()`를 만든다.
- `Patch` 버튼이 더 이상 patch 계산만 하지 않고 actual area DOM을 실제로 바꾸게 한다.
- patch 적용 후 baseline VDOM을 현재 상태로 전진시켜 다음 diff의 기준으로 삼는다.

## 2. 왜 이 단계를 지금 하는가
- M3에서 patch 목록을 만들 수 있게 됐지만, 아직 실제 DOM은 그대로라서 “최소 변경만 반영한다”는 핵심을 보여 줄 수 없었다.
- M4가 있어야 diff 결과가 실제 화면 변화로 이어지고, M5 history도 “패치 후 snapshot 저장”이라는 흐름으로 자연스럽게 연결된다.
- 이 단계가 끝나면 `Patch` 버튼 하나로 render 계산과 commit 적용을 구분해 설명할 수 있다.

## 3. 이번 주차 키워드와 연결
- `tree`: patch path는 트리의 특정 위치를 가리키는 주소이고, 실제 DOM도 같은 위치를 따라 수정한다.
- `dfs`: diff가 DFS로 patch를 만들었다면, patch 적용은 그 결과를 실제 트리로 되돌리는 단계다.
- `graph_basic`: 노드 identity를 path로 추적하며 부모-자식 관계를 깨지 않고 수정한다.
- `topological_sort`: 1차 구현은 아니지만, remove를 뒤에서부터 적용하는 순서 감각이 왜 필요한지 체감하게 된다.

## 4. 구현 전에 확인한 개념
- root wrapper는 실제 DOM 노드가 아니므로 path는 container의 childNodes를 기준으로 해석해야 한다.
- remove patch는 낮은 index부터 지우면 path가 밀릴 수 있으므로, 높은 index와 더 깊은 path를 먼저 처리해야 한다.
- 예를 들어 같은 부모 아래 `[0]`, `[1]`을 지울 때 `[0]`을 먼저 지우면 원래 `[1]`이 `[0]`으로 당겨져 path가 틀어진다.
- patch 적용 후 baseline VDOM을 현재 VDOM으로 갱신해야 다음 `Patch` 클릭이 누적 diff를 만들지 않는다.

## 5. 구현 계획
- `src/patch/applyPatch.js`에 path 기반 DOM 탐색과 patch 적용 함수를 만든다.
- `src/main.js`에서 `Patch` 클릭 시 diff 결과를 actual area에 적용하고 baseline state를 갱신한다.
- `tests/applyPatch.test.js`로 text/attr/insert/remove/replace를 검증한다.

## 6. 실제 구현 방식
- `getNodeAtPath()`는 root container의 `childNodes`를 따라 내려가며 실제 DOM 노드를 찾는다.
- `INSERT`는 부모 path와 child index를 계산한 뒤 `insertBefore()`로 넣는다.
- `REMOVE`는 target node의 `remove()`를 호출한다.
- `REPLACE`는 target node를 새 VNode로 만든 DOM으로 `replaceWith()` 한다.
- `TEXT`는 target text node의 `textContent`를 바꾼다.
- `SET_ATTR` / `REMOVE_ATTR`는 element node의 attribute를 직접 수정한다.
- 여러 `REMOVE` patch는 path drift를 막기 위해 더 깊고 더 큰 index부터 정렬해서 적용한다.
- `REORDER`는 개별 MOVE patch를 계산하는 대신, 그 부모 아래 keyed child list만 `replaceChildren()`로 다시 맞춘다.
- 그래서 `REORDER`는 “최소 이동 최적화”라기보다 “정체성은 key로 설명하고, 실제 DOM commit은 그 child list를 재구성한다”는 절충안이다.
- patch 적용이 끝나면 actual area DOM은 새 상태가 되고, baseline VDOM도 현재 입력의 VDOM으로 갱신한다.

## 7. 구현 후 달라진 점
- 이전 상태: patch 목록은 보였지만 actual area는 변하지 않았다.
- 현재 상태: `Patch`를 누르면 actual area DOM이 patch 목록대로 바로 바뀐다.
- 눈으로 확인 가능한 변화: textarea를 수정하고 `Patch`를 누르면 actual area가 preview 쪽 구조를 따라간다.

## 8. 검증 방법과 결과
- `node tests/applyPatch.test.js` 실행 결과 `Passed 4 applyPatch test case(s).`가 출력됐다.
- `npm test` 실행으로 `domToVNode`, `vNodeToDom`, `diff`, `applyPatch` 테스트가 모두 통과했다.
- `node --check src/main.js`, `node --check src/patch/applyPatch.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답은 `HTTP/1.0 200 OK`였다.
- 브라우저 수동 스모크에서는 textarea 수정 -> `Patch` 클릭 후 actual area와 preview가 같아지는지 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- 현재는 patch 적용 실패를 복구하는 rollback 로직이 없다.
- 이벤트 핸들러나 property 기반 DOM 업데이트는 아직 다루지 않는다.
- list reorder 최적화는 없어서 index 기반 비교 한계가 그대로 남아 있다.
- `REORDER`는 child DOM을 다시 만들기 때문에 focus, selection, local DOM state 보존까지는 책임지지 않는다.

## 10. 더 도전하려면
- patch 적용 전후 actual area를 직렬화해 diff 결과와 실제 DOM 결과를 비교하는 디버그 체크를 둘 수 있다.
- DOM mutation 단계를 시각적으로 강조해서 commit 단계 데모를 더 선명하게 만들 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M5. History snapshot + Undo/Redo`다.
- 이유는 patch 후 baseline을 갱신하는 흐름이 생겼으므로, 이제 각 시점의 VDOM snapshot을 저장하고 이동하는 단계로 넘어갈 수 있기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 `REMOVE` patch를 path 순서 그대로 적용하지 않고, 더 깊고 더 큰 index부터 적용해야 할까?
- 왜 patch 적용 후 baseline VDOM을 현재 VDOM으로 갱신해야 다음 diff가 올바르게 동작할까?
- 왜 root wrapper path를 실제 DOM container의 childNodes 기준으로 해석해야 할까?
