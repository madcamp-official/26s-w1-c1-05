# Scrum Helper API Spec

## 1. 문서 목적

이 문서는 `SPEC.md`와 `DB_SCHEMA.md`에서 확정된 Scrum Helper MVP를 REST API로 변환한 문서다.

Spring Boot Controller, Service, DTO, React API client는 이 문서를 기준으로 구현한다.

## 2. 기본 규칙

### 2.1 Base URL

```text
/api
```

로컬 개발 예시:

```text
http://localhost:8080/api
```

### 2.2 인증

로그인 성공 시 서버는 JWT access token을 반환한다.

클라이언트는 인증이 필요한 API에 아래 헤더를 붙인다.

```http
Authorization: Bearer <accessToken>
```

MVP에서는 refresh token과 서버 측 token blacklist를 구현하지 않는다. 로그아웃은 클라이언트가 저장한 token을 삭제하는 방식이다.

### 2.3 Content Type

요청과 응답은 JSON을 사용한다.

```http
Content-Type: application/json
```

### 2.4 공통 성공 응답

```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

### 2.5 공통 실패 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 수 있는 오류 메시지"
  }
}
```

### 2.6 상태 코드

| HTTP | 의미 |
|---:|---|
| 200 | 조회, 수정, 삭제 성공 |
| 201 | 생성 성공 |
| 400 | 요청값 오류 또는 정책 위반 |
| 401 | 로그인 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | unique 충돌 또는 현재 상태와 충돌 |
| 500 | 서버 오류 |

## 3. 공통 DTO

### 3.1 UserSummary

```json
{
  "id": 1,
  "name": "안종화",
  "email": "owner@example.com"
}
```

### 3.2 TeamSummary

팀 목록에서 사용한다. 모든 로그인 사용자가 볼 수 있지만, 비밀번호 해시는 절대 노출하지 않는다.

```json
{
  "id": 1,
  "name": "Scrum Helper Alpha",
  "description": "공통과제 1주차 팀",
  "hasPassword": true,
  "memberCount": 3,
  "leader": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "joined": true,
  "myRole": "LEADER"
}
```

`myRole`은 가입하지 않은 팀이면 `null`이다.

### 3.3 TeamMemberResponse

```json
{
  "id": 10,
  "teamId": 1,
  "user": {
    "id": 2,
    "name": "김민준",
    "email": "member@example.com"
  },
  "role": "MEMBER",
  "joinedAt": "2026-07-02T12:00:00"
}
```

### 3.4 TaskResponse

```json
{
  "id": 100,
  "teamId": 1,
  "title": "로그인 화면 구현",
  "description": "회원가입과 로그인 폼 구현",
  "priority": "HIGH",
  "dueDate": "2026-07-05",
  "completed": false,
  "createdBy": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "assignees": [
    {
      "id": 2,
      "name": "김민준",
      "email": "member@example.com"
    }
  ],
  "commentCount": 2,
  "createdAt": "2026-07-02T12:00:00",
  "updatedAt": "2026-07-02T12:00:00"
}
```

### 3.5 CommentResponse

```json
{
  "id": 1000,
  "taskId": 100,
  "author": {
    "id": 2,
    "name": "김민준",
    "email": "member@example.com"
  },
  "content": "API 연결 후 테스트하겠습니다.",
  "createdAt": "2026-07-02T12:10:00",
  "updatedAt": "2026-07-02T12:10:00"
}
```

### 3.6 RetrospectiveResponse

```json
{
  "id": 200,
  "teamId": 1,
  "title": "Day 1 회고",
  "yesterdayWork": "프로젝트 주제 확정",
  "todayPlan": "DB와 API 설계",
  "note": "Spring Security JWT 설정 확인 필요",
  "author": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "collaborators": [
    {
      "id": 2,
      "name": "김민준",
      "email": "member@example.com"
    }
  ],
  "createdAt": "2026-07-02T12:00:00",
  "updatedAt": "2026-07-02T12:00:00"
}
```

### 3.7 MeetingResponse

```json
{
  "id": 300,
  "teamId": 1,
  "title": "Day 1 회의",
  "meetingAt": "2026-07-03T14:40:00",
  "rawContent": "회의 원문 기록",
  "summary": "회의 요약",
  "author": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "createdAt": "2026-07-03T14:40:00",
  "updatedAt": "2026-07-03T14:40:00"
}
```

### 3.8 SpecDraftResponse

```json
{
  "title": "Scrum Helper Alpha 스펙 문서 초안",
  "content": "# 스펙 문서 초안\n\n## 프로젝트 목적\n...",
  "sourceMeetingIds": [300, 301],
  "generatedBy": "GEMINI"
}
```

`generatedBy`는 Gemini 호출 성공 시 `GEMINI`, API 키가 없거나 호출 실패 시 `LOCAL_FALLBACK`이다.

### 3.9 MeetingSummaryResponse

```json
{
  "meetingId": 300,
  "summary": "- 결정사항: JWT 기반 로그인 유지\n- 다음 액션: 스펙 초안 생성 API 검증",
  "generatedBy": "GEMINI",
  "meeting": {
    "id": 300,
    "teamId": 1,
    "title": "Day 1 회의",
    "meetingAt": "2026-07-03T14:40:00",
    "rawContent": "회의 원문 기록",
    "summary": "- 결정사항: JWT 기반 로그인 유지\n- 다음 액션: 스펙 초안 생성 API 검증",
    "author": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "createdAt": "2026-07-03T14:40:00",
    "updatedAt": "2026-07-03T14:45:00"
  }
}
```

`generatedBy`는 Gemini 호출 성공 시 `GEMINI`, API 키가 없거나 호출 실패 시 `LOCAL_FALLBACK`이다.
생성된 요약은 `meetings.summary`에 저장된다.

### 3.10 MeetingTranscriptionResponse

```json
{
  "transcript": "Speaker 1 [00:00]: 오늘은 task 추천 API를 검토하겠습니다.",
  "generatedBy": "GEMINI"
}
```

`generatedBy`는 Gemini 오디오 분석 성공 시 `GEMINI`, API 키가 없거나 호출 실패 시 `LOCAL_FALLBACK`이다.

### 3.11 SpecDocumentResponse

