# M6. data-key Identity

## 1. 오늘의 목표
- 리스트 자식 비교에서 `data-key`를 읽고 같은 항목을 같은 항목으로 매칭한다.
- key가 있을 때 insert/remove가 index 기반 오판으로 무너지지 않게 만든다.
- reorder는 full MOVE 최적화 대신 keyed `REORDER` patch로 처리하고, 그 한계를 명확히 남긴다.

## 2. 왜 이 단계를 지금 하는가
- M5까지는 diff/patch/history 흐름은 완성됐지만, 리스트 항목이 앞에서 삽입되거나 순서가 바뀌면 index 비교 때문에 잘못된 TEXT/REPLACE가 나올 수 있었다.
- 공식/비공식 문맥 모두 `data-key`를 정체성(identity) 규칙으로 다뤄야 한다고 강조한다.
- 이 단계가 있어야 “누가 누구인가”를 유지하면서 리스트 변화를 설명할 수 있다.

## 3. 이번 주차 키워드와 연결
- `tree`: keyed diff도 결국 부모 아래 children 트리 비교 문제다.
- `dfs`: 상위 노드까지는 DFS로 내려가고, 특정 child list에서만 key 기반 matching 규칙을 쓴다.
- `bst`: `same tag`, `same key` 같은 규칙이 비교 대상을 빠르게 정한다는 점에서 규칙 기반 탐색 감각과 닮아 있다.
- `graph_basic`: key는 리스트 항목의 “이 노드가 누구인가”를 알려 주는 identity 라벨이다.

## 4. 구현 전에 확인한 개념
- key는 성능 옵션이 아니라 identity 규칙이다.
- 모든 reorder를 완전한 MOVE 최적화로 풀 필요는 없고, 현재 단계에서는 keyed reorder를 명시적인 `REORDER` patch로 처리해도 된다.
- duplicate key가 있으면 identity 규칙이 깨지므로 경고를 남기고 index 기반 비교로 fallback 하는 편이 안전하다.
- sibling 일부만 keyed이고 일부는 unkeyed이면 “누가 누구인가” 규칙이 리스트 전체에서 일관되지 않으므로, keyed diff를 강제로 켜지 않는 편이 더 안전하다.

## 5. 구현 계획
- `src/diff/diff.js`에 `getNodeKey()`, keyed child diff, warning 수집, `diffWithMeta()`를 추가한다.
- `src/patch/applyPatch.js`에 keyed `REORDER` patch 적용을 추가한다.
- `src/main.js`에서 keyed warning을 patch log에 함께 보여 준다.
- `tests/keyedIdentity.test.js`로 insert/remove/reorder/duplicate key 케이스를 검증한다.

## 6. 실제 구현 방식
- element node의 `props["data-key"]`를 key로 읽는다.
- child list의 모든 항목이 keyed element면 keyed diff 경로를 사용한다.
- mixed keyed/unkeyed child list는 identity 규칙이 불완전하다고 보고 index 기반 diff로 fallback 한다.
- shared key 순서가 유지되면 같은 key끼리 매칭해서 insert/remove를 최소 patch로 만든다.
- shared key 순서가 바뀌면 full MOVE 최적화는 하지 않고 부모 path에 `REORDER` patch를 만든다.
- duplicate key가 감지되면 warning을 남기고 index 기반 diff로 되돌린다. 이 warning의 핵심은 “성능 저하”보다 “identity 붕괴”다.
- UI에서는 keyed reorder나 duplicate key warning을 patch log 상단에 함께 보여 준다.

## 7. 구현 후 달라진 점
- 이전 상태: 리스트 앞 삽입이나 제거가 있으면 surviving item도 index 기준으로 다시 비교될 수 있었다.
- 현재 상태: key가 있으면 surviving item을 같은 item으로 인식하고 insert/remove를 더 안정적으로 만든다.
- 눈으로 확인 가능한 변화: keyed list reorder 시 patch log에 `REORDER` patch와 warning이 뜨고, keyed insert/remove는 불필요한 TEXT churn 없이 처리된다.

## 8. 검증 방법과 결과
- `node tests/keyedIdentity.test.js` 실행 결과 `Passed 4 keyed identity test case(s).`가 출력됐다.
- `npm test` 실행으로 기존 test와 keyed identity test가 모두 통과했다.
- `node --check src/main.js`, `node --check src/diff/diff.js`, `node --check src/patch/applyPatch.js` 모두 통과했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답은 `HTTP/1.0 200 OK`였다.
- 브라우저 수동 스모크에서는 keyed list `[A,B,C] -> [B,A,C]`, keyed insert/remove, duplicate key 입력을 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- full MOVE patch 최적화는 아직 하지 않아서 reorder는 localized rerender 성격의 `REORDER` patch로 처리한다.
- mixed keyed/unkeyed child list는 현재 안전하게 index diff로 fallback 한다.
- duplicate key는 경고만 하고 자동 복구는 하지 않는다.
- keyed child라도 tag가 바뀌면 같은 항목으로 보지 않고 `REPLACE` 또는 `REORDER` 흐름으로 간다. key만 같다고 무조건 같은 node는 아니다.

## 10. 더 도전하려면
- keyed child list에서 더 작은 MOVE patch 집합을 계산하는 실험을 해 볼 수 있다.
- UI에 keyed demo preset 버튼을 두고 no-key case와 나란히 비교할 수 있다.

## 11. 다음 단계
- 다음 마일스톤은 `M7. 테스트, README, 발표 준비`다.
- 이유는 핵심 알고리즘 흐름이 모두 갖춰졌으므로, 이제 검증 흔적과 발표용 설명 자산을 정리할 차례이기 때문이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 key가 없는 리스트에서는 앞 삽입만 있어도 뒤 항목들이 다른 노드처럼 보일 수 있을까?
- 왜 duplicate key가 있으면 identity 규칙이 깨져서 warning을 남겨야 할까?
- 왜 sibling 전체가 keyed일 때만 keyed diff를 켜고, 일부만 keyed면 fallback 하는 편이 안전할까?
- 왜 reorder를 `MOVE`가 아니라 `REORDER` patch로 처리해도 M6의 학습 목표는 달성할 수 있을까?
