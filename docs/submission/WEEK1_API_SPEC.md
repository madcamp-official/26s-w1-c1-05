# Scrum Helper API Spec

Base URL:

```text
/api
```

인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더를 사용한다.

## 1. 공통 응답

성공:

```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

실패:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 오류 메시지"
  }
}
```

주요 상태 코드:

| HTTP | 의미 |
|---:|---|
| 200 | 조회/수정/삭제 성공 |
| 201 | 생성 성공 |
| 400 | 요청값 오류 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복/상태 충돌 |

## 2. Auth

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password }` | `{ user, accessToken }` | `EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR` |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken }` | `INVALID_CREDENTIALS` |
| POST | `/auth/logout` | 없음 | `null` | `UNAUTHORIZED` |
| GET | `/me` | 없음 | `UserSummary` | `UNAUTHORIZED` |
| PATCH | `/me` | `{ name, title, bio, contact }` | `UserSummary` | `UNAUTHORIZED`, `VALIDATION_ERROR` |

## 3. User Profile

| Method | Path | 설명 |
|---|---|---|
| GET | `/users/me/profile` | 내 프로필 조회 |
| GET | `/users/{userId}/profile` | 다른 사용자 프로필 조회 |

## 4. Team

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams` | query `keyword` | `TeamSummary[]` | `UNAUTHORIZED` |
| POST | `/teams` | `{ name, description, password }` | `TeamDetail` | `TEAM_NAME_ALREADY_EXISTS` |
| GET | `/teams/{teamId}` | 없음 | `TeamDetail` | `TEAM_NOT_FOUND`, `NOT_TEAM_MEMBER` |
| GET | `/teams/{teamId}/dashboard` | 없음 | `TeamDashboard` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/join` | `{ password }` optional | `TeamMember` | `TEAM_PASSWORD_REQUIRED`, `INVALID_TEAM_PASSWORD`, `ALREADY_TEAM_MEMBER` |
| POST | `/teams/join-by-invite` | `{ inviteCode }` | `TeamMember` | `INVALID_INVITE_CODE`, `ALREADY_TEAM_MEMBER` |
| GET | `/teams/{teamId}/members` | 없음 | `TeamMember[]` | `NOT_TEAM_MEMBER` |
| GET | `/teams/{teamId}/leaderboard` | 없음 | `LeaderboardRow[]` | `NOT_TEAM_MEMBER` |
| GET | `/teams/{teamId}/profiles/{userId}` | 없음 | `TeamMemberProfile` | `NOT_TEAM_MEMBER` |
| PATCH | `/teams/{teamId}` | `{ name, description }` | `TeamDetail` | `LEADER_ONLY`, `TEAM_NAME_ALREADY_EXISTS` |
| PATCH | `/teams/{teamId}/password` | `{ password }` | `{ teamId, hasPassword }` | `LEADER_ONLY` |
| PATCH | `/teams/{teamId}/invite-code` | 없음 | `{ teamId, inviteCode }` | `LEADER_ONLY` |
| PATCH | `/teams/{teamId}/leader` | `{ newLeaderUserId }` | `TransferLeaderResponse` | `LEADER_ONLY`, `TARGET_NOT_TEAM_MEMBER`, `ALREADY_LEADER` |
| DELETE | `/teams/{teamId}/members/{memberId}` | 없음 | `null` | `CANNOT_REMOVE_SELF`, `CANNOT_REMOVE_LEADER`, `REASSIGN_TASK_REQUIRED` |