```json
{
  "id": 400,
  "teamId": 1,
  "title": "Scrum Helper Alpha 스펙 문서 초안",
  "content": "# 스펙 문서 초안\n\n## 프로젝트 목적\n...",
  "sourceMeetingIds": [300, 301],
  "createdBy": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "createdAt": "2026-07-03T16:20:00",
  "updatedAt": "2026-07-03T16:20:00"
}
```

### 3.12 TaskSuggestionResponse

```json
{
  "id": 500,
  "teamId": 1,
  "specDocumentId": 400,
  "title": "팀 가입 API 예외 처리 보강",
  "description": "비밀번호 팀, 초대코드 팀, 중복 가입 케이스를 정리한다.",
  "priority": "MEDIUM",
  "dueDate": "2026-07-06",
  "accepted": false,
  "createdAt": "2026-07-04T12:00:00",
  "updatedAt": "2026-07-04T12:00:00"
}
```

### 3.13 TeamLeaderboardResponse

```json
{
  "user": {
    "id": 2,
    "name": "김민준",
    "email": "member@example.com"
  },
  "completedTaskCount": 8,
  "rank": 1,
  "reputationLevel": "SAPLING"
}
```

`reputationLevel` 기준:

| Level | 조건 |
|---|---:|
| `SEED` | 완료 task 0개 |
| `SPROUT` | 완료 task 1개 이상 |
| `SAPLING` | 완료 task 5개 이상 |
| `OAK` | 완료 task 10개 이상 |

### 3.14 TaskDependencyResponse

```json
{
  "id": 1,
  "predecessorTaskId": 100,
  "predecessorTitle": "DB 스키마 작성",
  "predecessorCompleted": true,
  "successorTaskId": 101,
  "successorTitle": "API 구현",
  "successorCompleted": false,
  "createdAt": "2026-07-04T15:00:00"
}
```

### 3.15 NotificationEventResponse

```json
{
  "id": 1,
  "teamId": 1,
  "recipientUserId": 2,
  "type": "TASK_DEPENDENCY_READY",
  "sourceTaskId": 100,
  "targetTaskId": 101,
  "payload": "{\"message\":\"선행 task가 완료되어 후행 task를 진행할 수 있습니다.\"}",
  "delivered": false,
  "createdAt": "2026-07-04T15:10:00"
}
```

## 4. Auth API

### 4.1 회원가입

```http
POST /api/auth/signup
```

Request:

```json
{
  "name": "안종화",
  "email": "owner@example.com",
  "password": "password"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "accessToken": "jwt-token"
  },
  "message": "created"
}
```

Validation:

- `name`: required, blank 불가
- `email`: required, email 형식, unique
- `password`: required, blank 불가

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | 요청값 오류 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 가입된 이메일 |

### 4.2 로그인

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "owner@example.com",
  "password": "password"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "accessToken": "jwt-token"
  },
  "message": "ok"
}
```

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |

### 4.3 로그아웃

```http
POST /api/auth/logout
```

권한: 로그인 사용자

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "ok"
}
```

MVP에서는 서버 상태를 변경하지 않는다. 클라이언트가 token을 삭제한다.

### 4.4 내 정보 조회

```http
GET /api/me
```

권한: 로그인 사용자

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "안종화",
    "email": "owner@example.com"
  },
  "message": "ok"
}
```

## 5. Team API

### 5.1 전체 팀 목록 조회

```http
GET /api/teams
```

권한: 로그인 사용자

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `keyword` | N | 팀 이름 검색 |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Scrum Helper Alpha",
      "description": "공통과제 1주차 팀",
      "hasPassword": false,
      "memberCount": 3,
      "leader": {
        "id": 1,
        "name": "안종화",
        "email": "owner@example.com"
      },
      "joined": true,
      "myRole": "LEADER"
    }
  ],
  "message": "ok"
}
```

정책:

- 로그인한 사용자는 모든 팀 목록을 볼 수 있다.
- `passwordHash`는 응답하지 않는다.
- `hasPassword`만 응답한다.

### 5.2 팀 생성

```http
POST /api/teams
```

권한: 로그인 사용자

Request:

```json
{
  "name": "Scrum Helper Alpha",
  "description": "공통과제 1주차 팀",
  "password": "team-password"
}
```

`password`는 optional이다. `null`, 미전달, blank면 공개 팀으로 생성한다. 팀 생성 시 unique 초대코드가 자동으로 발급된다.

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Scrum Helper Alpha",
    "description": "공통과제 1주차 팀",
    "hasPassword": true,
    "inviteCode": "ABCD1234",
    "leader": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "myRole": "LEADER"
  },
  "message": "created"
}
```

Transaction:

1. `teams` row 생성
2. 생성자를 `team_members.role = LEADER`로 추가
3. `teams.leader_user_id`를 생성자 ID로 저장

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TEAM_NAME_ALREADY_EXISTS` | 409 | 팀 이름 중복 |
| `VALIDATION_ERROR` | 400 | 팀 이름 공백 |

### 5.3 팀 상세 조회

```http
GET /api/teams/{teamId}
```

권한: 팀원

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Scrum Helper Alpha",
    "description": "공통과제 1주차 팀",
    "hasPassword": true,
    "inviteCode": "ABCD1234",
    "leader": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "myRole": "LEADER",
    "createdAt": "2026-07-02T12:00:00",
    "updatedAt": "2026-07-02T12:00:00"
  },
  "message": "ok"
}
```

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TEAM_NOT_FOUND` | 404 | 팀 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 5.4 팀 대시보드 조회

```http
GET /api/teams/{teamId}/dashboard
```

권한: 팀원

Response `200`:

```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "memberCount": 3,
    "task": {
      "totalCount": 12,
      "completedCount": 5,
      "incompleteCount": 7,
      "overdueCount": 2,
      "dueSoonCount": 3
    },
    "retrospective": {
      "totalCount": 8,
      "myCount": 3,
      "collaboratingCount": 2
    }
  },
  "message": "ok"
}
```

`dueSoonCount`는 오늘부터 2일 이내 마감이고 미완료인 task 수다.

### 5.5 팀 가입

```http
POST /api/teams/{teamId}/join
```

권한: 로그인 사용자

Request:

```json
{
  "password": "team-password"
}
```

