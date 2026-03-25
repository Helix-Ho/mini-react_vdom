# Post-M7. Demo Presets

## 1. 오늘의 목표
- 발표와 수동 스모크 체크에서 자주 쓰는 HTML 변경 시나리오를 버튼으로 바로 불러오게 만든다.
- 실제 영역은 그대로 두고, 테스트 입력만 빠르게 바꿔 diff와 patch를 반복 검증하기 쉽게 만든다.

## 2. 왜 이 단계를 지금 하는가
- 공식 마일스톤은 M7에서 끝났지만, 발표와 검증은 같은 입력을 여러 번 재현할 수 있어야 안정적이다.
- textarea에 매번 HTML을 다시 붙여 넣으면 실수 가능성이 크고, 어떤 변화를 시연하려는지 흐려진다.
- 이 보조 단계가 있으면 diff 5케이스, history, data-key 동작을 짧은 데모 흐름으로 반복할 수 있다.

## 3. 이번 주차 키워드와 연결
- `tree`: 각 프리셋은 서로 다른 트리 변화 시나리오를 빠르게 재현하는 입력 세트다.
- `dfs`: 프리셋을 바꾸면 결국 `domToVNode`, `diff`, `applyPatch`의 DFS 흐름을 다시 확인하게 된다.
- `graph_basic`: history snapshot으로 되돌아간 뒤 다른 프리셋을 다시 적용하며 시점 이동을 더 명확히 본다.
- `bst`: `same tag`, `same data-key` 규칙이 바뀐 시나리오를 버튼으로 바로 비교할 수 있다.

## 4. 구현 전에 확인한 개념
- 발표 보조 기능이므로 핵심 알고리즘은 건드리지 않고 UI 연결만 최소 수정하는 편이 안전하다.
- 프리셋은 실제 영역을 즉시 바꾸면 안 되고, textarea와 preview만 먼저 바꾼 뒤 Patch에서 반영돼야 흐름이 유지된다.
- 반복 가능한 데모를 위해서는 원본 sample snapshot으로 돌아가는 Reset Baseline 버튼이 꼭 필요하다.

## 5. 구현 계획
- `index.html`에 demo preset 영역을 추가한다.
- `src/main.js`에 preset scenario 목록, 버튼 렌더, baseline reset, preset load 함수를 넣는다.
- `src/styles.css`에 preset 버튼과 상태 표시 스타일을 추가한다.

## 6. 실제 구현 방식
- `presetScenarios` 배열에 baseline reset, text/attr 변경, insert child, keyed reorder, duplicate key warning 시나리오를 정의했다.
- `renderPresetButtons()`가 버튼을 만들고, `loadPresetIntoInput()`이 선택한 HTML을 textarea와 preview에 반영한다.
- `resetToSampleSnapshot()`은 actual area, preview, textarea, history cursor를 모두 초기 sample snapshot으로 되돌린다.
- textarea를 직접 수정하면 active preset 상태를 지우고, 현재 입력이 custom input임을 메타 텍스트로 보여준다.

## 7. 구현 후 달라진 점
- 이전 상태: 데모 시나리오를 보여주려면 textarea 내용을 수동으로 다시 작성하거나 붙여 넣어야 했다.
- 현재 상태: 버튼 한 번으로 반복 가능한 입력을 주입하고, Patch/Back/Forward 데모를 더 짧게 재현할 수 있다.
- 눈으로 확인 가능한 변화: Controls 패널에 Demo Presets 영역이 생기고, 현재 어떤 입력 모드인지 메타 텍스트가 바뀐다.

## 8. 검증 방법과 결과
- `npm test`로 기존 핵심 알고리즘 테스트가 모두 계속 통과하는지 확인한다.
- `node --check src/main.js`로 프리셋 UI가 추가된 엔트리 파일 문법을 점검한다.
- `python3 -m http.server 4173` 뒤 `curl -I http://127.0.0.1:4173/index.html` 응답이 `HTTP/1.0 200 OK`인지 확인한다.
- 브라우저에서 Reset Baseline -> Keyed Reorder -> Patch, Reset Baseline -> Duplicate Key -> Patch 흐름은 수동 스모크로 확인하면 된다.

## 9. 놓친 점 / 엣지 케이스
- 프리셋 버튼 자체에 대한 자동화 테스트는 아직 없다.
- 현재 프리셋은 sample 기반 시나리오만 제공하며, 사용자가 만든 custom scenario 저장 기능은 없다.
- 브라우저 상호작용 전체를 자동 검증하는 E2E는 여전히 없다.

## 10. 더 도전하려면
- 현재 textarea 내용을 사용자 정의 preset으로 저장하는 기능을 추가할 수 있다.
- smoke checklist에 preset 기반 시나리오 순서를 더 구체적으로 적어 리허설 시간을 줄일 수 있다.

## 11. 다음 단계
- 공식 마일스톤 기준으로는 이미 완료 상태다.
- 이후 가장 작은 선택 단계는 preset 기반 수동 시나리오를 `tests/SMOKE_CHECKLIST.md`에 더 구체적으로 연결하는 것이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 프리셋 버튼은 actual area를 바로 바꾸지 않고 textarea와 preview만 먼저 바꾸게 했을까?
- 왜 발표용 보조 기능을 추가할 때 diff나 patch 알고리즘을 건드리지 않는 편이 더 안전할까?
- Reset Baseline 버튼이 없으면 history 데모가 왜 흔들리기 쉬울까?