## 5. Meeting

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/meetings` | 없음 | `Meeting[]` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/meetings` | `{ title, meetingAt, rawContent, summary }` | `Meeting` | `VALIDATION_ERROR` |
| POST | `/teams/{teamId}/meetings/transcription` | multipart `file` | `{ transcript, generatedBy }` | `VALIDATION_ERROR`, `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/meetings/summary-draft` | 회의 내용 | `{ summary, generatedBy }` | `NOT_TEAM_MEMBER` |
| GET | `/meetings/{meetingId}` | 없음 | `Meeting` | `MEETING_NOT_FOUND`, `NOT_TEAM_MEMBER` |
| PATCH | `/meetings/{meetingId}` | `{ title, meetingAt, rawContent, summary }` | `Meeting` | `MEETING_AUTHOR_OR_LEADER_ONLY` |
| POST | `/meetings/{meetingId}/summary` | 없음 | `{ meeting, summary, generatedBy }` | `MEETING_AUTHOR_OR_LEADER_ONLY` |
| DELETE | `/meetings/{meetingId}` | 없음 | `null` | `MEETING_AUTHOR_OR_LEADER_ONLY` |

`generatedBy`는 `GEMINI` 또는 `LOCAL_FALLBACK`이다.

## 6. Spec Document

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/spec-documents` | 없음 | `SpecDocument[]` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/spec-documents/draft` | `{ meetingIds }` | `{ title, content, sourceMeetingIds, generatedBy }` | `VALIDATION_ERROR`, `MEETING_NOT_FOUND` |
| POST | `/teams/{teamId}/spec-documents` | `{ title, content, sourceMeetingIds }` | `SpecDocument` | `VALIDATION_ERROR` |
| GET | `/spec-documents/{documentId}` | 없음 | `SpecDocument` | `SPEC_DOCUMENT_NOT_FOUND`, `NOT_TEAM_MEMBER` |
| PATCH | `/spec-documents/{documentId}` | `{ title, content, sourceMeetingIds }` | `SpecDocument` | `SPEC_DOCUMENT_AUTHOR_OR_LEADER_ONLY` |
| DELETE | `/spec-documents/{documentId}` | 없음 | `null` | `SPEC_DOCUMENT_AUTHOR_OR_LEADER_ONLY` |
| PATCH | `/spec-documents/{documentId}/main` | 없음 | `SpecDocument` | `NOT_TEAM_MEMBER` |

정책:

- Spec draft는 선택한 회의록만 근거로 생성한다.
- draft 생성 결과는 자동 저장하지 않고 사용자가 저장한다.
- Main Spec은 팀 기준 문서로 표시한다.

## 7. Task Suggestion

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/task-suggestions` | query `specDocumentId` optional | `TaskSuggestion[]` | `NOT_TEAM_MEMBER` |
| POST | `/task-suggestions/{suggestionId}/accept` | `{ assigneeUserIds }` | `Task` | `ASSIGNEE_REQUIRED`, `ASSIGNEE_NOT_TEAM_MEMBER`, `TASK_SUGGESTION_ALREADY_ACCEPTED` |
| POST | `/task-suggestions/{suggestionId}/dismiss` | 없음 | `TaskSuggestion` | `TASK_SUGGESTION_NOT_FOUND` |

## 8. Task

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/tasks` | query filters | `Task[]` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/tasks` | `{ title, description, priority, assigneeUserIds }` | `Task` | `TASK_TITLE_DUPLICATE`, `ASSIGNEE_REQUIRED` |
| POST | `/teams/{teamId}/tasks/ai-recommendation` | `{ forceRemote? }` optional | `AiTaskRecommendation` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/tasks/ai-recommendation/accept` | `{ taskId }` | `Task` | `TODO_TASK_NOT_ASSIGNED`, `TASK_NOT_FOUND` |
| GET | `/teams/{teamId}/tasks/my` | query `completed` optional | `Task[]` | `NOT_TEAM_MEMBER` |
| GET | `/tasks/{taskId}` | 없음 | `Task` | `TASK_NOT_FOUND`, `NOT_TEAM_MEMBER` |
| PATCH | `/tasks/{taskId}` | `{ title, description, priority, assigneeUserIds }` | `Task` | `ASSIGNEE_REQUIRED` |
| PATCH | `/tasks/{taskId}/status` | `{ status }` | `Task` | `TASK_NOT_FOUND` |
| DELETE | `/tasks/{taskId}` | 없음 | `null` | `TASK_NOT_FOUND` |

Task status:

```text
BACKLOG, IN_PROGRESS, DONE
```