공개 팀은 request body 없이 호출해도 된다.

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "teamId": 1,
    "user": {
      "id": 2,
      "name": "김민준",
      "email": "member@example.com"
    },
    "role": "MEMBER",
    "joinedAt": "2026-07-02T12:00:00"
  },
  "message": "created"
}
```

정책:

- 공개 팀은 즉시 가입한다.
- 비밀번호 팀은 비밀번호가 일치해야 가입한다.
- 가입 후 기본 화면은 팀 대시보드다.
- 초대코드를 받은 사용자는 `POST /api/teams/join-by-invite`로 팀 비밀번호 없이 가입할 수 있다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TEAM_NOT_FOUND` | 404 | 팀 없음 |
| `ALREADY_TEAM_MEMBER` | 409 | 이미 가입한 팀 |
| `TEAM_PASSWORD_REQUIRED` | 400 | 비밀번호 팀인데 비밀번호 미입력 |
| `INVALID_TEAM_PASSWORD` | 401 | 팀 비밀번호 불일치 |

### 5.6 초대코드로 팀 가입

```http
POST /api/teams/join-by-invite
```

권한: 로그인 사용자

Request:

```json
{
  "inviteCode": "ABCD1234"
}
```

Response `201`: `TeamMemberResponse`

정책:

- 초대코드는 대소문자를 구분하지 않는다.
- 입력값의 공백과 하이픈은 제거하고 검증한다.
- 초대코드 가입은 공개/비밀번호 팀 여부와 무관하게 가입을 허용한다.
- 가입 후 기본 화면은 팀 대시보드다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `INVALID_INVITE_CODE` | 404 | 존재하지 않거나 재발급되어 만료된 초대코드 |
| `ALREADY_TEAM_MEMBER` | 409 | 이미 가입한 팀 |

### 5.7 팀 정보 수정

```http
PATCH /api/teams/{teamId}
```

권한: 팀장

Request:

```json
{
  "name": "Scrum Helper Alpha Updated",
  "description": "수정된 팀 설명"
}
```

Response `200`: 팀 상세 응답과 동일

정책:

- 팀 설명 수정은 팀장만 가능하다.
- 팀 이름도 팀장만 수정 가능하다.
- 팀 이름은 unique해야 한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `LEADER_ONLY` | 403 | 팀장이 아님 |
| `TEAM_NAME_ALREADY_EXISTS` | 409 | 팀 이름 중복 |

### 5.8 팀 비밀번호 변경

```http
PATCH /api/teams/{teamId}/password
```

권한: 팀장

Request:

```json
{
  "password": "new-team-password"
}
```

공개 팀으로 바꾸려면 `password`를 `null` 또는 blank로 보낸다.

```json
{
  "password": null
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "hasPassword": false
  },
  "message": "ok"
}
```

### 5.9 팀 초대코드 재발급

```http
PATCH /api/teams/{teamId}/invite-code
```

권한: 팀장

Response `200`:

```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "inviteCode": "WXYZ7890"
  },
  "message": "ok"
}
```

정책:

- 팀장만 초대코드를 재발급할 수 있다.
- 재발급 후 이전 초대코드는 사용할 수 없다.
- 초대코드는 팀 상세와 팀 설정 화면에서 팀원에게 표시한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TEAM_NOT_FOUND` | 404 | 팀 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |
| `LEADER_ONLY` | 403 | 팀장이 아님 |

### 5.10 팀원 목록 조회

```http
GET /api/teams/{teamId}/members
```

권한: 팀원

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "teamId": 1,
      "user": {
        "id": 1,
        "name": "안종화",
        "email": "owner@example.com"
      },
      "role": "LEADER",
      "joinedAt": "2026-07-02T12:00:00"
    }
  ],
  "message": "ok"
}
```

### 5.11 팀 리더보드 조회

```http
GET /api/teams/{teamId}/leaderboard
```

권한: 팀원

Response `200`: `TeamLeaderboardResponse[]`

정책:

- 완료 task 수는 task 담당자 기준으로 집계한다.
- 여러 담당자가 같은 완료 task에 배정되어 있으면 각 담당자에게 1개씩 집계한다.
- 미완료 task는 집계하지 않는다.
- 동점자는 같은 rank를 공유한다.
- 정렬은 완료 task 수 내림차순, 이름 오름차순, user id 오름차순이다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 5.12 내 알림 이벤트 조회

```http
GET /api/teams/{teamId}/notifications
```

권한: 팀원

Response `200`: `NotificationEventResponse[]`

정책:

- 현재 로그인 사용자가 수신자인 이벤트만 조회한다.
- 실제 이메일 발송은 하지 않고 DB에 mock event를 저장한다.
- `TASK_DEPENDENCY_READY`는 선행 task 완료로 후행 task 진행이 가능해졌음을 의미한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 5.13 팀원 제거

```http
DELETE /api/teams/{teamId}/members/{memberId}
```

권한: 팀장

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

정책:

- 팀장은 팀원을 제거할 수 있다.
- 팀장은 본인을 제거할 수 없다.
- 제거 대상이 팀장이면 제거할 수 없다.
- 제거 대상이 어떤 task의 유일한 담당자라면 제거 전에 task 담당자를 재배정해야 한다.
- 제거 대상이 회고록 공동 작업자라면 공동 작업자 권한은 제거된다.
- 제거 대상이 작성한 task, 댓글, 회고록은 유지된다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `LEADER_ONLY` | 403 | 팀장이 아님 |
| `CANNOT_REMOVE_SELF` | 400 | 본인 제거 시도 |
| `CANNOT_REMOVE_LEADER` | 400 | 팀장 제거 시도 |
| `REASSIGN_TASK_REQUIRED` | 409 | 제거 대상이 유일 담당자인 task 존재 |

### 5.14 팀장 변경

```http
PATCH /api/teams/{teamId}/leader
```

권한: 팀장

Request:

```json
{
  "newLeaderUserId": 2
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "previousLeader": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "newLeader": {
      "id": 2,
      "name": "김민준",
      "email": "member@example.com"
    }
  },
  "message": "ok"
}
```

Transaction:

