# Scrum Helper DB Schema

## 1. 문서 목적

이 문서는 `SPEC.md`에서 확정된 MVP 정책을 MySQL + Spring Data JPA 기준의 데이터베이스 스키마로 변환한 문서다.

이 문서는 아직 구현 코드가 아니라 DB 설계 기준이다. API 문서와 JPA Entity는 이 문서를 기준으로 파생한다.

## 2. 설계 원칙

- DBMS는 MySQL을 사용한다.
- Java Entity에서는 `Long`을 기본 PK 타입으로 사용한다.
- 테이블명과 컬럼명은 `snake_case`를 사용한다.
- 날짜/시간은 `DATETIME(6)`을 사용한다.
- enum 값은 MySQL `ENUM` 대신 `VARCHAR` + `CHECK` 제약으로 표현한다.
- 비밀번호는 사용자 비밀번호와 팀 비밀번호 모두 해시값만 저장한다.
- 회원 탈퇴는 MVP 범위가 아니므로 사용자 row 삭제는 고려하지 않는다.
- 팀원 제거 후에도 작성 기록은 유지한다.
- task 담당자와 회고록 공동 작업자는 현재 팀원이어야 한다.
- task 담당자는 1명 이상이어야 한다. 이 제약은 DB 단독으로 보장하기 어렵기 때문에 service layer에서 검증한다.

## 3. 테이블 목록

| 테이블 | 목적 |
|---|---|
| `users` | 서비스 사용자 |
| `teams` | 스크럼 프로젝트 팀 |
| `team_members` | 사용자와 팀의 N:M 관계 |
| `tasks` | 팀 단위 할 일 |
| `task_assignees` | task 담당자 N:M 관계 |
| `task_comments` | task 댓글 |
| `retrospectives` | 유저별 회고록 |
| `retrospective_collaborators` | 회고록 공동 작업자 N:M 관계 |
| `meetings` | 팀 회의록 |
| `spec_documents` | 회의록 기반 스펙 문서 |
| `task_suggestions` | 스펙 문서 기반 task 추천 후보 |

## 4. ERD

```mermaid
erDiagram
  USERS ||--o{ TEAM_MEMBERS : joins
  TEAMS ||--o{ TEAM_MEMBERS : has
  USERS ||--o{ TEAMS : leads

  TEAMS ||--o{ TASKS : owns
  USERS ||--o{ TASKS : creates
  TASKS ||--o{ TASK_ASSIGNEES : has
  USERS ||--o{ TASK_ASSIGNEES : assigned
  TEAM_MEMBERS ||--o{ TASK_ASSIGNEES : validates_member

  TASKS ||--o{ TASK_COMMENTS : has
  USERS ||--o{ TASK_COMMENTS : writes

  TEAMS ||--o{ MEETINGS : owns
  USERS ||--o{ MEETINGS : authors

  TEAMS ||--o{ SPEC_DOCUMENTS : owns
  USERS ||--o{ SPEC_DOCUMENTS : creates
  SPEC_DOCUMENTS ||--o{ TASK_SUGGESTIONS : suggests
  TEAMS ||--o{ TASK_SUGGESTIONS : owns

  TEAMS ||--o{ RETROSPECTIVES : owns
  USERS ||--o{ RETROSPECTIVES : authors
  RETROSPECTIVES ||--o{ RETROSPECTIVE_COLLABORATORS : has
  USERS ||--o{ RETROSPECTIVE_COLLABORATORS : collaborates
  TEAM_MEMBERS ||--o{ RETROSPECTIVE_COLLABORATORS : validates_member

  USERS {
    BIGINT id PK
    VARCHAR name NN
    VARCHAR email NN_UQ
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
    BIGINT leader_team_id UQ
    DATETIME joined_at NN
  }

  TASKS {
    BIGINT id PK
    BIGINT team_id FK_NN
    VARCHAR title NN
    TEXT description
    VARCHAR priority NN
    DATE due_date NN
    BOOLEAN completed NN
    BIGINT created_by_user_id FK_NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }

  TASK_ASSIGNEES {
    BIGINT task_id PK_FK
    BIGINT team_id FK_NN
    BIGINT user_id PK_FK
    DATETIME assigned_at NN
  }

  TASK_COMMENTS {
    BIGINT id PK
    BIGINT task_id FK_NN
    BIGINT user_id FK_NN
    TEXT content NN
    DATETIME created_at NN
    DATETIME updated_at NN
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
    BIGINT retrospective_id PK_FK
    BIGINT team_id FK_NN
    BIGINT user_id PK_FK
    DATETIME added_at NN
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
    DATE due_date NN
    BOOLEAN accepted NN
    DATETIME created_at NN
    DATETIME updated_at NN
  }
```

