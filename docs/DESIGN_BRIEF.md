# Scrum Helper Design Brief

## 1. 문서 목적

이 문서는 Scrum Helper의 새로운 화면 디자인을 만들기 위한 디자인 브리프다.

디자인 작업자는 이 문서만 읽어도 현재 제품의 목적, 구현된 기능, 주요 사용자 흐름, 화면 목록, 데이터 구조, API 제약, 디자인 방향을 이해할 수 있어야 한다.

현재 구현 코드는 우선 유지한다. API에 치명적인 영향을 주지 않는 범위에서는 프론트엔드 화면 구조와 컴포넌트 구조를 디자인 목적에 맞게 재구성할 수 있다.

## 2. 제품 개요

Scrum Helper는 소규모 팀이 웹 기반 공통 과제를 진행할 때 사용하는 스크럼 보조 도구다.

핵심 목적:

- 팀 생성과 가입을 쉽게 처리한다.
- 팀장이 팀원과 권한을 관리한다.
- 팀 단위 task를 만들고 담당자를 지정한다.
- task 진행 상태, 중요도, 마감일을 확인한다.
- task 댓글로 의견을 남긴다.
- 회의록을 남겨 이후 스펙 문서 생성의 입력으로 활용한다.
- 여러 회의록을 선택해 스펙 문서 초안을 만들고 저장한다.
- 유저별 회고록을 일지처럼 기록하고, 필요한 경우 공동 작업자를 지정한다.

서비스 성격:

- 개발 캠프/해커톤/팀 프로젝트용 협업 도구
- 반복적으로 들어와 작업 상태를 확인하는 운영형 앱
- 마케팅 랜딩 페이지가 아니라 실제 업무 화면이 첫 경험이 되는 앱

## 3. 현재 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Java 17, Spring Boot |
| ORM | Spring Data JPA |
| DB | MySQL |
| Auth | JWT, BCrypt |
| API | REST API |
| Icon | `lucide-react` |

실행 주소:

| 항목 | 기본 주소 |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| API Base | `http://localhost:8080/api` |

## 4. 현재 구현 상태

구현 완료:

| 영역 | 구현 내용 |
|---|---|
| 인증 | 회원가입, 로그인, 로그아웃, 내 정보 조회, JWT 인증 유지 |
| 팀 | 전체 팀 목록, 팀 생성, 팀 상세, 팀 대시보드 |
| 팀 가입 | 공개 팀 가입, 비밀번호 팀 가입, 초대코드 가입 |
| 팀 설정 | 팀명/설명 수정, 팀 비밀번호 변경, 초대코드 조회/재발급 |
| 팀원 관리 | 팀원 목록, 팀장 변경, 팀원 제거 |
| Task | 생성, 목록, 상세, 수정, 완료/미완료 변경, 삭제 |
| Task 담당자 | task별 담당자 1명 이상 지정, 여러 명 지정 가능 |
| 댓글 | task 댓글 작성, 수정, 삭제 |
| 회의록 | 팀별 회의록 생성, 목록, 상세, 수정, 삭제 |
| 스펙 문서 | 회의록 다중 선택, Gemini 또는 로컬 fallback 초안 생성, 초안 수정, 저장, 목록 조회 |
| 회고록 | 회고록 생성, 목록, 상세, 수정, 삭제 |
| 회고록 공동 작업 | 공동 작업자 지정, 공동 작업자의 본문 수정, 작성자 전용 공동 작업자 목록 변경 |
| 테스트 문서 | 수동 테스트 시나리오와 API 검증 결과 문서화 |

최근 디자인 반영:

- Notion-like neutral palette
- 대시보드 KPI 카드
- Growth Tree 위젯
- Task 3열 Kanban 스타일 보드
- Task 상세 문서형 레이아웃
- 파스텔 priority/status pill
- initials 기반 담당자 avatar

## 5. 사용자와 권한

### 5.1 사용자 유형

