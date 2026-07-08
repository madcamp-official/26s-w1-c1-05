# Scrum Helper DB Schema

이 문서는 최종 구현된 JPA Entity 기준의 제출용 DB 스키마다.

## 1. 테이블 목록

| 테이블 | 목적 |
|---|---|
| `users` | 사용자 계정과 프로필 |
| `teams` | 스크럼 프로젝트 팀 |
| `team_members` | 사용자와 팀의 N:M 소속 관계 |
| `meetings` | 팀 회의록 |
| `spec_documents` | 회의록 기반 스펙 문서 |
| `task_suggestions` | Spec 기반 Task 추천 후보 |
| `tasks` | 팀 단위 작업 |
| `task_assignees` | Task 담당자 N:M 관계 |
| `task_comments` | Task 댓글 |
| `user_todo_tasks` | 사용자별 개인 Todo 목록 |
| `retrospectives` | KPT형 회고록 |
| `retrospective_collaborators` | 회고록 공동 작업자 |

## 2. ERD

```mermaid
erDiagram
  USERS ||--o{ TEAM_MEMBERS : joins
  TEAMS ||--o{ TEAM_MEMBERS : has
  USERS ||--o{ TEAMS : leads

  TEAMS ||--o{ MEETINGS : owns
  USERS ||--o{ MEETINGS : authors

  TEAMS ||--o{ SPEC_DOCUMENTS : owns
  USERS ||--o{ SPEC_DOCUMENTS : creates
  SPEC_DOCUMENTS ||--o{ TASK_SUGGESTIONS : generates
  TEAMS ||--o{ TASK_SUGGESTIONS : owns

  TEAMS ||--o{ TASKS : owns
  USERS ||--o{ TASKS : creates
  TASKS ||--o{ TASK_ASSIGNEES : has
  USERS ||--o{ TASK_ASSIGNEES : assigned
  TASKS ||--o{ TASK_COMMENTS : has
  USERS ||--o{ TASK_COMMENTS : writes
  USERS ||--o{ USER_TODO_TASKS : owns
  TASKS ||--o{ USER_TODO_TASKS : listed
  TEAMS ||--o{ USER_TODO_TASKS : scopes

  TEAMS ||--o{ RETROSPECTIVES : owns
  USERS ||--o{ RETROSPECTIVES : authors
  RETROSPECTIVES ||--o{ RETROSPECTIVE_COLLABORATORS : has
  USERS ||--o{ RETROSPECTIVE_COLLABORATORS : collaborates

  USERS {
    BIGINT id PK
    VARCHAR name NN
    VARCHAR email NN_UQ
    VARCHAR title
    VARCHAR bio
    VARCHAR contact
    VARCHAR password_hash NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TEAMS {
    BIGINT id PK
    VARCHAR name NN_UQ
    TEXT description
    VARCHAR password_hash
    VARCHAR invite_code UQ
    BIGINT leader_user_id FK_NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TEAM_MEMBERS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT user_id FK_NN
    VARCHAR role NN
    DATETIME joined_at NN
  }

  MEETINGS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT author_user_id FK_NN
    VARCHAR title NN
    DATETIME meeting_at NN
    TEXT raw_content
    TEXT summary
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  SPEC_DOCUMENTS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT created_by_user_id FK_NN
    VARCHAR title NN
    TEXT content NN
    TEXT source_meeting_ids
    VARCHAR status NN
    BOOLEAN is_main NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TASK_SUGGESTIONS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT spec_document_id FK_NN
    VARCHAR title NN
    TEXT description
    VARCHAR priority NN
    VARCHAR status NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TASKS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT created_by_user_id FK_NN
    VARCHAR title NN
    TEXT description
    VARCHAR priority NN
    BOOLEAN completed NN
    VARCHAR status
    INT sort_order NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TASK_ASSIGNEES {
    BIGINT id PK
    BIGINT task_id FK_NN
    BIGINT team_id FK_NN
    BIGINT user_id FK_NN
  }

  TASK_COMMENTS {
    BIGINT id PK
    BIGINT task_id FK_NN
    BIGINT author_user_id FK_NN
    TEXT content NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  USER_TODO_TASKS {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT user_id FK_NN
    BIGINT task_id FK_NN
    INT sort_order NN
    DATETIME created_at NN
  }

  RETROSPECTIVES {
    BIGINT id PK
    BIGINT team_id FK_NN
    BIGINT author_user_id FK_NN
    VARCHAR title NN
    TEXT yesterday_work
    TEXT today_plan
    TEXT note
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  RETROSPECTIVE_COLLABORATORS {
    BIGINT id PK
    BIGINT retrospective_id FK_NN
    BIGINT team_id FK_NN
    BIGINT user_id FK_NN
  }
```