## 5. 상세 스키마

### 5.1 `users`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 내부 사용자 ID |
| `name` | `VARCHAR(50)` | Y |  | 화면 표시 이름 |
| `email` | `VARCHAR(255)` | Y | UQ | 로그인 이메일 |
| `password_hash` | `VARCHAR(255)` | Y |  | 해시된 사용자 비밀번호 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- `email`은 unique다.
- 사용자 삭제는 MVP에서 제공하지 않는다.

### 5.2 `teams`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 내부 팀 ID |
| `name` | `VARCHAR(80)` | Y | UQ | 팀 이름 |
| `description` | `TEXT` | N |  | 팀 설명 |
| `password_hash` | `VARCHAR(255)` | N |  | 팀 가입 비밀번호 해시 |
| `invite_code` | `VARCHAR(16)` | N | UQ | 팀 가입 초대코드 |
| `leader_user_id` | `BIGINT` | Y | FK | 현재 팀장 사용자 ID |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- `name`은 unique다.
- `password_hash`가 `NULL`이면 공개 팀이다.
- `password_hash`가 있으면 가입 시 팀 비밀번호 검증이 필요하다.
- `invite_code`는 팀 생성 시 자동 발급하며 unique다.
- `invite_code`는 기존 로컬 DB 자동 마이그레이션 호환을 위해 nullable로 둔다. 신규 생성 팀에는 항상 값이 들어간다.
- 초대코드 가입은 팀 비밀번호와 무관하게 허용한다.
- 초대코드는 팀장만 재발급할 수 있다.
- `leader_user_id`는 `users.id`를 참조한다.
- 실제 팀장은 `teams.leader_user_id`를 권한 판단의 기준으로 사용한다.
- `team_members.role`도 함께 갱신해 조회 편의성을 유지한다.

### 5.3 `team_members`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 멤버십 ID |
| `team_id` | `BIGINT` | Y | FK, UQ | 팀 ID |
| `user_id` | `BIGINT` | Y | FK, UQ | 사용자 ID |
| `role` | `VARCHAR(20)` | Y |  | `LEADER` 또는 `MEMBER` |
| `leader_team_id` | `BIGINT` | N | UQ | 팀장 1명 제약용 generated column |
| `joined_at` | `DATETIME(6)` | Y |  | 가입 시각 |

제약:

- `(team_id, user_id)`는 unique다.
- `role`은 `LEADER`, `MEMBER`만 허용한다.
- `leader_team_id`는 `role = 'LEADER'`일 때만 `team_id`가 들어가는 generated column이다.
- `leader_team_id`에 unique index를 걸어 팀당 `LEADER` row가 2개 이상 생기지 않게 한다.
- 팀에는 항상 1명의 팀장이 있어야 한다. 이 invariant는 `teams.leader_user_id`와 service transaction으로 보장한다.

팀장 변경 transaction:

1. 현재 팀장의 `team_members.role`을 `MEMBER`로 변경한다.
2. 새 팀장의 `team_members.role`을 `LEADER`로 변경한다.
3. `teams.leader_user_id`를 새 팀장 `user_id`로 변경한다.
4. 위 3개 작업은 하나의 transaction으로 처리한다.