| 사용자 | 설명 |
|---|---|
| 비로그인 사용자 | 로그인/회원가입 화면만 접근 가능 |
| 일반 로그인 사용자 | 전체 팀 목록 조회, 팀 생성, 팀 가입 가능 |
| 팀원 | 팀 내부 화면 조회, task/댓글/회의록/회고록 사용 가능 |
| 팀장 | 팀 정보 수정, 팀원 제거, 팀장 변경, 초대코드 재발급 가능 |
| 작성자 | 본인이 작성한 댓글, 회의록, 회고록에 대한 수정/삭제 권한 보유 |
| 회고록 공동 작업자 | 지정된 회고록 본문 수정/삭제 가능 |

### 5.2 권한 정책

| 기능 | 권한 |
|---|---|
| 팀 목록 조회 | 로그인 사용자 |
| 팀 생성 | 로그인 사용자 |
| 공개 팀 가입 | 로그인 사용자 |
| 비밀번호 팀 가입 | 로그인 사용자 + 팀 비밀번호 |
| 초대코드 팀 가입 | 로그인 사용자 + 유효한 초대코드 |
| 팀 정보 수정 | 팀장 |
| 팀 초대코드 재발급 | 팀장 |
| 팀원 제거 | 팀장 |
| 팀장 변경 | 팀장 |
| task 조회/생성/수정/삭제 | 팀원 |
| task 완료 변경 | 팀원 |
| 댓글 작성 | 팀원 |
| 댓글 수정/삭제 | 댓글 작성자 |
| 회의록 조회/생성 | 팀원 |
| 회의록 수정/삭제 | 회의록 작성자 또는 팀장 |
| 스펙 문서 조회/초안 생성/저장 | 팀원 |
| 회고록 조회/생성 | 팀원 |
| 회고록 본문 수정/삭제 | 회고록 작성자 또는 공동 작업자 |
| 회고록 공동 작업자 목록 변경 | 회고록 작성자 |

디자인 시 권한 상태를 명확히 표현해야 한다.

- 권한이 없는 버튼은 숨기거나 disabled 처리한다.
- 권한이 없어도 조회 가능한 화면은 읽기 모드로 보여준다.
- 직접 접근으로 권한 오류가 나면 목록 또는 안전한 화면으로 돌아갈 수 있어야 한다.

## 6. 주요 사용자 흐름

### 6.1 첫 사용 흐름

1. 사용자가 회원가입 또는 로그인한다.
2. 전체 팀 목록을 본다.
3. 새 팀을 만들거나 기존 팀에 가입한다.
4. 팀 생성자는 자동으로 팀장이 된다.
5. 팀 가입/생성 후 팀 대시보드로 이동한다.

### 6.2 팀 가입 흐름

팀 가입 방식은 3가지다.

| 방식 | 화면 동작 |
|---|---|
| 공개 팀 | 팀 카드에서 가입 버튼 클릭 즉시 가입 |
| 비밀번호 팀 | 가입 버튼 클릭 후 비밀번호 입력 |
| 초대코드 | 팀 목록 상단 초대코드 입력 영역에서 코드 입력 |

초대코드는 팀 설정 화면에서 볼 수 있으며 팀장만 재발급할 수 있다.

### 6.3 Task 흐름

1. 팀원이 Task 화면에 들어간다.
2. 제목, 설명, 중요도, 마감일, 담당자를 입력해 task를 생성한다.
3. task는 보드에서 상태별로 표시된다.
4. 팀원은 완료/미완료 상태를 바꿀 수 있다.
5. task 상세에서 필드 수정, 담당자 변경, 댓글 작성이 가능하다.

현재 데이터 모델상 task 상태는 `completed: true/false` 두 값만 있다.

디자인에서 `Backlog / In Progress / Completed` 3열 보드를 사용하더라도 API 상태는 완료/미완료만 저장된다. `In Progress`는 현재 프론트에서 마감 임박 미완료 task를 시각적으로 분류하는 방식이다.

### 6.4 회의록 흐름