## 3. 상세 스키마

### 3.1 `users`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 사용자 ID |
| `name` | `VARCHAR(50)` | Y |  | 표시 이름 |
| `email` | `VARCHAR(255)` | Y | UQ | 로그인 이메일 |
| `title` | `VARCHAR(80)` | N |  | 프로필 직함 |
| `bio` | `VARCHAR(500)` | N |  | 프로필 소개 |
| `contact` | `VARCHAR(200)` | N |  | 연락처 |
| `password_hash` | `VARCHAR(255)` | Y |  | 해시된 비밀번호 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

### 3.2 `teams`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 팀 ID |
| `name` | `VARCHAR(100)` | Y | UQ | 팀 이름 |
| `description` | `TEXT` | N |  | 팀 설명 |
| `password_hash` | `VARCHAR(255)` | N |  | 팀 가입 비밀번호 해시 |
| `invite_code` | `VARCHAR(16)` | N | UQ | 초대코드 |
| `leader_user_id` | `BIGINT` | Y | FK | 팀장 사용자 ID |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

정책:

- `password_hash`가 없으면 공개 팀이다.
- 초대코드는 팀장만 재발급할 수 있다.
- 팀장 변경 시 `teams.leader_user_id`와 `team_members.role`을 함께 갱신한다.

### 3.3 `team_members`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 멤버십 ID |
| `team_id` | `BIGINT` | Y | FK, UQ | 팀 ID |
| `user_id` | `BIGINT` | Y | FK, UQ | 사용자 ID |
| `role` | `VARCHAR(20)` | Y |  | `LEADER`, `MEMBER` |
| `joined_at` | `DATETIME(6)` | Y |  | 가입 시각 |

제약:

- `(team_id, user_id)` unique.
- 한 팀의 실제 팀장은 `teams.leader_user_id` 기준으로 판단한다.

### 3.4 `tasks`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | Task ID |
| `team_id` | `BIGINT` | Y | FK, UQ | 팀 ID |
| `created_by_user_id` | `BIGINT` | Y | FK | 생성자 |
| `title` | `VARCHAR(200)` | Y | UQ | 제목 |
| `description` | `TEXT` | N |  | 설명 |
| `priority` | `VARCHAR(20)` | Y |  | `LOW`, `MEDIUM`, `HIGH` |
| `completed` | `BOOLEAN` | Y |  | 완료 여부 |
| `status` | `VARCHAR(20)` | N |  | `BACKLOG`, `IN_PROGRESS`, `DONE` |
| `sort_order` | `INT` | Y |  | 보드 정렬 순서 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- `(team_id, title)` unique.
- `status = DONE`이면 `completed = true`.
- Todo에 들어간 Task는 `IN_PROGRESS`로 이동한다.

### 3.5 `task_assignees`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 담당자 row ID |
| `task_id` | `BIGINT` | Y | FK, UQ | Task ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `user_id` | `BIGINT` | Y | FK, UQ | 담당자 사용자 ID |

제약:

- `(task_id, user_id)` unique.
- 담당자는 같은 팀의 팀원이어야 한다.
- Task 담당자는 1명 이상이어야 하며 service layer에서 검증한다.

### 3.6 `user_todo_tasks`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | Todo row ID |
| `team_id` | `BIGINT` | Y | FK, UQ | 팀 ID |
| `user_id` | `BIGINT` | Y | FK, UQ | Todo 소유자 |
| `task_id` | `BIGINT` | Y | FK, UQ | 연결 Task |
| `sort_order` | `INT` | Y |  | Todo 정렬 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |

제약:

- `(team_id, user_id, task_id)` unique.
- 본인에게 담당자로 배정된 Task만 Todo에 추가할 수 있다.
- Task가 Done 처리되면 Todo 목록에서 제거된다.

### 3.7 `task_comments`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 댓글 ID |
| `task_id` | `BIGINT` | Y | FK | Task ID |
| `author_user_id` | `BIGINT` | Y | FK | 작성자 |
| `content` | `TEXT` | Y |  | 댓글 내용 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

정책:

- 댓글 수정/삭제는 작성자만 가능하다.

### 3.8 `meetings`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 회의록 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `author_user_id` | `BIGINT` | Y | FK | 작성자 |
| `title` | `VARCHAR(200)` | Y |  | 제목 |
| `meeting_at` | `DATETIME(6)` | Y |  | 회의 일시 |
| `raw_content` | `TEXT` | N |  | 회의 원문/script |
| `summary` | `TEXT` | N |  | 요약 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

### 3.9 `spec_documents`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 스펙 문서 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `created_by_user_id` | `BIGINT` | Y | FK | 생성자 |
| `title` | `VARCHAR(200)` | Y |  | 제목 |
| `content` | `TEXT` | Y |  | Markdown 본문 |
| `source_meeting_ids` | `TEXT` | N |  | 근거 회의록 ID 목록 |
| `status` | `VARCHAR(20)` | Y |  | 문서 상태 |
| `is_main` | `BOOLEAN` | Y |  | Main Spec 여부 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

정책:

- Main Spec은 팀의 기준 스펙으로 사용한다.
- Spec 초안은 선택한 회의록 내용만 근거로 생성한다.

### 3.10 `task_suggestions`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 추천 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `spec_document_id` | `BIGINT` | Y | FK | 근거 Spec |
| `title` | `VARCHAR(200)` | Y |  | 추천 Task 제목 |
| `description` | `TEXT` | N |  | 추천 Task 설명 |
| `priority` | `VARCHAR(20)` | Y |  | 중요도 |
| `status` | `VARCHAR(20)` | Y |  | `PENDING`, `ACCEPTED`, `DISMISSED` |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

### 3.11 `retrospectives`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 회고록 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `author_user_id` | `BIGINT` | Y | FK | 작성자 |
| `title` | `VARCHAR(200)` | Y |  | 제목 |
| `yesterday_work` | `TEXT` | N |  | 어제 한 일 |
| `today_plan` | `TEXT` | N |  | 오늘 할 일 |
| `note` | `TEXT` | N |  | 궁금한/필요한/알아낸 것 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

### 3.12 `retrospective_collaborators`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 공동 작업자 row ID |
| `retrospective_id` | `BIGINT` | Y | FK, UQ | 회고록 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `user_id` | `BIGINT` | Y | FK, UQ | 공동 작업자 |

제약:

- `(retrospective_id, user_id)` unique.
- 공동 작업자는 회고록과 같은 팀의 팀원이어야 한다.
- 공동 작업자 목록 변경은 회고록 작성자만 가능하다.

## 4. 삭제/보존 정책

| 상황 | 정책 |
|---|---|
| 회원 탈퇴 | 제공하지 않음 |
| 팀원 제거 | 기존 작성 기록은 유지 |
| 팀원 제거 | 유일 담당자인 Task가 있으면 제거 전 재배정 필요 |
| Task 삭제 | 담당자, 댓글, Todo 연결 삭제 |
| 회고록 삭제 | 공동 작업자 연결 삭제 |

## 5. 구현상 주의점

- JPA Entity는 단순 FK를 사용하고, 복잡한 권한/소속 검증은 service layer에서 처리한다.
- 사용자/팀 비밀번호는 평문 저장하지 않는다.
- AI 생성 결과는 즉시 최종 데이터로 확정하지 않고 사용자가 저장/수락하는 단계를 둔다.