### 5.4 `tasks`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | task ID |
| `team_id` | `BIGINT` | Y | FK, UQ 보조 | 팀 ID |
| `title` | `VARCHAR(120)` | Y |  | task 제목 |
| `description` | `TEXT` | N |  | task 설명 |
| `priority` | `VARCHAR(20)` | Y |  | `LOW`, `MEDIUM`, `HIGH` |
| `due_date` | `DATE` | Y | IDX | 마감일 |
| `completed` | `BOOLEAN` | Y | IDX | 완료 여부 |
| `created_by_user_id` | `BIGINT` | Y | FK | 생성자 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- `priority`는 `LOW`, `MEDIUM`, `HIGH`만 허용한다.
- `completed`는 기본값 `false`다.
- task 생성자는 현재 팀원이어야 한다. 이 조건은 service layer에서 검증한다.
- task 담당자는 1명 이상이어야 한다. 이 조건은 service layer에서 검증한다.
- `(id, team_id)` unique index를 둔다. 이는 `task_assignees.team_id`가 task의 팀과 일치하는지 FK로 확인하기 위한 보조 제약이다.

### 5.5 `task_assignees`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `task_id` | `BIGINT` | Y | PK, FK | task ID |
| `team_id` | `BIGINT` | Y | FK | task가 속한 팀 ID |
| `user_id` | `BIGINT` | Y | PK, FK | 담당자 사용자 ID |
| `assigned_at` | `DATETIME(6)` | Y |  | 배정 시각 |

제약:

- `(task_id, user_id)` 복합 PK를 사용한다.
- `(task_id, team_id)`는 `tasks(id, team_id)`를 참조한다.
- `(team_id, user_id)`는 `team_members(team_id, user_id)`를 참조한다.
- 위 두 FK로 담당자가 task와 같은 팀의 팀원인지 DB 레벨에서 검증한다.
- 팀원 제거 시 담당자 연결은 제거될 수 있다. 단, 그 결과 task 담당자가 0명이 되면 안 되므로 service layer에서 제거 전 검증한다.

### 5.6 `task_comments`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 댓글 ID |
| `task_id` | `BIGINT` | Y | FK | task ID |
| `user_id` | `BIGINT` | Y | FK | 작성자 사용자 ID |
| `content` | `TEXT` | Y |  | 댓글 내용 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- 댓글 작성자는 현재 팀원이어야 한다. 이 조건은 service layer에서 검증한다.
- 댓글 수정/삭제는 작성자만 가능하다.
- task가 삭제되면 댓글도 삭제된다.
- 팀원에서 제거되어도 기존 댓글 작성 기록은 유지한다.

### 5.7 `retrospectives`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 회고록 ID |
| `team_id` | `BIGINT` | Y | FK, UQ 보조 | 팀 ID |
| `author_user_id` | `BIGINT` | Y | FK | 작성자 사용자 ID |
| `title` | `VARCHAR(120)` | Y |  | 회고록 제목 |
| `yesterday_work` | `TEXT` | N |  | 어제 한 일 |
| `today_plan` | `TEXT` | N |  | 오늘 할 일 |
| `note` | `TEXT` | N |  | 궁금한/필요한/알아낸 것 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- 회고록 작성자는 생성 시점에 현재 팀원이어야 한다. 이 조건은 service layer에서 검증한다.
- 작성자는 1명이다.
- 회고록은 날짜별 1개로 제한하지 않는다.
- 작성자와 공동 작업자가 회고록 본문을 수정/삭제할 수 있다.
- 공동 작업자 목록은 작성자만 변경할 수 있다.
- 팀원에서 제거되어도 기존 회고록 작성 기록은 유지한다.
- `(id, team_id)` unique index를 둔다. 이는 `retrospective_collaborators.team_id`가 회고록의 팀과 일치하는지 FK로 확인하기 위한 보조 제약이다.

### 5.8 `retrospective_collaborators`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `retrospective_id` | `BIGINT` | Y | PK, FK | 회고록 ID |
| `team_id` | `BIGINT` | Y | FK | 회고록이 속한 팀 ID |
| `user_id` | `BIGINT` | Y | PK, FK | 공동 작업자 사용자 ID |
| `added_at` | `DATETIME(6)` | Y |  | 공동 작업자 추가 시각 |