1. 팀원이 회의 탭에 들어간다.
2. 회의 제목, 회의 일시, 회의 원문, 요약을 입력해 회의록을 만든다.
3. 팀원은 회의록을 조회할 수 있다.
4. 작성자 또는 팀장은 회의록을 수정/삭제할 수 있다.

회의록은 Gemini 기반 스펙 문서 자동 생성 입력 데이터로 사용된다.

### 6.5 스펙 문서 흐름

1. 팀원이 스펙 탭에 들어간다.
2. 근거로 사용할 회의록을 1개 이상 선택한다.
3. 스펙 초안 생성 버튼을 누른다.
4. Gemini API 키가 설정되어 있으면 Gemini로 생성하고, 키가 없거나 실패하면 로컬 규칙 기반 초안을 생성한다.
5. 사용자는 제목과 본문을 수정한 뒤 스펙 문서로 저장한다.
6. 저장된 스펙 문서는 같은 팀원이 목록에서 확인할 수 있다.

### 6.6 회고록 흐름

1. 팀원이 회고록을 작성한다.
2. 항목은 `어제 한 일`, `오늘 할 일`, `궁금한/필요한/알아낸 것`이다.
3. 작성자는 같은 팀원을 공동 작업자로 지정할 수 있다.
4. 작성자와 공동 작업자는 본문을 수정할 수 있다.
5. 공동 작업자 목록 변경은 작성자만 가능하다.

## 7. 현재 화면 구조

### 7.1 라우트

| Route | 화면 | 설명 |
|---|---|---|
| `/login` | 로그인 | 이메일/비밀번호 로그인 |
| `/signup` | 회원가입 | 이름/이메일/비밀번호 가입 |
| `/teams` | 팀 목록 | 전체 팀 목록, 팀 생성, 가입, 초대코드 가입 |
| `/teams/:teamId` | 팀 대시보드 | 팀 요약, KPI, Growth Tree, Quick Actions |
| `/teams/:teamId/tasks` | Task 목록 | Kanban 스타일 task 보드, task 생성 |
| `/teams/:teamId/tasks/:taskId` | Task 상세 | 문서형 task 상세, 댓글 |
| `/teams/:teamId/meetings` | 회의 목록 | 회의록 목록, 회의록 작성 |
| `/teams/:teamId/meetings/:meetingId` | 회의록 상세 | 회의 원문/요약 조회와 수정 |
| `/teams/:teamId/spec-documents` | 스펙 문서 | 회의록 선택, 스펙 초안 생성, 저장 문서 목록 |
| `/teams/:teamId/retrospectives` | 회고록 목록 | 회고록 목록, 회고록 작성 |
| `/teams/:teamId/retrospectives/:retrospectiveId` | 회고록 상세 | 회고록 본문과 공동 작업자 관리 |
| `/teams/:teamId/members` | 팀원 관리 | 팀원 목록, 팀장 변경, 팀원 제거 |
| `/teams/:teamId/settings` | 팀 설정 | 팀 정보, 비밀번호, 초대코드 관리 |

### 7.2 공통 레이아웃

현재 앱 구조:

- 상단 바
  - 서비스명 `Scrum Helper`
  - 현재 사용자 이름
  - 로그아웃 버튼
- 팀 내부 사이드바
  - 대시보드
  - Task
  - 회의
  - 스펙
  - 회고록
  - 팀원
  - 설정
- 메인 콘텐츠 영역

디자인 재구성 시 이 구조는 변경 가능하다.

가능한 개선 방향:

- 상단 바를 더 얇고 조용하게 만든다.
- 팀 내부 사이드바를 Notion workspace navigation처럼 만든다.
- 화면 제목/메타/액션 버튼의 위치를 통일한다.
- 폼과 목록의 밀도를 높이되 시각적으로 답답하지 않게 한다.

## 8. 화면별 디자인 요구사항

### 8.1 인증 화면

목표:

- 단순하고 신뢰감 있는 첫 화면
- 마케팅 문구보다 바로 로그인/가입 가능한 생산성 도구 느낌