1. 기존 팀장의 `team_members.role`을 `MEMBER`로 변경
2. 새 팀장의 `team_members.role`을 `LEADER`로 변경
3. `teams.leader_user_id`를 새 팀장 ID로 변경

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `LEADER_ONLY` | 403 | 팀장이 아님 |
| `TARGET_NOT_TEAM_MEMBER` | 400 | 새 팀장이 팀원이 아님 |
| `ALREADY_LEADER` | 409 | 이미 팀장인 사용자 지정 |

## 6. Task API

### 6.1 task 목록 조회

```http
GET /api/teams/{teamId}/tasks
```

권한: 팀원

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `completed` | N | `true` 또는 `false` |
| `priority` | N | `LOW`, `MEDIUM`, `HIGH` |
| `assigneeId` | N | 담당자 user ID |
| `dueFrom` | N | `YYYY-MM-DD` |
| `dueTo` | N | `YYYY-MM-DD` |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "teamId": 1,
      "title": "로그인 화면 구현",
      "description": "회원가입과 로그인 폼 구현",
      "priority": "HIGH",
      "dueDate": "2026-07-05",
      "completed": false,
      "createdBy": {
        "id": 1,
        "name": "안종화",
        "email": "owner@example.com"
      },
      "assignees": [
        {
          "id": 2,
          "name": "김민준",
          "email": "member@example.com"
        }
      ],
      "commentCount": 0,
      "createdAt": "2026-07-02T12:00:00",
      "updatedAt": "2026-07-02T12:00:00"
    }
  ],
  "message": "ok"
}
```

### 6.2 내 담당 task 목록 조회

```http
GET /api/teams/{teamId}/tasks/my
```

권한: 팀원

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `completed` | N | `true` 또는 `false` |

Response `200`: `TaskResponse[]`

정책:

- 현재 로그인 사용자가 담당자로 배정된 task만 반환한다.
- 완료 여부 필터가 없으면 완료/미완료를 모두 반환한다.
- 정렬은 미완료 우선, 마감일 오름차순, 생성일 오름차순이다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 6.3 task 생성

```http
POST /api/teams/{teamId}/tasks
```

권한: 팀원

Request:

```json
{
  "title": "로그인 화면 구현",
  "description": "회원가입과 로그인 폼 구현",
  "priority": "HIGH",
  "dueDate": "2026-07-05",
  "assigneeUserIds": [2, 3]
}
```

Response `201`: `TaskResponse`

Validation:

- `title`: required, blank 불가
- `priority`: `LOW`, `MEDIUM`, `HIGH`
- `dueDate`: required
- `assigneeUserIds`: 1명 이상 필수
- 모든 담당자는 해당 팀의 팀원이어야 한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `NOT_TEAM_MEMBER` | 403 | 요청자가 팀원이 아님 |
| `ASSIGNEE_REQUIRED` | 400 | 담당자 0명 |
| `ASSIGNEE_NOT_TEAM_MEMBER` | 400 | 담당자가 팀원이 아님 |

### 6.4 task 상세 조회

```http
GET /api/tasks/{taskId}
```

권한: task가 속한 팀의 팀원

Response `200`: `TaskResponse`

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TASK_NOT_FOUND` | 404 | task 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 6.5 task 수정

```http
PATCH /api/tasks/{taskId}
```

권한: task가 속한 팀의 팀원

Request:

```json
{
  "title": "로그인/회원가입 화면 구현",
  "description": "폼 validation 포함",
  "priority": "MEDIUM",
  "dueDate": "2026-07-06",
  "assigneeUserIds": [2]
}
```

Response `200`: `TaskResponse`

정책:

- 팀원 모두 task를 수정할 수 있다.
- 담당자는 1명 이상이어야 한다.
- 담당자는 같은 팀의 팀원만 가능하다.

### 6.6 task 상태 변경

```http
PATCH /api/tasks/{taskId}/status
```

권한: task가 속한 팀의 팀원

Request:

```json
{
  "status": "DONE"
}
```

Response `200`: `TaskResponse`

정책:

- task 상태 변경은 팀원 모두 가능하다.
- 상태는 `BACKLOG`, `IN_PROGRESS`, `DONE`을 사용한다.
- `DONE` 상태는 완료 task로 집계한다.
- 완료 처리되는 task가 선행 task로 등록되어 있으면 후행 task 담당자에게 `TASK_DEPENDENCY_READY` notification event를 생성한다.
- 같은 선행/후행 task 조합과 같은 수신자에 대해 중복 notification event는 생성하지 않는다.

### 6.7 task 삭제

```http
DELETE /api/tasks/{taskId}
```

권한: task가 속한 팀의 팀원

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

정책:

- 팀원 모두 task를 삭제할 수 있다.
- task 삭제 시 담당자 연결과 댓글이 함께 삭제된다.
- task 삭제 시 해당 task가 포함된 전후 관계도 함께 삭제된다.

### 6.8 task 관계 전체 조회

```http
GET /api/teams/{teamId}/task-dependencies
```

권한: 팀원

Response `200`: `TaskDependencyResponse[]`

정책:

- 팀 단위 task 전후 관계를 모두 조회한다.
- 선행 task와 후행 task의 완료 상태를 함께 응답한다.

### 6.9 선행 task 추가

```http
POST /api/tasks/{taskId}/dependencies
```

권한: 후행 task가 속한 팀의 팀원

`taskId`는 후행 task ID다.

Request:

```json
{
  "predecessorTaskId": 100
}
```

Response `201`: `TaskDependencyResponse`

정책:

- 선행 task와 후행 task는 같은 팀에 속해야 한다.
- 자기 자신을 선행 task로 지정할 수 없다.
- 이미 존재하는 관계는 중복 저장하지 않는다.
- 새 관계로 순환 의존성이 생기면 저장하지 않는다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TASK_NOT_FOUND` | 404 | task 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |
| `TASK_NOT_SAME_TEAM` | 400 | 서로 다른 팀 task 관계 생성 시도 |
| `TASK_DEPENDENCY_SELF_REFERENCE` | 400 | 자기 자신을 선행 task로 지정 |
| `TASK_DEPENDENCY_ALREADY_EXISTS` | 409 | 이미 존재하는 관계 |
| `TASK_DEPENDENCY_CYCLE` | 409 | 순환 의존성 발생 |

### 6.10 선행 task 관계 삭제

```http
DELETE /api/tasks/{taskId}/dependencies/{predecessorTaskId}
```

권한: 후행 task가 속한 팀의 팀원

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TASK_DEPENDENCY_NOT_FOUND` | 404 | task 관계 없음 |