제약:

- `(retrospective_id, user_id)` 복합 PK를 사용한다.
- `(retrospective_id, team_id)`는 `retrospectives(id, team_id)`를 참조한다.
- `(team_id, user_id)`는 `team_members(team_id, user_id)`를 참조한다.
- 위 두 FK로 공동 작업자가 회고록과 같은 팀의 팀원인지 DB 레벨에서 검증한다.
- 작성자는 공동 작업자 목록에 중복 저장하지 않는다. 이 조건은 service layer에서 검증한다.
- 팀원에서 제거되면 공동 작업자 권한은 제거될 수 있다. 회고록 본문과 작성 기록은 유지한다.

### 5.9 `meetings`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 회의록 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `author_user_id` | `BIGINT` | Y | FK | 작성자 사용자 ID |
| `title` | `VARCHAR(200)` | Y |  | 회의 제목 |
| `meeting_at` | `DATETIME(6)` | Y | IDX | 회의 일시 |
| `raw_content` | `TEXT` | N |  | 회의 원문 |
| `summary` | `TEXT` | N |  | 회의 요약 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- 회의록 작성자는 생성 시점에 현재 팀원이어야 한다. 이 조건은 service layer에서 검증한다.
- 회의록 조회는 같은 팀의 팀원만 가능하다.
- 회의록 수정/삭제는 작성자 또는 팀장만 가능하다.
- 참석자 저장이 필요하면 별도 `meeting_attendees` N:M 테이블을 추가한다.

### 5.10 `spec_documents`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | 스펙 문서 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `created_by_user_id` | `BIGINT` | Y | FK | 문서 저장자 사용자 ID |
| `title` | `VARCHAR(200)` | Y |  | 문서 제목 |
| `content` | `TEXT` | Y |  | Markdown 기반 문서 내용 |
| `source_meeting_ids` | `TEXT` | N |  | 초안 생성에 사용한 회의록 ID 목록. 현재 구현은 쉼표 구분 문자열 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- 문서 저장자는 저장 시점에 현재 팀원이어야 한다.
- `source_meeting_ids`가 있으면 모든 회의록은 같은 팀 소속이어야 한다.
- 초안 생성 결과는 곧바로 저장하지 않고 사용자가 검토 후 저장한다.
- `source_meeting_ids`는 소규모 프로젝트의 단순 구현을 위해 문자열로 저장한다. 회의록별 근거 추적이나 회의록 삭제 영향 분석이 필요해지면 `spec_document_meetings(spec_document_id, meeting_id)` N:M 테이블로 분리한다.

### 5.11 `task_suggestions`

| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---:|---|---|
| `id` | `BIGINT` | Y | PK | task 추천 ID |
| `team_id` | `BIGINT` | Y | FK | 팀 ID |
| `spec_document_id` | `BIGINT` | Y | FK | 추천 근거 스펙 문서 ID |
| `title` | `VARCHAR(200)` | Y |  | 추천 task 제목 |
| `description` | `TEXT` | N |  | 추천 task 설명 |
| `priority` | `VARCHAR(20)` | Y |  | `LOW`, `MEDIUM`, `HIGH` |
| `due_date` | `DATE` | Y |  | 추천 마감일 |
| `accepted` | `BOOLEAN` | Y | IDX | 실제 task로 수락했는지 여부 |
| `created_at` | `DATETIME(6)` | Y |  | 생성 시각 |
| `updated_at` | `DATETIME(6)` | Y |  | 수정 시각 |

제약:

- 추천 생성자는 현재 팀원이어야 한다.
- `spec_document_id`는 같은 팀의 스펙 문서여야 한다.
- Gemini 응답이 없거나 파싱에 실패하면 local fallback 추천을 저장한다.
- 추천은 생성 즉시 실제 task가 되지 않는다.
- 수락 시 담당자 1명 이상을 받아 기존 task 생성 정책으로 실제 task를 생성한다.
- 이미 수락한 추천은 다시 수락할 수 없다.

## 6. MySQL DDL 초안