필요 UI:

- 서비스명
- 이메일/비밀번호 입력
- 이름 입력: 회원가입 화면
- 로그인/회원가입 전환 링크
- 오류 메시지

디자인 방향:

- 중앙 정렬 카드
- off-white 배경
- 얇은 border
- 큰 그림자 사용 금지

### 8.2 팀 목록 화면

목표:

- 사용자가 전체 팀을 빠르게 훑고, 생성/가입/초대코드 가입을 수행한다.

필요 UI:

- 팀 검색
- 초대코드 입력 영역
- 팀 생성 버튼
- 팀 카드 목록
- 공개/비밀번호 팀 표시
- 가입 상태 표시

팀 카드 정보:

- 팀명
- 설명
- 팀장
- 팀원 수
- 공개/비밀번호 여부
- 내 가입 상태

디자인 방향:

- Notion database card 느낌
- 카드 간 넉넉한 gap
- 태그는 파스텔 pill
- 초대코드 가입은 상단에 작고 명확한 inline form

### 8.3 팀 대시보드

현재 구현된 디자인 요소:

- 큰 greeting/header
- KPI 카드
  - Active Tasks
  - Completed
  - Upcoming Deadlines
  - Members
- Growth Tree 위젯
- 진행률 bar
- mini-calendar
- Quick Actions

디자인 목표:

- 정보 밀도는 유지하되 산만하지 않게 구성한다.
- 작업 상태를 한눈에 보이게 한다.
- Growth Tree는 게이미피케이션의 상징 요소이므로 너무 장식적으로 흐르지 않게 데이터와 연결해 보여준다.

대시보드 데이터:

- `memberCount`
- `task.totalCount`
- `task.completedCount`
- `task.incompleteCount`
- `task.overdueCount`
- `task.dueSoonCount`
- `retrospective.totalCount`
- `retrospective.myCount`
- `retrospective.collaboratingCount`

### 8.4 Task 목록

목표:

- 팀 task를 Kanban 보드처럼 빠르게 파악한다.
- API 상태는 완료/미완료뿐이지만, UI는 `Backlog / In Progress / Completed` 3열로 구성할 수 있다.

현재 시각 분류:

- Backlog: 미완료이며 마감이 임박하지 않은 task
- In Progress: 미완료이며 마감이 2일 이내인 task
- Completed: 완료된 task

Task 카드 정보:

- 제목
- 설명 일부
- 중요도 pill: `LOW`, `MEDIUM`, `HIGH`
- 마감일
- 담당자 initials avatar
- 완료/미완료 변경 버튼

디자인 방향:

- column container는 subtle gray
- 카드 hover 시 아주 약한 shadow 또는 border 강조
- priority tag는 파스텔 pill
- 담당자 avatar는 작은 initials 원형
- drag and drop은 아직 구현되지 않았지만 시각적으로 보드 구조를 준비한다.

### 8.5 Task 상세

목표:

- 문서 편집기처럼 집중해서 task를 수정한다.
- 댓글은 하단 chronological thread로 둔다.

필요 UI:

- 큰 제목
- metadata row
  - priority
  - status
  - due date
  - comment count
- 설명 textarea
- 중요도 select
- 마감일
- 담당자 multi-select checkbox
- 완료/미완료 버튼
- 삭제 버튼
- 댓글 작성 input
- 댓글 목록

디자인 방향:

- 중앙 content column
- card보다 document section 느낌
- 입력 영역은 focus 때만 강조
- 댓글은 avatar 이미지 없이 이름 또는 initials 중심

### 8.6 회의록 목록/상세

목표:

- 회의 내용을 빠르게 남기고, 이후 스펙 문서 자동 생성 입력으로 사용할 수 있게 한다.

회의록 데이터:

- 제목
- 회의 일시
- 회의 원문
- 요약
- 작성자
- 생성/수정 시각

권한:

- 팀원은 조회 가능
- 작성자 또는 팀장은 수정/삭제 가능