### 6.11 Todo 완료 프롬프트 생성

```http
POST /api/teams/{teamId}/todos/prompt
```

권한: 팀원

Response `200`:

```json
{
  "prompt": "아래 Todo task들을 모두 완료하기 위한 실행 계획을 세워줘...",
  "generatedBy": "GEMINI"
}
```

정책:

- 현재 로그인 사용자의 Todo list에 포함된 task를 기준으로 생성한다.
- Todo list에 task가 없으면 `VALIDATION_ERROR`를 반환한다.
- Gemini API 키가 없거나 호출이 실패하면 `LOCAL_FALLBACK` 프롬프트를 반환한다.

### 6.12 연관성 기반 AI task 단건 추천

```http
POST /api/teams/{teamId}/tasks/ai-recommendation
```

권한: 팀원

Response `200`:

```json
{
  "title": "AI 추천 task",
  "description": "기존 task와 연결되는 후속 작업입니다.",
  "priority": "MEDIUM",
  "dueDate": "2026-07-07",
  "reason": "미완료 task와 dependency 흐름을 고려했습니다.",
  "generatedBy": "GEMINI"
}
```

정책:

- 팀의 기존 task, 담당자, 상태, dependency 관계를 Gemini 프롬프트 맥락으로 넘겨 task 1개만 추천받는다.
- 이 API는 task를 저장하지 않는다.
- Gemini API 키가 없거나 JSON 파싱에 실패하면 `LOCAL_FALLBACK` 추천을 반환한다.

### 6.13 AI 추천 task 수락 및 Todo 반영

```http
POST /api/teams/{teamId}/tasks/ai-recommendation/accept
```

권한: 팀원

Request:

```json
{
  "title": "AI 추천 task",
  "description": "기존 task와 연결되는 후속 작업입니다.",
  "priority": "MEDIUM",
  "dueDate": "2026-07-07"
}
```

Response `201`: `TaskResponse`

정책:

- 추천 내용을 실제 task로 생성한다.
- 생성된 task의 담당자는 현재 로그인 사용자 1명으로 지정한다.
- 생성된 task는 현재 로그인 사용자의 Todo list 마지막에 즉시 추가한다.

## 7. Task Comment API

### 7.1 댓글 목록 조회

```http
GET /api/tasks/{taskId}/comments
```

권한: task가 속한 팀의 팀원

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1000,
      "taskId": 100,
      "author": {
        "id": 2,
        "name": "김민준",
        "email": "member@example.com"
      },
      "content": "API 연결 후 테스트하겠습니다.",
      "createdAt": "2026-07-02T12:10:00",
      "updatedAt": "2026-07-02T12:10:00"
    }
  ],
  "message": "ok"
}
```

### 7.2 댓글 작성

```http
POST /api/tasks/{taskId}/comments
```

권한: task가 속한 팀의 팀원

Request:

```json
{
  "content": "API 연결 후 테스트하겠습니다."
}
```

Response `201`: `CommentResponse`

### 7.3 댓글 수정

```http
PATCH /api/comments/{commentId}
```

권한: 댓글 작성자

Request:

```json
{
  "content": "API 연결 완료했습니다."
}
```

Response `200`: `CommentResponse`

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `COMMENT_AUTHOR_ONLY` | 403 | 작성자가 아님 |

### 7.4 댓글 삭제

```http
DELETE /api/comments/{commentId}
```

권한: 댓글 작성자

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

정책:

- 댓글 수정/삭제는 작성자만 가능하다.
- 팀장도 다른 사용자의 댓글을 수정/삭제할 수 없다.

## 8. Meeting API

### 8.1 회의록 목록 조회

```http
GET /api/teams/{teamId}/meetings
```

권한: 팀원

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 300,
      "teamId": 1,
      "title": "Day 1 회의",
      "meetingAt": "2026-07-03T14:40:00",
      "rawContent": "회의 원문 기록",
      "summary": "회의 요약",
      "author": {
        "id": 1,
        "name": "안종화",
        "email": "owner@example.com"
      },
      "createdAt": "2026-07-03T14:40:00",
      "updatedAt": "2026-07-03T14:40:00"
    }
  ],
  "message": "ok"
}
```

### 8.2 회의록 생성

```http
POST /api/teams/{teamId}/meetings
```

권한: 팀원

Request:

```json
{
  "title": "Day 1 회의",
  "meetingAt": "2026-07-03T14:40:00",
  "rawContent": "회의 원문 기록",
  "summary": "회의 요약"
}
```

Response `201`: `MeetingResponse`

Validation:

- `title`: required, blank 불가, 200자 이하
- `meetingAt`: required
- `rawContent`, `summary`: optional

### 8.3 녹음 파일 script 변환

```http
POST /api/teams/{teamId}/meetings/transcription
```

권한: 팀원

Request: `multipart/form-data`

| 이름 | 필수 | 설명 |
|---|---|---|
| `file` | Y | `audio/*`, `.mp3`, `.m4a`, `.wav`, `.webm`, `.ogg` 등 회의 녹음 파일 |

Response `200`: `MeetingTranscriptionResponse`

정책:

- 업로드 파일은 Gemini Files API에 업로드한 뒤 generateContent의 audio input으로 script 변환을 요청한다.
- Gemini API 키가 없거나 업로드/분석 호출이 실패하면 `LOCAL_FALLBACK` placeholder script를 반환한다.
- 반환된 script는 DB에 자동 저장하지 않는다. 프론트는 사용자가 검토한 뒤 회의록 `rawContent`에 저장한다.
- 실시간 transcription은 지원하지 않고, 업로드 파일 단위 변환만 지원한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | 파일 미첨부 또는 파일 읽기 실패 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 8.4 회의록 상세 조회

```http
GET /api/meetings/{meetingId}
```

권한: 회의록이 속한 팀의 팀원

Response `200`: `MeetingResponse`

### 8.5 회의록 수정

```http
PATCH /api/meetings/{meetingId}
```

권한: 작성자 또는 팀장

Request: 회의록 생성 request와 동일

Response `200`: `MeetingResponse`

### 8.6 회의록 삭제

