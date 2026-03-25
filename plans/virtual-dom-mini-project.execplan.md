# Virtual DOM 미니 프로젝트 실행 계획 (ExecPlan)

## 0. 프로젝트 한 줄 정의

브라우저 DOM을 읽어 Virtual DOM 트리로 만들고, 두 VDOM의 차이를 찾아 실제 DOM에 최소 변경만 반영하며,
snapshot 기반 history 로 undo/redo 까지 제공하는 **Vanilla JS 학습형 미니 프로젝트**를 만든다.

## 1. 범위 정의

### 반드시 포함
- 실제 영역 / 테스트 영역 / Patch / 뒤로가기 / 앞으로가기 UI
- 초기 샘플 HTML → Virtual DOM 변환
- VDOM 기반 테스트 영역 렌더링
- 테스트 입력 변경 후 Patch 실행
- old/new VDOM diff
- 실제 영역에 변경만 반영
- history snapshot 저장
- undo/redo 시 실제 영역 + 테스트 영역 동기화
- `data-key` 인식
- 테스트/검증 흔적
- README 발표용 정리

### 의도적으로 제외 또는 후순위
- React 내부 구현 재현
- 완전한 최소 이동(MOVE) 최적화
- inverse patch 기반 undo
- contenteditable 중심 편집 UX
- scheduler / batching / concurrent rendering
- 모든 브라우저/HTML 엣지 케이스 완벽 대응

## 2. 추천 핵심 아키텍처

### source of truth
- 현재 기준 상태는 **현재 snapshot VDOM** 으로 본다.
- 실제 DOM은 렌더 대상이며, 장기 상태 저장소가 아니다.
- 테스트 입력 HTML 문자열은 새 상태를 만들기 위한 재료다.

### 추천 UI 입력 방식
1차 버전은 `textarea + DOMParser` 를 사용한다.

이유:
- 구현 복잡도가 낮다.
- DOM 파싱/디버깅이 쉽다.
- 공백/selection/contenteditable 특유의 복잡도를 줄일 수 있다.

## 3. 권장 폴더 책임

- `src/model/` — VNode shape, clone 유틸
- `src/dom/` — DOM 읽기 / DOM 렌더 / HTML 파싱
- `src/diff/` — diff core / props diff / children diff
- `src/patch/` — applyPatch
- `src/history/` — snapshot store
- `src/ui/` — 버튼 이벤트 / 화면 연결 / patch log
- `tests/` — 순수 함수 테스트 + 스모크 체크
- `Lessons/` — 학습 기록

## 4. 마일스톤

### [ ] M0. 프로젝트 뼈대와 화면 골격
**목표**
- HTML/CSS/JS 기본 구조를 만든다.
- 실제 영역 / 테스트 입력 / 테스트 미리보기 / patch log / 버튼 영역을 배치한다.

**완료 기준**
- 브라우저에서 기본 레이아웃이 뜬다.
- 샘플 HTML 문자열을 보관할 위치가 있다.
- Patch / Back / Forward 버튼이 보인다.
- README에 실행 방법의 최소 골격이 생긴다.

**검증**
- 페이지 로드
- 버튼 존재 여부 확인
- 샘플 HTML 표시 확인

**Lesson**
- `Lessons/00_project_skeleton.md`

---

### [ ] M1. VNode shape + DOM/HTML 읽기
**목표**
- VNode 자료구조를 확정한다.
- `parseHtmlToRoot()` 와 `domToVNode()` 를 구현한다.

**완료 기준**
- element/text node 를 일관된 shape 로 표현한다.
- whitespace-only text node 처리 규칙이 정해진다.
- attributes → props 변환이 동작한다.
- 샘플 HTML이 기대한 VDOM으로 변환된다.

**검증**
- 간단한 HTML 3~5개를 입력해 VDOM 출력 확인
- text node / nested element / data-key 포함 케이스 확인

**학습 연결**
- tree, DFS, graph basic(트리의 특별한 경우)

**Lesson**
- `Lessons/01_vnode_and_dom_reading.md`

---

### [ ] M2. VDOM → DOM 렌더링 + 초기 동기화
**목표**
- `vNodeToDom()` 또는 동등한 렌더 함수를 만든다.
- 초기 샘플 HTML에서 만든 VDOM으로 테스트 영역 미리보기를 렌더링한다.

**완료 기준**
- 초기 로드 시 실제 기준 상태가 보인다.
- 같은 VDOM으로 테스트 미리보기를 다시 만들 수 있다.
- VDOM ↔ DOM 변환 왕복을 설명할 수 있다.

**검증**
- 샘플 HTML을 VDOM으로 만든 뒤 다시 DOM 렌더
- 원본 구조와 렌더 구조 육안 비교

**학습 연결**
- DFS, 트리 재귀, “상태 → 결과 UI” 사고

**Lesson**
- `Lessons/02_render_and_initial_sync.md`

---

