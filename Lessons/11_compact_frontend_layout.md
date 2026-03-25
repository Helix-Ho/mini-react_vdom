# Post-M7. Compact Frontend Layout

## 1. 오늘의 목표
- 화면을 한 페이지 안에 더 촘촘하게 배치해, 데스크톱 기준으로 스크롤 없이 핵심 UI를 모두 보이게 만든다.
- 기능적으로 불필요한 hero와 과한 패널 제목을 덜어내고, actual/preview/input/inspection만 남긴다.

## 2. 왜 이 단계를 지금 하는가
- 구현과 문서가 정리된 뒤에는 데모 화면의 밀도와 가독성이 발표 흐름에 직접 영향을 준다.
- 이전 레이아웃은 hero와 큰 패널 헤더가 세로 공간을 많이 차지해서 “핵심 조작 영역”보다 설명성 장식이 더 커졌다.
- 이 단계가 있어야 Patch, History, preset, actual/preview/input/inspection을 한눈에 보는 데모가 쉬워진다.

## 3. 이번 주차 키워드와 연결
- `tree`: 같은 트리 상태를 actual/preview/inspection에 병렬로 보여 주는 화면이다.
- `dfs`: 핵심 알고리즘은 그대로 두고, 그 결과를 압축된 레이아웃에서 동시에 확인하기 쉽게 만든다.
- `graph_basic`: history와 preset 이동 같은 상태 변화가 한 화면 안에서 더 잘 보이게 된다.

## 4. 구현 전에 확인한 개념
- hero, 중복 타이틀, 긴 안내 문구는 학습 문서에는 필요하지만 데모 화면에는 꼭 필요하지 않다.
- 스크롤 없는 레이아웃을 만들 때는 각 grid/flex 자식에 `min-height: 0`과 내부 `overflow: auto`가 빠지면 내용이 잘리기 쉽다.
- 페이지 전체 스크롤을 막더라도, 좁은 화면에서는 responsive fallback으로 다시 세로 배치를 허용해야 안전하다.

## 5. 구현 계획
- `index.html`에서 hero와 중복 패널 헤더를 제거하고 더 짧은 bar 형태로 바꾼다.
- `src/styles.css`를 compact grid 중심으로 다시 정리한다.
- `src/main.js`에서 삭제된 안내 요소 참조를 제거한다.

## 6. 실제 구현 방식
- 상단은 `Patch / History`와 preset만 있는 compact controls row로 줄였다.
- 본문은 `actual`, `preview`, `input`, `inspection` 네 영역만 남기고, inspection은 3개의 작은 card로 묶었다.
- 페이지 전체는 데스크톱에서 `100dvh` 안에 맞추고, 각 패널 내부 요소에는 `min-height: 0`과 `overflow: auto`를 줘서 내용이 패널 밖으로 밀리지 않게 했다.
- `max-width: 1200px` 또는 낮은 viewport 높이에서는 stacked layout으로 fallback 하도록 media query를 넣었다.

## 7. 구현 후 달라진 점
- 이전 상태: hero와 큰 제목 영역 때문에 세로 공간을 많이 썼다.
- 현재 상태: 조작 영역과 결과 영역만 남아서, 한 화면에서 Patch/History와 실제 결과를 함께 보기 쉬워졌다.
- 눈으로 확인 가능한 변화: 상단 설명 패널이 사라지고, actual/preview/input/inspection이 더 촘촘하게 들어간다.

## 8. 검증 방법과 결과
- `node --check src/main.js`로 제거된 DOM 참조가 없는지 확인한다.
- `npm test`로 기존 기능 테스트가 그대로 통과하는지 확인한다.
- `curl -I http://127.0.0.1:4173/index.html` 응답이 `HTTP/1.0 200 OK`인지 확인한다.
- 브라우저 렌더링 도구는 여기 없어서 시각 스크린샷 검증은 못 했지만, 내부 scroll을 명시한 요소와 responsive fallback을 다시 점검했다.

## 9. 놓친 점 / 엣지 케이스
- 아주 작은 높이의 화면에서는 한 페이지 고정이 오히려 불편하므로 media query fallback에 의존한다.
- meta text가 길어질 때는 줄바꿈으로 높이가 약간 늘 수 있다.
- inspection 카드 안의 긴 JSON은 내부 스크롤을 전제로 한다.

## 10. 더 도전하려면
- VNode / Patch JSON / Patch Log 중 하나를 토글형으로 바꿔 더 넓은 render area를 줄 수 있다.
- Playwright 같은 도구로 주요 viewport 크기에서 overflow 여부를 시각적으로 검사할 수 있다.

## 11. 다음 단계
- 기능과 문서, 레이아웃까지 정리됐으므로 다음 가장 작은 단계는 실제 발표 리허설이다.
- 그 다음 선택 단계는 viewport별 screenshot regression 체크를 붙이는 것이다.

## 12. 내가 직접 설명해봐야 할 질문
- 왜 스크롤 없는 grid를 만들 때 `min-height: 0`과 내부 `overflow: auto`가 중요할까?
- 왜 hero를 지우는 것이 단순 미관이 아니라 데모 정보 밀도 개선이라고 볼 수 있을까?
- inspection 영역을 한 카드가 아니라 3개의 작은 card로 나눈 이유는 무엇일까?