```sql
CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE teams (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  description TEXT NULL,
  password_hash VARCHAR(255) NULL,
  invite_code VARCHAR(16) NULL,
  leader_user_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_teams_name (name),
  UNIQUE KEY uk_teams_invite_code (invite_code),
  KEY idx_teams_leader_user_id (leader_user_id),
  CONSTRAINT fk_teams_leader_user
    FOREIGN KEY (leader_user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE team_members (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  leader_team_id BIGINT GENERATED ALWAYS AS (
    CASE WHEN role = 'LEADER' THEN team_id ELSE NULL END
  ) STORED,
  joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_members_team_user (team_id, user_id),
  UNIQUE KEY uk_team_members_one_leader (leader_team_id),
  KEY idx_team_members_user_id (user_id),
  CONSTRAINT ck_team_members_role
    CHECK (role IN ('LEADER', 'MEMBER')),
  CONSTRAINT fk_team_members_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tasks (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_tasks_id_team (id, team_id),
  KEY idx_tasks_team_completed (team_id, completed),
  KEY idx_tasks_team_due_date (team_id, due_date),
  KEY idx_tasks_created_by_user_id (created_by_user_id),
  CONSTRAINT ck_tasks_priority
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  CONSTRAINT fk_tasks_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE task_assignees (
  task_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (task_id, user_id),
  KEY idx_task_assignees_team_user (team_id, user_id),
  KEY idx_task_assignees_user_id (user_id),
  CONSTRAINT fk_task_assignees_task_team
    FOREIGN KEY (task_id, team_id) REFERENCES tasks (id, team_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_assignees_team_member
    FOREIGN KEY (team_id, user_id) REFERENCES team_members (team_id, user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE task_comments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_task_comments_task_id (task_id),
  KEY idx_task_comments_user_id (user_id),
  CONSTRAINT fk_task_comments_task
    FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_comments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE retrospectives (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  yesterday_work TEXT NULL,
  today_plan TEXT NULL,
  note TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_retrospectives_id_team (id, team_id),
  KEY idx_retrospectives_team_created_at (team_id, created_at),
  KEY idx_retrospectives_author_user_id (author_user_id),
  CONSTRAINT fk_retrospectives_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_retrospectives_author_user
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE retrospective_collaborators (
  retrospective_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (retrospective_id, user_id),
  KEY idx_retro_collaborators_team_user (team_id, user_id),
  KEY idx_retro_collaborators_user_id (user_id),
  CONSTRAINT fk_retro_collaborators_retrospective_team
    FOREIGN KEY (retrospective_id, team_id) REFERENCES retrospectives (id, team_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_retro_collaborators_team_member
    FOREIGN KEY (team_id, user_id) REFERENCES team_members (team_id, user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE meetings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  meeting_at DATETIME(6) NOT NULL,
  raw_content TEXT NULL,
  summary TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_meetings_team_meeting_at (team_id, meeting_at),
  KEY idx_meetings_author_user_id (author_user_id),
  CONSTRAINT fk_meetings_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_meetings_author_user
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE spec_documents (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  created_by_user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  source_meeting_ids TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_spec_documents_team_updated_at (team_id, updated_at),
  KEY idx_spec_documents_created_by_user_id (created_by_user_id),
  CONSTRAINT fk_spec_documents_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_spec_documents_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE task_suggestions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  spec_document_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  due_date DATE NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_task_suggestions_spec_document_created_at (spec_document_id, created_at),
  KEY idx_task_suggestions_team_accepted (team_id, accepted),
  CONSTRAINT ck_task_suggestions_priority
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  CONSTRAINT fk_task_suggestions_team
    FOREIGN KEY (team_id) REFERENCES teams (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_suggestions_spec_document
    FOREIGN KEY (spec_document_id) REFERENCES spec_documents (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 7. Spring Data JPA Entity 설계 메모

### 7.1 Enum

Java enum은 문자열로 저장한다.

```java
public enum TeamRole {
    LEADER, MEMBER
}