### [ ] M3. Diff 핵심 5케이스
**목표**
- `diff()` 와 보조 함수들을 구현한다.
- path 기반 patch 표현을 만든다.

**핵심 케이스**
- INSERT
- REMOVE
- REPLACE
- TEXT
- PROPS (SET_ATTR / REMOVE_ATTR)

**완료 기준**
- 5개 핵심 케이스 각각에 대해 patch 가 생성된다.
- 동일 node 판정 기준이 정리되어 있다.
- patch log 를 사람이 읽을 수 있다.

**검증**
- 순수 함수 테스트
- 예시 입력과 기대 patch 비교
- nested path 케이스 확인

**학습 연결**
- DFS, 규칙 기반 비교, BST에서 배운 “규칙이 비교 비용을 줄인다”는 교훈

**Lesson**
- `Lessons/03_diff_core.md`

---

### [ ] M4. 실제 DOM에 Patch 적용
**목표**
- `applyPatch()` 를 구현한다.
- patch 결과를 실제 영역에만 반영한다.

**완료 기준**
- REPLACE / TEXT / SET_ATTR / REMOVE_ATTR / INSERT / REMOVE 가 실제 DOM에 반영된다.
- 전체 rerender 가 아니라 patch 적용임을 설명할 수 있다.
- patch log 패널이 있거나 최소한 콘솔 로그가 명확하다.

**검증**
- 텍스트 변경
- 속성 변경
- 자식 추가/삭제
- 태그 교체
- 복합 변경 1개

**학습 연결**
- DOM 변경 비용, reflow/repaint, commit 단계 감각

**Lesson**
- `Lessons/04_patch_application.md`

---

### [ ] M5. History snapshot + Undo/Redo
**목표**
- snapshot 기반 history 저장소를 만든다.
- Back / Forward 로 실제 영역과 테스트 영역을 함께 이동시킨다.

**완료 기준**
- patch 후 새 VDOM snapshot 이 저장된다.
- undo 후 새 변경을 만들면 미래 기록이 버려진다.
- back / forward 가 cursor 이동으로 설명된다.

**검증**
- patch 3회 후 back 2회 / forward 1회
- undo 후 새 patch 생성 시 redo 불가 확인

**학습 연결**
- state snapshot, 그래프적 사고보다 “시점 배열 + 포인터 이동” 단순화

**Lesson**
- `Lessons/05_history_snapshot.md`

---

### [ ] M6. data-key 기반 identity
**목표**
- 리스트 자식 비교에서 `data-key` 를 읽고 matching 한다.
- index 비교와 key 비교의 차이를 데모할 수 있게 만든다.

**완료 기준**
- key 가 있을 때 같은 항목을 같은 항목으로 인식한다.
- key 없는 경우 index 기반 비교 한계를 설명할 수 있다.
- README 또는 Lesson 에 identity 설명이 정리된다.

**검증**
- `[A, B, C] -> [B, A, C]` 류의 예시
- 삽입/삭제가 있는 리스트 예시
- duplicate key 경고 또는 주의사항

**학습 연결**
- identity 규칙, lookup, Map, graph 감각 확장

**Lesson**
- `Lessons/06_data_key_identity.md`

---

### [ ] M7. 테스트, README, 발표 준비
**목표**
- 테스트 케이스와 스모크 체크를 정리한다.
- README를 발표 중심 구조로 만든다.
- 4분 데모 + 1분 Q&A 대비 포인트를 정리한다.

**완료 기준**
- 핵심 로직 테스트가 존재한다.
- README에 구조 / 알고리즘 / 검증 / 배운 점 / 한계가 정리된다.
- 발표 순서가 4분 안에 들어간다.

**검증**
- 테스트 실행
- README 기준 데모 리허설
- 예상 질문 5개 작성

**학습 연결**
- 설명 가능성, 실무 감각, 검증 습관

**Lesson**
- `Lessons/07_validation_readme_demo.md`

## 5. 병렬 위임 가능한 작업

아래는 Codex Cloud나 별도 스레드로 병렬 위임하기 좋다.

- UI shell / CSS polish
- patch log 패널 초안
- 다양한 샘플 HTML 세트 작성
- 테스트 케이스 목록화
- README 초안
- 발표용 Q&A 예상 질문 정리

반대로 아래는 가능하면 **로컬 상호작용으로 직접 같이** 진행한다.

- VNode shape 설계
- `domToVNode`
- `diff`
- `applyPatch`
- history 설계
- `data-key` 규칙

## 6. 전체 완료 정의

아래를 모두 만족하면 프로젝트를 “완료”로 본다.

- 요구된 UI가 동작한다.
- 핵심 알고리즘이 구현되어 있다.
- 변경만 반영하는 흐름을 데모할 수 있다.
- snapshot 기반 undo/redo 가 된다.
- `data-key` 의 의미를 설명할 수 있다.
- 테스트/검증 흔적이 있다.
- README 발표가 가능하다.
- `Lessons/` 폴더에 학습 기록이 남아 있다.
