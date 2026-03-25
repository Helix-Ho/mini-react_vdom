# Post-M7. Preset-Based Smoke Flow

## 1. 오늘의 목표
- demo preset 버튼을 기준으로 수동 스모크 체크와 발표 데모 순서를 더 짧고 안정적으로 만든다.
- 사람이 매번 textarea를 직접 수정하지 않아도 같은 diff/patch/history 시나리오를 재현할 수 있게 문서를 고정한다.

## 2. 왜 이 단계를 지금 하는가
- 프리셋 UI를 만들었어도 검증 문서와 발표 문서가 예전 “직접 수정” 흐름에 머물러 있으면 실제 리허설 때 다시 흔들린다.
- 공식 요구사항은 테스트/검증 흔적과 README 중심 발표를 강조하므로, UI와 문서가 같은 시나리오를 가리켜야 한다.
- 이 단계가 있어야 “어떤 버튼을 누르고 무엇을 기대해야 하는지”가 빠르게 공유된다.

## 3. 이번 주차 키워드와 연결
- `tree`: 각 프리셋은 서로 다른 트리 변화를 재현하는 고정 입력이다.
- `dfs`: 같은 입력을 반복하면 `domToVNode`, `diff`, `applyPatch`의 DFS 흐름을 더 안정적으로 설명할 수 있다.
- `graph_basic`: history는 시점 이동이므로, preset 기반 리허설은 cursor 변화까지 반복 검증하는 데 유리하다.
- `bst`: `same tag`, `same key` 규칙이 바뀌는 상황을 정해진 버튼으로 바로 비교할 수 있다.

## 4. 구현 전에 확인한 개념
- 검증 문서는 “무엇을 입력해야 하는가”보다 “어떤 시나리오를 재현해야 하는가”가 더 중요하다.
- 발표 스크립트와 smoke checklist가 서로 다른 순서를 쓰면 실제 데모가 늘어진다.
- docs만 바꾸는 단계라도 기존 자동 테스트를 다시 돌려 현재 상태가 안정적인지 확인하는 습관이 필요하다.

## 5. 구현 계획
- `tests/SMOKE_CHECKLIST.md`를 preset 이름 기준으로 다시 쓴다.
- `README.md`의 데모 시나리오와 4분 스크립트를 preset 기반 흐름으로 맞춘다.
- `Lessons/09_preset_smoke_flow.md`에 왜 이런 문서 정리가 필요한지 남긴다.

## 6. 실제 구현 방식
- smoke checklist에 `Reset Baseline`, `Text + Attr`, `Insert Child`, `Keyed Reorder`, `Duplicate Key`를 직접 적어 단계별 기대 결과를 고정했다.
- README의 데모 시나리오와 4분 스크립트도 같은 preset 이름을 쓰게 맞췄다.
- Lesson 목록에 post-M7 기록 파일을 추가해 발표 보조 단계도 복습 가능하게 했다.

## 7. 구현 후 달라진 점
- 이전 상태: 문서가 “textarea를 직접 수정한다”는 추상적 설명에 머물러 있어서 실제 데모 순서가 사람마다 달라질 수 있었다.
- 현재 상태: 어떤 preset을 눌러 어떤 patch/warning/history 변화를 보여 줄지 문서에 고정됐다.
- 눈으로 확인 가능한 변화: smoke checklist와 README에서 preset 이름이 그대로 보이고, 데모 순서가 더 짧아졌다.

## 8. 검증 방법과 결과
- `npm test`를 다시 실행해 문서 정리 후에도 현재 구현 상태가 그대로 유지되는지 확인한다.
- 문법이나 런타임 코드는 바꾸지 않았으므로 추가 JS 검증은 필요 없고, 기존 테스트 통과를 기준으로 삼는다.
- 필요하면 브라우저에서 `Reset Baseline -> Text + Attr -> Patch`, `Reset Baseline -> Keyed Reorder -> Patch` 두 흐름만 수동 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- smoke checklist는 여전히 수동 문서이므로 실제 클릭 실수를 자동으로 막아 주지는 못한다.
- preset 이름이 바뀌면 README와 checklist도 함께 유지보수해야 한다.
- 브라우저 자동화 기반 E2E는 아직 없다.

## 10. 더 도전하려면
- preset 기반 smoke flow를 Playwright 같은 도구로 자동화할 수 있다.
- README에 preset별 GIF나 스크린샷을 붙여 발표 직전 복습 속도를 높일 수 있다.

## 11. 다음 단계
- 공식 마일스톤과 발표 보조 문서까지 정리됐으므로, 이후 가장 작은 선택 단계는 preset smoke flow 일부를 자동화하는 것이다.
- 그 전까지는 현재 문서 기준으로 4분 리허설을 한 번 실제로 맞춰 보는 것이 더 가치 있다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 프리셋 UI를 만들고도 smoke checklist와 README를 따로 다시 맞춰야 할까?
- 왜 “직접 수정”보다 “정해진 preset 순서”가 발표 데모를 더 안정적으로 만들어 줄까?
- history 데모에서 `Reset Baseline`을 먼저 두는 이유는 무엇일까?