디자인 방향:

- 회의록 목록은 문서 카드 목록 또는 table-like list가 적합하다.
- 회의록 상세는 document editor처럼 보이는 것이 좋다.
- 원문과 요약은 시각적으로 분리한다.
- 향후 AI 요약/스펙 생성 버튼이 들어갈 공간을 남겨둔다.

### 8.7 스펙 문서

목표:

- 회의록을 근거로 산출물 스펙 문서 초안을 빠르게 만들고 검토 후 저장한다.

필요 UI:

- 회의록 다중 선택 목록
- 선택 개수 표시
- 스펙 초안 생성 버튼
- 생성 방식 표시: `Gemini` 또는 `Local`
- 제목 input
- Markdown 본문 textarea
- 스펙 문서 저장 버튼
- 저장된 문서 카드 목록
- 문서별 작성자, 수정 시각, 근거 회의록 개수

디자인 방향:

- 좌측은 회의록 선택 패널, 우측은 문서 편집기 형태가 적합하다.
- 본문은 document/editor 느낌으로 넓게 확보한다.
- 저장된 문서 목록은 카드 또는 조용한 list 형태로 구성한다.
- AI 생성 결과는 확정 데이터가 아니므로 사용자가 직접 검토하는 상태를 명확히 보여준다.

### 8.8 회고록 목록/상세

목표:

- 일지형 회고를 팀 단위로 쌓는다.
- 협업 회고록의 권한 차이를 자연스럽게 보여준다.

회고록 데이터:

- 제목
- 어제 한 일
- 오늘 할 일
- 궁금한/필요한/알아낸 것
- 작성자
- 공동 작업자 목록
- 생성/수정 시각

권한:

- 팀원은 조회 가능
- 작성자와 공동 작업자는 본문 수정 가능
- 공동 작업자 목록은 작성자만 변경 가능
- 작성자와 공동 작업자는 삭제 가능

디자인 방향:

- 회고록 목록은 journal/card 느낌
- 상세는 문서형 3-section editor
- 공동 작업자 영역은 작은 people selector처럼 보이게 한다.
- 공동 작업자가 목록을 변경할 수 없는 상태는 disabled UI와 안내문으로 표현한다.

### 8.9 팀원 관리

목표:

- 팀원 역할을 확인하고, 팀장 권한으로 팀원 제거/팀장 위임을 수행한다.

필요 UI:

- 팀원 이름
- 이메일
- 역할 pill: `LEADER`, `MEMBER`
- 팀장 변경 버튼
- 팀원 제거 버튼

디자인 방향:

- table보다 list row가 적합하다.
- role은 subtle pill
- 위험 액션은 muted red로 표시한다.

### 8.10 팀 설정

목표:

- 팀 기본 정보, 가입 비밀번호, 초대코드를 관리한다.

필요 UI:

- 팀명
- 설명
- 비밀번호 변경/제거
- 현재 초대코드
- 초대코드 재발급
- 팀장 외 사용자에게는 수정 disabled 또는 안내문

디자인 방향:

- settings page는 section 단위로 나눈다.
- input은 조용하게, 버튼은 최소 강조한다.
- 초대코드는 copy-friendly하게 보여주는 것이 좋다.

## 9. 주요 데이터 모델

디자인 시 화면에 드러나는 핵심 필드만 정리한다.

### User

| 필드 | 설명 |
|---|---|
| `id` | 사용자 ID |
| `name` | 표시 이름 |
| `email` | 로그인 이메일 |

### Team

| 필드 | 설명 |
|---|---|
| `id` | 팀 ID |
| `name` | 팀명 |
| `description` | 팀 설명 |
| `hasPassword` | 비밀번호 팀 여부 |
| `inviteCode` | 초대코드 |
| `leader` | 팀장 |
| `myRole` | 현재 사용자의 팀 내 역할 |

### Task