public enum TaskPriority {
    LOW, MEDIUM, HIGH
}
```

JPA에서는 `@Enumerated(EnumType.STRING)`을 사용한다.

### 7.2 복합 키

아래 테이블은 복합 PK를 사용한다.

| 테이블 | 복합 PK | JPA 권장 방식 |
|---|---|---|
| `task_assignees` | `(task_id, user_id)` | `@Embeddable` + `@EmbeddedId` |
| `retrospective_collaborators` | `(retrospective_id, user_id)` | `@Embeddable` + `@EmbeddedId` |

### 7.3 Generated column

`team_members.leader_team_id`는 DB 제약용 generated column이다.

JPA Entity에는 반드시 매핑하지 않아도 된다. 매핑해야 한다면 읽기 전용으로 둔다.

```java
@Column(name = "leader_team_id", insertable = false, updatable = false)
private Long leaderTeamId;
```

### 7.4 Auditing

`created_at`, `updated_at`은 Spring Data JPA Auditing으로 관리한다.

권장 annotation:

- `@CreatedDate`
- `@LastModifiedDate`
- `@EntityListeners(AuditingEntityListener.class)`

DB default는 직접 SQL 삽입 또는 누락 상황을 위한 fallback으로 둔다.

## 8. Service Layer 필수 검증

아래 조건은 DB 제약만으로는 완전히 보장하기 어렵거나, 사용자에게 명확한 오류를 주기 위해 service layer에서 검증한다.

| 검증 | 이유 |
|---|---|
| 팀 생성 시 생성자를 `LEADER` 팀원으로 함께 저장 | `teams`와 `team_members`의 순환 invariant |
| 팀장 변경 시 기존 팀장 demote, 새 팀장 promote, `teams.leader_user_id` 동시 갱신 | 팀장 1명 보장 |
| 팀장 본인 제거 차단 | 팀장 1명 보장 |
| 팀원 제거 전 해당 팀원이 유일 담당자인 task가 있는지 확인 | task 담당자 1명 이상 보장 |
| task 생성/수정 시 담당자 1명 이상 확인 | DB count 제약 불가 |
| task 생성자, 댓글 작성자, 회고록 작성자가 현재 팀원인지 확인 | 작성 기록 유지를 위해 FK를 `team_members`에 직접 묶지 않음 |
| 회고록 작성자를 공동 작업자로 중복 저장하지 않음 | cross-table condition |
| 회고록 공동 작업자 변경 권한 확인 | 작성자만 가능 |
| 회의록 작성자, 조회자 권한 확인 | 작성자는 현재 팀원, 조회자는 같은 팀원이어야 함 |
| 회의록 수정/삭제 권한 확인 | 작성자 또는 팀장만 가능 |
| 스펙 문서 초안 생성/저장 시 원본 회의록 팀 소속 확인 | 다른 팀 회의록을 근거로 참조하지 않게 함 |
| 댓글 수정/삭제 권한 확인 | 작성자만 가능 |
| 팀 비밀번호 변경 권한 확인 | 팀장만 가능 |
| 팀 초대코드 재발급 권한 확인 | 팀장만 가능 |
| 팀 설명 수정 권한 확인 | 팀장만 가능 |

## 9. 삭제 및 보존 정책

| 상황 | 정책 |
|---|---|
| 회원 탈퇴 | MVP 제외 |
| 팀 삭제 | 팀 하위 task, 댓글, 회고록, 공동 작업자 연결 삭제 |
| 팀원 제거 | 작성한 task, 댓글, 회고록은 유지 |
| 팀원 제거 | task 담당자 연결과 회고록 공동 작업자 연결은 제거 가능 |
| task 삭제 | 담당자 연결과 댓글 삭제 |
| 회고록 삭제 | 공동 작업자 연결 삭제 |

팀 삭제는 MVP 핵심 기능에는 포함되어 있지 않지만, DB FK는 향후 팀 삭제가 생겨도 하위 데이터를 정리할 수 있게 설계한다.

## 10. 다음 단계

이 DB 스키마를 기준으로 다음 문서를 파생한다.

1. Spring Boot 패키지 구조와 Entity 설계 문서
2. React 화면 컴포넌트 구조 문서
