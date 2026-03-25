# Post-M7. Explanation Reinforcement

## 1. 오늘의 목표
- 구현은 끝난 상태에서, 발표와 Q&A에서 막히기 쉬운 핵심 설명 공백을 문서에 보강한다.
- 특히 `root/path`, text node 규칙, `REORDER`의 의미, snapshot source of truth를 README와 Lesson 문서에 더 분명히 남긴다.

## 2. 왜 이 단계를 지금 하는가
- 동작하는 프로젝트와 설명 가능한 프로젝트는 다르다.
- 구현이 끝난 뒤에는 버그 수정보다 “왜 이렇게 설계했는가”를 말로 복원할 수 있는지가 더 중요하다.
- 이번 보강이 없으면 발표에서 함수 이름은 말해도 설계 이유를 이어서 설명하지 못할 가능성이 컸다.

## 3. 이번 주차 키워드와 연결
- `tree`: `root` wrapper, path, snapshot 모두 트리를 다루기 위한 설명 자산이다.
- `dfs`: `domToVNode`, `diff`, `applyPatch`가 왜 DFS 흐름인지 문서에 더 명확히 드러냈다.
- `graph_basic`: history cursor와 identity 규칙을 “관계와 시점” 관점으로 다시 정리했다.
- `bst`: `same tag`, `same key` 같은 규칙이 비교를 줄여 준다는 점을 설명 자산으로 보강했다.

## 4. 구현 전에 확인한 개념
- 이 단계의 핵심은 코드 변경이 아니라 설명 공백 제거다.
- 핵심 로직을 바꾸지 않고, 이미 구현된 함수의 책임과 설계 이유를 문서에 맞추는 것이 우선이다.
- Lesson 보강은 기존 마일스톤 문서를 덮어쓰는 것이 아니라, 빠진 설명을 누적 보완하는 방식이 더 좋다.

## 5. 구현 계획
- `README.md`에 설계 이유와 한계 설명을 추가한다.
- `Lessons/01`, `03`, `04`, `05`, `06`에 발표에서 자주 막히는 지점을 보강한다.
- 이번 설명 보강 작업 자체도 별도 Lesson으로 기록한다.

## 6. 실제 구현 방식
- README에 synthetic `root`, `childNodes` 사용 이유, same node vs same content, `REORDER`의 제한, snapshot source of truth, DOMParser 보정과 keyed fallback 한계를 추가했다.
- `Lessons/01_vnode_and_dom_reading.md`에는 `childNodes`와 DOMParser 보정, 공백 text 규칙을 더 직접적으로 적었다.
- `Lessons/03_diff_core.md`에는 `isSameNode()`가 identity 판정이라는 점과 text node가 `TEXT` patch로 가는 이유를 보강했다.
- `Lessons/04_patch_application.md`에는 remove ordering 예시와 `REORDER`의 localized rerender 의미를 넣었다.
- `Lessons/05_history_snapshot.md`에는 clone, source of truth, textarea overwrite 이유를 보강했다.
- `Lessons/06_data_key_identity.md`에는 mixed keyed/unkeyed fallback과 duplicate key가 identity 붕괴라는 설명을 추가했다.

## 7. 구현 후 달라진 점
- 이전 상태: 구현은 보이지만 “왜 이렇게 했는가” 설명은 일부 문서에서 짧거나 암묵적이었다.
- 현재 상태: 발표/Q&A에서 막히기 쉬운 설계 이유가 README와 Lessons에 더 직접적으로 적혀 있다.
- 눈으로 확인 가능한 변화: README 한계 섹션과 각 Lesson의 구현 전/실제 구현 방식/질문 항목이 더 구체적이 됐다.

## 8. 검증 방법과 결과
- 문서 보강 후 `npm test`를 다시 실행해 기존 구현 상태가 유지되는지 확인한다.
- 이 단계는 핵심 로직을 바꾸지 않았으므로, 테스트 재통과를 안정성 확인 기준으로 삼는다.
- 발표 전에는 README와 보강된 Lesson 질문을 소리 내어 한 번 설명해 보면 효과가 크다.

## 9. 놓친 점 / 엣지 케이스
- 문서를 보강해도 실제 발표에서 답변이 자연스럽게 나오려면 한 번은 입으로 리허설해야 한다.
- README가 길어질수록 발표용 핵심 문장과 세부 설명을 구분해 읽는 습관이 필요하다.
- 브라우저 특수성(property vs attribute, focus 보존 등)은 여전히 선택 확장 범위다.

## 10. 더 도전하려면
- README에 상태 흐름 다이어그램이나 path 예시 그림을 넣을 수 있다.
- 예상 질문 10개에 대한 1~2문장 모범 답안을 별도 문서로 정리할 수 있다.

## 11. 다음 단계
- 공식 마일스톤과 설명 보강까지 끝났으므로, 다음 가장 작은 단계는 실제 4분 발표 리허설이다.
- 그 다음 선택 단계는 preset smoke flow 일부를 브라우저 자동화로 옮기는 것이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 `root` wrapper가 diff와 patch path 설명을 쉽게 만들어 줄까?
- 왜 text node는 identity와 content 비교를 분리해서 설명해야 할까?
- 왜 `REORDER` patch를 “최적화된 move”가 아니라 “학습용 절충안”이라고 말하는 편이 정확할까?