| 필드 | 설명 |
|---|---|
| `id` | task ID |
| `title` | 제목 |
| `description` | 설명 |
| `priority` | `LOW`, `MEDIUM`, `HIGH` |
| `dueDate` | 마감일 |
| `completed` | 완료 여부 |
| `assignees` | 담당자 목록 |
| `commentCount` | 댓글 수 |

### Meeting

| 필드 | 설명 |
|---|---|
| `id` | 회의록 ID |
| `title` | 회의 제목 |
| `meetingAt` | 회의 일시 |
| `rawContent` | 회의 원문 |
| `summary` | 요약 |
| `author` | 작성자 |

### SpecDocument

| 필드 | 설명 |
|---|---|
| `id` | 스펙 문서 ID |
| `title` | 문서 제목 |
| `content` | Markdown 문서 본문 |
| `sourceMeetingIds` | 근거 회의록 ID 목록 |
| `createdBy` | 저장자 |
| `createdAt` | 생성 시각 |
| `updatedAt` | 수정 시각 |

### Retrospective

| 필드 | 설명 |
|---|---|
| `id` | 회고록 ID |
| `title` | 제목 |
| `yesterdayWork` | 어제 한 일 |
| `todayPlan` | 오늘 할 일 |
| `note` | 궁금한/필요한/알아낸 것 |
| `author` | 작성자 |
| `collaborators` | 공동 작업자 |

## 10. API 제약

디자인을 위해 프론트 구조는 바꿀 수 있지만 API의 의미는 유지해야 한다.

주의할 API 제약:

- task status는 현재 `completed` boolean뿐이다.
- task 담당자는 1명 이상 필수다.
- team name은 unique다.
- team invite code는 팀장만 재발급할 수 있다.
- spec document 초안 생성과 저장은 팀원만 가능하다.
- spec document 생성 시 선택한 회의록은 같은 팀 소속이어야 한다.
- 회고록 공동 작업자 목록 변경은 작성자만 가능하다.
- 회의록 수정/삭제는 작성자 또는 팀장만 가능하다.
- 댓글 수정/삭제는 댓글 작성자만 가능하다.
- 회원 탈퇴는 없다.

## 11. 현재 주요 API

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

### Team

- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/{teamId}`
- `GET /api/teams/{teamId}/dashboard`
- `POST /api/teams/{teamId}/join`
- `POST /api/teams/join-by-invite`
- `PATCH /api/teams/{teamId}`
- `PATCH /api/teams/{teamId}/password`
- `PATCH /api/teams/{teamId}/invite-code`
- `GET /api/teams/{teamId}/members`
- `DELETE /api/teams/{teamId}/members/{memberId}`
- `PATCH /api/teams/{teamId}/leader`

### Task

- `GET /api/teams/{teamId}/tasks`
- `POST /api/teams/{teamId}/tasks`
- `GET /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}/completion`
- `DELETE /api/tasks/{taskId}`

### Comments

- `GET /api/tasks/{taskId}/comments`
- `POST /api/tasks/{taskId}/comments`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

### Meetings

- `GET /api/teams/{teamId}/meetings`
- `POST /api/teams/{teamId}/meetings`
- `GET /api/meetings/{meetingId}`
- `PATCH /api/meetings/{meetingId}`
- `DELETE /api/meetings/{meetingId}`

### Spec Documents

- `GET /api/teams/{teamId}/spec-documents`
- `POST /api/teams/{teamId}/spec-documents/draft`
- `POST /api/teams/{teamId}/spec-documents`

### Retrospectives

- `GET /api/teams/{teamId}/retrospectives`
- `POST /api/teams/{teamId}/retrospectives`
- `GET /api/retrospectives/{retrospectiveId}`
- `PATCH /api/retrospectives/{retrospectiveId}`
- `DELETE /api/retrospectives/{retrospectiveId}`

## 12. 디자인 시스템 방향

목표 톤:

- clean
- minimalist
- Notion-like
- neutral
- document-oriented
- productivity app

권장 색상:

| 용도 | 방향 |
|---|---|
| Background | off-white, soft gray |
| Surface | white 또는 아주 연한 gray |
| Text primary | dark gray `#37352F` 계열 |
| Text secondary | warm gray |
| Border | `#E5E2DC` 계열 얇은 1px |
| Accent | muted blue, green, yellow, red |