```http
DELETE /api/meetings/{meetingId}
```

권한: 작성자 또는 팀장

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `MEETING_NOT_FOUND` | 404 | 회의록 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |
| `MEETING_AUTHOR_OR_LEADER_ONLY` | 403 | 작성자 또는 팀장이 아님 |

### 8.7 회의록 요약 생성

```http
POST /api/meetings/{meetingId}/summary
```

권한: 회의록 작성자 또는 팀장

Response `200`: `MeetingSummaryResponse`

정책:

- 회의록의 `rawContent`, 기존 `summary`, 제목, 회의 일시를 Gemini prompt에 포함한다.
- Gemini API 호출에 성공하면 `generatedBy = GEMINI`으로 응답한다.
- Gemini API 키가 없거나 호출/응답 파싱에 실패하면 로컬 규칙 기반 요약을 생성하고 `generatedBy = LOCAL_FALLBACK`으로 응답한다.
- 생성된 요약은 `meetings.summary`에 즉시 저장된다.
- 회의록 내용을 수정할 수 없는 팀원은 요약도 생성할 수 없다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `MEETING_NOT_FOUND` | 404 | 회의록 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |
| `MEETING_AUTHOR_OR_LEADER_ONLY` | 403 | 작성자 또는 팀장이 아님 |

## 9. Spec Document API

### 9.1 스펙 문서 목록 조회

```http
GET /api/teams/{teamId}/spec-documents
```

권한: 팀원

Response `200`: `SpecDocumentResponse[]`

### 9.2 회의록 기반 스펙 초안 생성

```http
POST /api/teams/{teamId}/spec-documents/draft
```

권한: 팀원

Request:

```json
{
  "meetingIds": [300, 301]
}
```

Response `200`: `SpecDraftResponse`

정책:

- 회의록은 1개 이상 선택해야 한다.
- 선택한 모든 회의록은 요청한 팀에 속해야 한다.
- `GEMINI_API_KEY`가 설정되어 있으면 Gemini API로 초안을 생성한다.
- Gemini 키가 없거나 API 호출에 실패하면 로컬 규칙 기반 초안을 생성한다.
- 초안 생성 결과는 즉시 DB에 저장하지 않고, 사용자가 검토 후 저장한다.
- 프롬프트에는 팀 이름, 회의록 제목, 회의 일시, 요약, 원문만 포함한다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | 회의록 미선택 |
| `MEETING_NOT_FOUND` | 404 | 선택한 회의록이 없거나 해당 팀 소속이 아님 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 9.3 스펙 문서 저장

```http
POST /api/teams/{teamId}/spec-documents
```

권한: 팀원

Request:

```json
{
  "title": "Scrum Helper Alpha 스펙 문서 초안",
  "content": "# 스펙 문서 초안\n\n## 프로젝트 목적\n...",
  "sourceMeetingIds": [300, 301]
}
```

Response `201`: `SpecDocumentResponse`

Validation:

- `title`: required, blank 불가, 200자 이하
- `content`: required, blank 불가
- `sourceMeetingIds`: optional. 값이 있으면 모두 같은 팀의 회의록이어야 한다.

### 9.4 스펙 문서 기반 task 추천 생성

```http
POST /api/spec-documents/{specDocumentId}/task-suggestions
```

권한: 스펙 문서가 속한 팀의 팀원

Response `201`: `TaskSuggestionResponse[]`

정책:

- 스펙 문서는 요청자가 속한 팀의 문서여야 한다.
- Gemini API 키가 설정되어 있으면 JSON task 후보 생성을 시도한다.
- Gemini 호출 또는 JSON 파싱에 실패하면 local fallback 추천 5개를 생성한다.
- 생성된 추천은 바로 실제 task가 되지 않는다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `SPEC_DOCUMENT_NOT_FOUND` | 404 | 스펙 문서 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |

### 9.5 task 추천 목록 조회

```http
GET /api/spec-documents/{specDocumentId}/task-suggestions
```

권한: 스펙 문서가 속한 팀의 팀원

Response `200`: `TaskSuggestionResponse[]`

### 9.6 task 추천 수락

```http
POST /api/task-suggestions/{suggestionId}/accept
```

권한: 추천이 속한 팀의 팀원

Request:

```json
{
  "assigneeUserIds": [1, 2]
}
```

Response `201`: `TaskResponse`

정책:

- 수락 시 기존 task 생성 정책을 그대로 적용한다.
- 담당자는 1명 이상이어야 한다.
- 담당자는 같은 팀의 팀원이어야 한다.
- 이미 수락한 추천은 다시 수락할 수 없다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `TASK_SUGGESTION_NOT_FOUND` | 404 | task 추천 없음 |
| `TASK_SUGGESTION_ALREADY_ACCEPTED` | 409 | 이미 수락한 추천 |
| `ASSIGNEE_REQUIRED` | 400 | 담당자 0명 |
| `ASSIGNEE_NOT_TEAM_MEMBER` | 400 | 담당자가 팀원이 아님 |

## 10. Retrospective API

### 10.1 회고록 목록 조회

```http
GET /api/teams/{teamId}/retrospectives
```

