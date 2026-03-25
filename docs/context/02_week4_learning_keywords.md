# 이번 주차 학습 키워드와 프로젝트 연결

## 공식 키워드
- 01_binary_tree
- 02_bst
- 03_graph_basic
- 04_bfs
- 05_dfs
- 06_topological_sort

## 이 프로젝트와의 연결

### 1) tree
DOM 과 Virtual DOM 은 모두 **트리 구조**다.  
따라서 이번 프로젝트의 본질은 문자열 처리보다 **트리 동기화** 문제에 가깝다.

### 2) binary_tree
DOM 은 이진 트리는 아니지만,  
“현재 노드 + 자식들” 식의 재귀적 사고는 그대로 쓰인다.

### 3) bst
BST 의 핵심 교훈은 **규칙이 탐색을 쉽게 만든다**는 점이다.  
이번 프로젝트에서는 `same type`, `same tag`, `same data-key` 같은 규칙이
비교 비용을 줄이고 설명 가능성을 높인다.

### 4) graph_basic
트리는 그래프의 특별한 경우다.  
DOM/VDOM 을 그래프적 시야로 보면 부모-자식, 정체성(identity), 참조 관계를 더 잘 이해할 수 있다.

### 5) bfs
핵심 구현은 아니지만,
레벨 단위 시각화, 디버깅, patch log 요약 등에 활용할 수 있다.

### 6) dfs
이번 프로젝트의 핵심 순회 감각이다.

대표 함수:
- `domToVNode`
- `vNodeToDom`
- `diff`
- `applyPatch`

모두 DFS 성격이 강하다.

### 7) topological_sort
1차 구현 필수는 아니다.  
하지만 patch 적용 순서, 의존성이 있는 확장 기능, 더 복잡한 렌더링 단계 사고에 도움 된다.

## Lesson 기록 시 꼭 남길 연결 문장 예시

- “이번 단계는 DOM 트리를 DFS 로 순회하는 연습이다.”
- “same tag / same key 규칙은 BST 에서 규칙이 탐색을 쉽게 만드는 감각과 닮아 있다.”
- “history snapshot 은 트리 상태를 시점별로 저장한 것이다.”
- “patch 적용 순서를 고민하는 과정은 topological 사고 확장으로 이어질 수 있다.”

## 이 문서의 목적

Codex가 구현 단계마다
**‘이 단계가 왜 이번 주차 키워드와 연결되는지’**
를 명시적으로 설명하도록 만들기 위함이다.