Task priority:

```text
LOW, MEDIUM, HIGH
```

## 9. Todo

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/todos` | 없음 | `TodoList` | `NOT_TEAM_MEMBER` |
| PATCH | `/teams/{teamId}/todos` | `{ taskIds }` | `TodoList` | `TODO_TASK_NOT_ASSIGNED` |
| POST | `/teams/{teamId}/todos/prompt` | `{ taskIds, forceRemote }` | `{ prompt, generatedBy }` | `NOT_TEAM_MEMBER` |

정책:

- Todo에는 본인 담당 Task만 추가할 수 있다.
- Todo에 추가하면 Task가 `IN_PROGRESS`로 이동한다.
- Task를 `DONE`으로 변경하면 Todo에서 제거한다.
- 추천은 중요도 높은 순, 중요도가 같으면 오래된 Task 순으로 최대 3개 표시한다.
- Todo가 5개 이상이면 추가 추천을 하지 않는다.

## 10. Task Comment

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/tasks/{taskId}/comments` | 없음 | `TaskComment[]` | `NOT_TEAM_MEMBER` |
| POST | `/tasks/{taskId}/comments` | `{ content }` | `TaskComment` | `VALIDATION_ERROR` |
| PATCH | `/comments/{commentId}` | `{ content }` | `TaskComment` | `COMMENT_AUTHOR_ONLY` |
| DELETE | `/comments/{commentId}` | 없음 | `null` | `COMMENT_AUTHOR_ONLY` |

## 11. Retrospective

| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/teams/{teamId}/retrospectives` | query `authorId`, `collaboratorId` optional | `Retrospective[]` | `NOT_TEAM_MEMBER` |
| POST | `/teams/{teamId}/retrospectives` | `{ title, yesterdayWork, todayPlan, note, collaboratorUserIds }` | `Retrospective` | `COLLABORATOR_NOT_TEAM_MEMBER`, `AUTHOR_CANNOT_BE_COLLABORATOR` |
| GET | `/retrospectives/{retrospectiveId}` | 없음 | `Retrospective` | `RETROSPECTIVE_NOT_FOUND` |
| PATCH | `/retrospectives/{retrospectiveId}` | `{ title, yesterdayWork, todayPlan, note, collaboratorUserIds }` | `Retrospective` | `RETROSPECTIVE_EDITOR_ONLY`, `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` |
| DELETE | `/retrospectives/{retrospectiveId}` | 없음 | `null` | `RETROSPECTIVE_EDITOR_ONLY` |

정책:

- 작성자와 공동 작업자는 본문을 수정할 수 있다.
- 공동 작업자 목록 변경은 작성자만 가능하다.
- 팀장도 작성자/공동 작업자가 아니면 회고록을 수정/삭제할 수 없다.

## 12. 핵심 에러 코드

| Code | 의미 |
|---|---|
| `UNAUTHORIZED` | 로그인 필요 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_TEAM_MEMBER` | 팀원이 아님 |
| `LEADER_ONLY` | 팀장 권한 필요 |
| `EMAIL_ALREADY_EXISTS` | 이메일 중복 |
| `TEAM_NAME_ALREADY_EXISTS` | 팀 이름 중복 |
| `INVALID_TEAM_PASSWORD` | 팀 비밀번호 불일치 |
| `INVALID_INVITE_CODE` | 초대코드 없음/만료 |
| `ASSIGNEE_REQUIRED` | 담당자 1명 이상 필요 |
| `TODO_TASK_NOT_ASSIGNED` | 본인 담당 Task가 아니라 Todo 추가 불가 |
| `COMMENT_AUTHOR_ONLY` | 댓글 작성자만 수정/삭제 가능 |
| `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` | 회고록 작성자만 공동 작업자 변경 가능 |
| `MEETING_AUTHOR_OR_LEADER_ONLY` | 회의록 작성자 또는 팀장만 가능 |
| `SPEC_DOCUMENT_AUTHOR_OR_LEADER_ONLY` | Spec 작성자 또는 팀장만 가능 |