권한: 팀원

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `authorId` | N | 작성자 user ID |
| `collaboratorId` | N | 공동 작업자 user ID |

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 200,
      "teamId": 1,
      "title": "Day 1 회고",
      "yesterdayWork": "프로젝트 주제 확정",
      "todayPlan": "DB와 API 설계",
      "note": "Spring Security JWT 설정 확인 필요",
      "author": {
        "id": 1,
        "name": "안종화",
        "email": "owner@example.com"
      },
      "collaborators": [
        {
          "id": 2,
          "name": "김민준",
          "email": "member@example.com"
        }
      ],
      "createdAt": "2026-07-02T12:00:00",
      "updatedAt": "2026-07-02T12:00:00"
    }
  ],
  "message": "ok"
}
```

현재 구현은 목록 응답에도 본문 필드(`yesterdayWork`, `todayPlan`, `note`)를 포함한다.

### 10.2 회고록 생성

```http
POST /api/teams/{teamId}/retrospectives
```

권한: 팀원

Request:

```json
{
  "title": "Day 1 회고",
  "yesterdayWork": "프로젝트 주제 확정",
  "todayPlan": "DB와 API 설계",
  "note": "Spring Security JWT 설정 확인 필요",
  "collaboratorUserIds": [2]
}
```

Response `201`: `RetrospectiveResponse`

Validation:

- `title`: required, blank 불가
- `collaboratorUserIds`: optional
- 공동 작업자는 같은 팀의 팀원이어야 한다.
- 작성자는 공동 작업자 목록에 포함할 수 없다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `COLLABORATOR_NOT_TEAM_MEMBER` | 400 | 공동 작업자가 팀원이 아님 |
| `AUTHOR_CANNOT_BE_COLLABORATOR` | 400 | 작성자를 공동 작업자로 포함 |

### 10.3 회고록 상세 조회

```http
GET /api/retrospectives/{retrospectiveId}
```

권한: 회고록이 속한 팀의 팀원

Response `200`: `RetrospectiveResponse`

### 10.4 회고록 수정

```http
PATCH /api/retrospectives/{retrospectiveId}
```

권한: 작성자 또는 공동 작업자

Request:

```json
{
  "title": "Day 1 회고 수정",
  "yesterdayWork": "주제와 기능 범위 확정",
  "todayPlan": "API 문서 작성",
  "note": "JWT filter 구현 방식 확인",
  "collaboratorUserIds": [2, 3]
}
```

Response `200`: `RetrospectiveResponse`

정책:

- 작성자와 공동 작업자는 회고록 본문을 수정할 수 있다.
- 공동 작업자 목록은 작성자만 변경할 수 있다.
- 공동 작업자는 공동 작업자 목록을 기존과 동일하게 보낸 경우에만 본문을 수정할 수 있다.
- 작성자는 공동 작업자 목록에 포함하지 않는다.

Errors:

| Code | HTTP | 조건 |
|---|---:|---|
| `RETROSPECTIVE_EDITOR_ONLY` | 403 | 작성자 또는 공동 작업자가 아님 |
| `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` | 403 | 작성자가 아닌 사용자가 공동 작업자 목록 변경 시도 |
| `COLLABORATOR_NOT_TEAM_MEMBER` | 400 | 공동 작업자가 팀원이 아님 |
| `AUTHOR_CANNOT_BE_COLLABORATOR` | 400 | 작성자를 공동 작업자로 포함 |

### 10.5 회고록 삭제

```http
DELETE /api/retrospectives/{retrospectiveId}
```

권한: 작성자 또는 공동 작업자

Response `200`:

```json
{
  "success": true,
  "data": null,
  "message": "deleted"
}
```

정책:

- 회고록 삭제는 작성자와 공동 작업자만 가능하다.
- 팀장이라도 작성자나 공동 작업자가 아니면 삭제할 수 없다.
- 삭제 시 공동 작업자 연결도 삭제된다.

## 11. 권한 매트릭스

| API 영역 | 로그인 | 팀원 | 팀장 | 작성자 | 공동 작업자 |
|---|---:|---:|---:|---:|---:|
| 팀 목록 조회 | Y | - | - | - | - |
| 팀 생성 | Y | - | - | - | - |
| 팀 가입 | Y | - | - | - | - |
| 팀 상세/대시보드 | Y | Y | - | - | - |
| 팀 정보 수정 | Y | Y | Y | - | - |
| 팀 비밀번호 변경 | Y | Y | Y | - | - |
| 팀원 제거 | Y | Y | Y | - | - |
| 팀장 변경 | Y | Y | Y | - | - |
| task 조회/생성/수정/삭제 | Y | Y | - | - | - |
| task 완료 변경 | Y | Y | - | - | - |
| 댓글 작성/조회 | Y | Y | - | - | - |
| 댓글 수정/삭제 | Y | - | - | Y | - |
| 회의록 조회/생성 | Y | Y | - | - | - |
| 회의록 수정/삭제 | Y | Y | Y | Y | - |
| 스펙 문서 조회/초안 생성/저장 | Y | Y | - | - | - |
| 회고록 조회/생성 | Y | Y | - | - | - |
| 회고록 본문 수정/삭제 | Y | - | - | Y | Y |
| 회고록 공동 작업자 목록 변경 | Y | - | - | Y | - |

## 12. 주요 에러 코드

| Code | HTTP | 설명 |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | 요청값 검증 실패 |
| `UNAUTHORIZED` | 401 | 로그인 필요 |
| `INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이메일 중복 |
| `TEAM_NAME_ALREADY_EXISTS` | 409 | 팀 이름 중복 |
| `TEAM_NOT_FOUND` | 404 | 팀 없음 |
| `NOT_TEAM_MEMBER` | 403 | 팀원이 아님 |
| `LEADER_ONLY` | 403 | 팀장 권한 필요 |
| `ALREADY_TEAM_MEMBER` | 409 | 이미 가입한 팀 |
| `TEAM_PASSWORD_REQUIRED` | 400 | 팀 비밀번호 필요 |
| `INVALID_TEAM_PASSWORD` | 401 | 팀 비밀번호 불일치 |
| `INVALID_INVITE_CODE` | 404 | 초대코드 없음 또는 만료 |
| `CANNOT_REMOVE_SELF` | 400 | 팀장 본인 제거 시도 |
| `CANNOT_REMOVE_LEADER` | 400 | 팀장 제거 시도 |
| `REASSIGN_TASK_REQUIRED` | 409 | 팀원 제거 전 task 담당자 재배정 필요 |
| `TARGET_NOT_TEAM_MEMBER` | 400 | 대상 사용자가 팀원이 아님 |
| `TASK_NOT_FOUND` | 404 | task 없음 |
| `ASSIGNEE_REQUIRED` | 400 | task 담당자 1명 이상 필요 |
| `ASSIGNEE_NOT_TEAM_MEMBER` | 400 | 담당자가 팀원이 아님 |
| `COMMENT_NOT_FOUND` | 404 | 댓글 없음 |
| `COMMENT_AUTHOR_ONLY` | 403 | 댓글 작성자만 가능 |
| `RETROSPECTIVE_NOT_FOUND` | 404 | 회고록 없음 |
| `RETROSPECTIVE_EDITOR_ONLY` | 403 | 회고록 작성자 또는 공동 작업자만 가능 |
| `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` | 403 | 회고록 작성자만 공동 작업자 변경 가능 |
| `COLLABORATOR_NOT_TEAM_MEMBER` | 400 | 공동 작업자가 팀원이 아님 |
| `AUTHOR_CANNOT_BE_COLLABORATOR` | 400 | 작성자를 공동 작업자로 포함 |
| `MEETING_NOT_FOUND` | 404 | 회의록 없음 |
| `MEETING_AUTHOR_OR_LEADER_ONLY` | 403 | 회의록 작성자 또는 팀장만 가능 |
| `SPEC_DOCUMENT_NOT_FOUND` | 404 | 스펙 문서 없음 |
| `TASK_SUGGESTION_NOT_FOUND` | 404 | task 추천 없음 |
| `TASK_SUGGESTION_ALREADY_ACCEPTED` | 409 | 이미 수락한 task 추천 |
| `TASK_DEPENDENCY_NOT_FOUND` | 404 | task 관계 없음 |
| `TASK_DEPENDENCY_ALREADY_EXISTS` | 409 | 이미 존재하는 task 관계 |
| `TASK_DEPENDENCY_SELF_REFERENCE` | 400 | 자기 자신을 선행 task로 지정 |
| `TASK_DEPENDENCY_CYCLE` | 409 | 순환 의존성 발생 |
| `TASK_NOT_SAME_TEAM` | 400 | 서로 다른 팀 task 관계 생성 시도 |

