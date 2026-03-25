# 사용자 작성 해설 문서 요약 (비공식)
주의: 이 문서는 매우 유용하지만 **공식 문서가 아니다**.  
공식 요구사항과 충돌하면 공식 요구사항이 우선한다.

## 이 문서에서 특히 유용한 관점

### 1) 이번 프로젝트를 “트리 동기화 문제”로 보는 관점
핵심은 HTML 문자열 편집이 아니라,
트리 A 를 트리 B 와 같아지도록 만드는 것이다.

### 2) render / commit / paint 구분
- render: 원하는 UI 계산
- commit: 실제 DOM 반영
- paint: 브라우저가 화면 다시 그림

이번 프로젝트에서는:
- 테스트 영역을 읽어 새 VDOM 을 만드는 과정이 render 감각
- diff 후 실제 영역에 patch 를 적용하는 과정이 commit 감각

### 3) 브라우저는 text node 도 노드로 본다
초보자가 가장 자주 놓치는 포인트다.
`children` 과 `childNodes` 의 차이를 이해해야 text diff 를 놓치지 않는다.

### 4) 1차 버전에서 추천하는 범위 제한
강하게 추천되는 범위:
- element/text node
- props diff
- 5개 핵심 patch
- path 기반 patch log
- history snapshot
- `data-key`

뒤로 미룰 범위:
- MOVE patch
- inverse patch undo
- React 수준 최적화
- 모든 HTML 엣지 케이스

### 5) 테스트 영역 입력 방식
1차 버전은 `textarea + DOMParser` 가 더 안정적이다.

이유:
- contenteditable 보다 복잡도가 낮다.
- HTML 문자열 파싱과 디버깅이 명확하다.

### 6) history 는 snapshot 중심이 단순하다
patch 를 되감는 방식보다,
VDOM snapshot 을 저장하고 선택하는 방식이
1~2일 프로젝트에 훨씬 단순하고 설명하기 쉽다.

### 7) key/data-key 는 성능 옵션이 아니라 identity 규칙이다
리스트가 변할 때 “누가 누구인가”를 유지하기 위해 필요하다.

## 이 문서에서 Codex가 특히 참고하면 좋은 부분

- tree / DFS 중심으로 사고하게 만드는 큰 그림
- VDOM 자료구조의 단순한 shape 예시
- diff 5케이스의 우선순위
- data-key 를 주요 범위로 두는 전략
- Codex를 모듈 단위로 활용하자는 제안
- 구현 후 README/발표까지 연결하는 관점

## Codex에게 넘길 때의 사용법

이 문서는 다음 질문에 답하게 만드는 보조 자료로 쓰면 좋다.

- “왜 이 문제를 트리 문제라고 보는가?”
- “왜 DOM 을 그대로 비교하지 않고 VDOM 을 두는가?”
- “왜 history 를 snapshot 으로 설계하는가?”
- “왜 data-key 가 중요한가?”
- “어디까지를 1차 버전 핵심 범위로 볼 것인가?”

## 사용 규칙

Codex는 이 문서를 보조 해설로 사용하되,
공식 요구사항이나 현재 코드베이스보다 앞세우지 않는다.
