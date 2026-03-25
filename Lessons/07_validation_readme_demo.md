# M7. Validation, README, Demo Prep

## 1. 오늘의 목표
- 테스트와 수동 스모크 체크를 발표 가능한 형태로 정리한다.
- README를 발표용 기준 문서로 다시 구성한다.
- 4분 데모 흐름과 예상 질문을 정리해 마지막 발표 준비 자산을 만든다.

## 2. 왜 이 단계를 지금 하는가
- 핵심 알고리즘은 M6까지 구현이 끝났으므로, 이제는 “무엇을 만들었는지”보다 “어떻게 검증했고 어떻게 설명할지”가 중요하다.
- 공식 요구사항에서도 README 기준 발표와 테스트/검증 흔적을 강조한다.
- 이 단계가 있어야 구현물이 단순 코드가 아니라 발표 가능한 프로젝트 산출물로 마무리된다.

## 3. 이번 주차 키워드와 연결
- `tree`: README와 발표에서도 결국 DOM/VDOM을 트리 문제로 설명해야 한다.
- `dfs`: 핵심 알고리즘 설명을 `domToVNode`, `vNodeToDom`, `diff`, `applyPatch` 중심으로 다시 정리하는 단계다.
- `graph_basic`: history와 identity를 “관계와 시점” 관점으로 다시 설명 자산에 녹였다.
- `bst`: key/tag 규칙이 비교 비용을 줄인다는 점을 발표용 설명으로 명확히 정리한다.

## 4. 구현 전에 확인한 개념
- M7은 새 알고리즘 추가보다 검증 흔적과 설명 자산 정리가 핵심이다.
- README는 단순 설치 문서가 아니라 4분 발표를 이끌 수 있어야 한다.
- 테스트는 자동 테스트와 수동 스모크 체크를 분리해 기록하는 편이 읽기 쉽다.

## 5. 구현 계획
- `README.md`를 발표 중심 구조로 다시 쓴다.
- `tests/SMOKE_CHECKLIST.md`에 수동 검증 시나리오를 남긴다.
- `Lessons/07_validation_readme_demo.md`에 이번 단계의 이유, 검증, 발표 준비 포인트를 기록한다.

## 6. 실제 구현 방식
- README에 프로젝트 소개, 데모 시나리오, 핵심 알고리즘 설명, 키워드 연결, 설계 선택, 검증, 4분 데모 스크립트, 예상 질문을 넣었다.
- 자동 테스트는 `npm test` 하나로 정리하고, 각 테스트 파일이 무엇을 검증하는지 README에 적었다.
- 수동 검증은 `tests/SMOKE_CHECKLIST.md`로 분리해 브라우저에서 바로 따라할 수 있게 만들었다.
- 발표 Q&A는 구현한 범위와 의도적으로 제외한 범위를 기준으로 준비했다.

## 7. 구현 후 달라진 점
- 이전 상태: README는 현재 상태 요약과 간단한 구조 소개 중심이었다.
- 현재 상태: README 하나로 프로젝트 소개, 알고리즘, 검증, 데모 순서, 예상 질문까지 설명 가능해졌다.
- 눈으로 확인 가능한 변화: 발표자가 README를 위에서 아래로 읽으며 그대로 데모 순서를 따라갈 수 있다.

## 8. 검증 방법과 결과
- `npm test` 실행으로 현재 unit test 세트가 모두 통과했다.
- `node --check src/main.js`, `node --check src/diff/diff.js`, `node --check src/patch/applyPatch.js`, `node --check src/history/snapshotHistory.js`를 확인했다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답이 `HTTP/1.0 200 OK`였다.
- 수동 검증 시나리오는 `tests/SMOKE_CHECKLIST.md`에 정리했다.

## 9. 놓친 점 / 엣지 케이스
- README와 스모크 체크는 정리됐지만, 실제 발표 리허설은 사람 손으로 한 번 더 맞춰야 한다.
- browser automation 기반 E2E 테스트는 아직 없다.
- MOVE 최적화, inverse patch undo, scheduler는 여전히 범위 밖이다.

## 10. 더 도전하려면
- Playwright 같은 도구로 smoke checklist 일부를 자동화할 수 있다.
- README에 GIF 또는 스크린샷을 추가해 발표 전 시각 자료를 보강할 수 있다.

## 11. 다음 단계
- 필수 마일스톤 기준으로는 이번 단계가 마무리다.
- 이후에는 리허설, 코드 정리, UI polish 같은 선택 개선만 남는다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 이 프로젝트의 source of truth를 실제 DOM이 아니라 현재 VDOM snapshot으로 봐야 할까?
- 왜 key를 성능 문제가 아니라 identity 문제로 설명해야 할까?
- 왜 전체 rerender보다 diff + patch + history 흐름으로 설명하는 것이 React와 더 닮아 있을까?