## 13. 화면별 API 호출 흐름

### 13.1 로그인/회원가입 화면

1. `POST /api/auth/signup`
2. `POST /api/auth/login`
3. 성공 시 access token 저장
4. `GET /api/me`

### 13.2 팀 목록 화면

1. `GET /api/teams`
2. 공개 팀 가입: `POST /api/teams/{teamId}/join`
3. 비밀번호 팀 가입: password 입력 후 `POST /api/teams/{teamId}/join`
4. 초대코드 가입: inviteCode 입력 후 `POST /api/teams/join-by-invite`
5. 팀 생성: `POST /api/teams`
6. 가입/생성 성공 후 `GET /api/teams/{teamId}/dashboard`

### 13.3 팀 대시보드

1. `GET /api/teams/{teamId}`
2. `GET /api/teams/{teamId}/dashboard`
3. `GET /api/teams/{teamId}/members`
4. `GET /api/teams/{teamId}/leaderboard`
5. `GET /api/teams/{teamId}/notifications`

### 13.4 task 화면

1. `GET /api/teams/{teamId}/tasks`
2. 내 담당 task: `GET /api/teams/{teamId}/tasks/my`
3. AI task 단건 추천: `POST /api/teams/{teamId}/tasks/ai-recommendation`
4. AI 추천 task 추가 및 Todo 반영: `POST /api/teams/{teamId}/tasks/ai-recommendation/accept`
5. 생성: `POST /api/teams/{teamId}/tasks`
6. 수정: `PATCH /api/tasks/{taskId}`
7. 완료 변경: `PATCH /api/tasks/{taskId}/status`
8. 삭제: `DELETE /api/tasks/{taskId}`
9. 댓글 조회: `GET /api/tasks/{taskId}/comments`
10. Todo 완료 프롬프트 생성: `POST /api/teams/{teamId}/todos/prompt`

Dependency 전용 탭은 프론트 내비게이션에서 제거한다. Dependency API는 task 추천 맥락, 차단 표시, 내부 데이터 유지를 위해 백엔드에 남긴다.

### 13.5 회의록 화면

1. `GET /api/teams/{teamId}/meetings`
2. 생성: `POST /api/teams/{teamId}/meetings`
3. 녹음 파일 script 변환: `POST /api/teams/{teamId}/meetings/transcription`
4. 상세: `GET /api/meetings/{meetingId}`
5. 수정: `PATCH /api/meetings/{meetingId}`
6. 요약 생성: `POST /api/meetings/{meetingId}/summary`
7. 삭제: `DELETE /api/meetings/{meetingId}`

### 13.6 스펙 문서 화면

1. `GET /api/teams/{teamId}/meetings`
2. `GET /api/teams/{teamId}/spec-documents`
3. 초안 생성: `POST /api/teams/{teamId}/spec-documents/draft`
4. 저장: `POST /api/teams/{teamId}/spec-documents`
5. task 추천 생성: `POST /api/spec-documents/{specDocumentId}/task-suggestions`
6. task 추천 조회: `GET /api/spec-documents/{specDocumentId}/task-suggestions`
7. task 추천 수락: `POST /api/task-suggestions/{suggestionId}/accept`

### 13.7 회고록 화면

1. `GET /api/teams/{teamId}/retrospectives`
2. 생성: `POST /api/teams/{teamId}/retrospectives`
3. 상세: `GET /api/retrospectives/{retrospectiveId}`
4. 수정: `PATCH /api/retrospectives/{retrospectiveId}`
5. 삭제: `DELETE /api/retrospectives/{retrospectiveId}`

## 14. 구현 메모

### 14.1 Controller 분리

권장 Controller:

- `AuthController`
- `TeamController`
- `TeamMemberController`
- `TaskController`
- `TaskCommentController`
- `MeetingController`
- `SpecDocumentController`
- `RetrospectiveController`

### 14.2 Service 필수 transaction

아래 API는 반드시 transaction으로 처리한다.

| API | 이유 |
|---|---|
| 팀 생성 | `teams`, `team_members` 동시 생성 |
| 팀장 변경 | 기존 팀장 demote, 새 팀장 promote, `teams.leader_user_id` 갱신 |
| 팀원 제거 | 담당자/공동 작업자 연결 정리 |
| task 생성/수정 | task와 담당자 목록 동시 저장 |
| 회의록 생성/수정/삭제 | 작성자 또는 팀장 권한 확인 후 저장 |
| 스펙 문서 저장 | 원본 회의록 팀 소속 검증 후 저장 |
| task 추천 생성/수락 | 스펙 문서 팀 소속 검증, 수락 시 task 생성과 accepted 변경 |
| 회고록 생성/수정 | 회고록과 공동 작업자 목록 동시 저장 |

### 14.3 노출 금지 필드

아래 필드는 API 응답에 절대 포함하지 않는다.

- `users.password_hash`
- `teams.password_hash`