타이포그래피:

| 용도 | 크기 |
|---|---|
| H1 | 32px, bold |
| H2 | 20px-24px, semi-bold |
| Body | 14px-16px |
| Metadata | 12px, gray |

컴포넌트 원칙:

- 카드 radius: 6px-8px
- 버튼 radius: 6px-8px
- shadow는 거의 쓰지 않거나 매우 약하게
- border와 미세한 배경 차이로 레이어 구분
- tag/pill은 파스텔 배경과 작은 텍스트
- icon은 lucide 계열 thin line icon 사용
- 불필요한 hero/marketing section 금지
- 실제 업무 화면을 첫 화면으로 유지

## 13. 디자인 시 유지해야 할 UX

- 로그인 후 기본 진입은 `/teams`
- 팀 가입/생성 후 기본 진입은 팀 대시보드
- 팀 내부 이동은 사이드 내비게이션으로 가능해야 함
- 모바일에서는 사이드바가 상단 grid 또는 compact nav로 전환되어야 함
- 오류 메시지는 화면 상단 또는 폼 근처에 보여야 함
- 저장 중 버튼은 disabled/loading 상태를 가져야 함
- 삭제 액션은 confirm 또는 명확한 위험 스타일 필요
- 권한 없는 사용자는 직접 액션 버튼을 누를 수 없어야 함

## 14. 향후 확장 예정 기능

아직 구현 전이지만 디자인에서 공간을 고려하면 좋은 기능:

| 기능 | 설명 |
|---|---|
| Gemini 스펙 문서 생성 | 구현 완료. 선택한 회의록을 바탕으로 스펙 초안 생성 |
| task 자동 추천 | 스펙 문서 기반 task 후보 생성 |
| 리더보드 | 완료 task 수 기반 팀원 랭킹 |
| 명성/업적 | 누적 완료 task 기반 등급과 배지 |
| 성장 나무 고도화 | 완료 task 수와 날짜에 따른 시각 성장 |
| task dependency | task 전후 관계와 roadmap overview |
| email notification | 선행 task 완료 시 후행 담당자 알림 |
| calendar view | 마감일 기반 월간/주간 보기 |
| dark mode | 사용자 설정 기반 테마 |

우선순위:

1. 스펙 문서 기반 task 자동 추천
2. 칸반/캘린더 UX 고도화
3. 게이미피케이션 확장
4. task 의존성/하위 task/알림

## 15. 디자인 작업 산출물 기대치

새 디자인 작업에서 기대하는 산출물:

- 전체 앱 디자인 시스템 방향
- 주요 화면 와이어프레임 또는 high-fidelity 화면
- 공통 컴포넌트 목록
- 화면별 빈 상태, 오류 상태, 권한 없음 상태
- 반응형 기준
- 개발 적용을 위한 CSS token 또는 component guideline

우선 디자인 대상 화면:

1. 팀 대시보드
2. Task 보드
3. Task 상세
4. 회의록 목록/상세
5. 스펙 문서
6. 회고록 목록/상세
7. 팀 목록
8. 팀 설정

## 16. 참고 파일

| 파일 | 용도 |
|---|---|
| `README.md` | 전체 프로젝트 상태 |
| `SPEC.md` | 제품 정책 |
| `API_SPEC.md` | API 문서 |
| `DB_SCHEMA.md` | DB 스키마 |
| `IA.md` | 화면 구조 |
| `FRONTEND_DESIGN.md` | 프론트 설계 |
| `docs/ROADMAP.md` | 확장 로드맵 |
| `docs/TEST_SCENARIOS.md` | 기능별 테스트 시나리오 |
| `docs/TEST_RESULTS.md` | 최근 검증 결과 |
