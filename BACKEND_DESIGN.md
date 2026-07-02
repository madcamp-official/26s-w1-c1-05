# Scrum Helper Backend Design

## 1. 문서 목적

이 문서는 Scrum Helper 백엔드를 Java + Spring Boot + Spring Data JPA로 구현하기 위한 상세 설계 문서다.

기준 문서:

- `SPEC.md`
- `DB_SCHEMA.md`
- `API_SPEC.md`
- `IMPLEMENTATION_PLAN.md`

## 2. 백엔드 범위

MVP 백엔드는 아래 기능을 제공한다.

- 회원가입, 로그인, 내 정보 조회
- JWT 인증
- 전체 팀 목록 조회
- 팀 생성, 팀 가입, 팀 상세, 팀 대시보드
- 팀 정보 수정, 팀 비밀번호 변경
- 팀원 목록, 팀원 제거, 팀장 변경
- task 생성, 조회, 수정, 완료 변경, 삭제
- task 댓글 작성, 조회, 수정, 삭제
- 회고록 생성, 조회, 수정, 삭제
- 회고록 공동 작업자 지정과 권한 검증

## 3. 프로젝트 설정

### 3.1 권장 의존성

Spring Initializr 기준 의존성:

- Spring Web
- Spring Data JPA
- Spring Security
- MySQL Driver
- Validation
- Lombok

JWT는 별도 라이브러리를 사용하거나 직접 HMAC 기반으로 구현한다. 선택은 구현 시점에 확정하되, 외부 라이브러리를 쓰더라도 JWT 생성/검증 로직은 `security` 패키지 안에만 둔다.

### 3.2 application local 설정

`application-local.yml` 예시:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/scrum_helper?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: root
    password: local-password
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: true
    open-in-view: false

app:
  jwt:
    secret: local-development-secret-change-me
    expiration-ms: 86400000
```

운영 배포 자동화는 MVP 범위가 아니지만, secret은 코드에 하드코딩하지 않는다.

## 4. 패키지 구조

```text
com.scrumhelper
  ScrumHelperApplication

  common
    response
      ApiResponse
      ErrorResponse
    exception
      BusinessException
      ErrorCode
      GlobalExceptionHandler
    time
      TimeProvider

  security
    SecurityConfig
    JwtTokenProvider
    JwtAuthenticationFilter
    AuthenticatedUser
    CurrentUserArgumentResolver

  domain
    user
      User
      UserRepository
    team
      Team
      TeamMember
      TeamRole
      TeamRepository
      TeamMemberRepository
    task
      Task
      TaskAssignee
      TaskAssigneeId
      TaskComment
      TaskPriority
      TaskRepository
      TaskAssigneeRepository
      TaskCommentRepository
    retrospective
      Retrospective
      RetrospectiveCollaborator
      RetrospectiveCollaboratorId
      RetrospectiveRepository
      RetrospectiveCollaboratorRepository

  auth
    AuthController
    AuthService
    dto
      SignupRequest
      LoginRequest
      AuthResponse
      UserResponse

  team
    TeamController
    TeamService
    TeamMemberService
    dto
      TeamCreateRequest
      TeamUpdateRequest
      TeamPasswordUpdateRequest
      TeamJoinRequest
      TeamResponse
      TeamSummaryResponse
      TeamDashboardResponse
      TeamMemberResponse
      ChangeLeaderRequest

  task
    TaskController
    TaskService
    TaskCommentController
    TaskCommentService
    dto
      TaskCreateRequest
      TaskUpdateRequest
      TaskCompletionRequest
      TaskResponse
      TaskCommentRequest
      TaskCommentResponse

  retrospective
    RetrospectiveController
    RetrospectiveService
    dto
      RetrospectiveCreateRequest
      RetrospectiveUpdateRequest
      RetrospectiveResponse
      RetrospectiveSummaryResponse
```

원칙:

- `domain/*` 패키지는 JPA Entity와 Repository만 둔다.
- Controller/Service/DTO는 기능 패키지에 둔다.
- Entity를 API 응답으로 직접 반환하지 않는다.
- 권한 검증은 Controller가 아니라 Service에서 수행한다.

## 5. 공통 응답과 예외

### 5.1 ApiResponse

```java
public record ApiResponse<T>(
    boolean success,
    T data,
    String message
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, "ok");
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, data, "created");
    }
}
```

### 5.2 ErrorResponse

```java
public record ErrorResponse(
    boolean success,
    ErrorBody error
) {
    public static ErrorResponse of(ErrorCode code) {
        return new ErrorResponse(false, new ErrorBody(code.name(), code.getMessage()));
    }
}

public record ErrorBody(
    String code,
    String message
) {
}
```

### 5.3 ErrorCode

주요 오류 코드는 `API_SPEC.md`와 동일하게 유지한다.

```java
public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    TEAM_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 팀 이름입니다."),
    TEAM_NOT_FOUND(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."),
    NOT_TEAM_MEMBER(HttpStatus.FORBIDDEN, "팀원이 아닙니다."),
    LEADER_ONLY(HttpStatus.FORBIDDEN, "팀장만 수행할 수 있습니다."),
    ALREADY_TEAM_MEMBER(HttpStatus.CONFLICT, "이미 가입한 팀입니다."),
    TEAM_PASSWORD_REQUIRED(HttpStatus.BAD_REQUEST, "팀 비밀번호가 필요합니다."),
    INVALID_TEAM_PASSWORD(HttpStatus.UNAUTHORIZED, "팀 비밀번호가 올바르지 않습니다."),
    CANNOT_REMOVE_SELF(HttpStatus.BAD_REQUEST, "본인은 제거할 수 없습니다."),
    CANNOT_REMOVE_LEADER(HttpStatus.BAD_REQUEST, "팀장은 제거할 수 없습니다."),
    REASSIGN_TASK_REQUIRED(HttpStatus.CONFLICT, "담당자 재배정이 필요한 task가 있습니다."),
    TARGET_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "대상 사용자가 팀원이 아닙니다."),
    TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "task를 찾을 수 없습니다."),
    ASSIGNEE_REQUIRED(HttpStatus.BAD_REQUEST, "담당자를 1명 이상 선택해야 합니다."),
    ASSIGNEE_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "담당자는 팀원이어야 합니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    COMMENT_AUTHOR_ONLY(HttpStatus.FORBIDDEN, "댓글 작성자만 수정 또는 삭제할 수 있습니다."),
    RETROSPECTIVE_NOT_FOUND(HttpStatus.NOT_FOUND, "회고록을 찾을 수 없습니다."),
    RETROSPECTIVE_EDITOR_ONLY(HttpStatus.FORBIDDEN, "회고록 작성자 또는 공동 작업자만 가능합니다."),
    COLLABORATOR_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "공동 작업자는 팀원이어야 합니다."),
    AUTHOR_CANNOT_BE_COLLABORATOR(HttpStatus.BAD_REQUEST, "작성자는 공동 작업자에 포함할 수 없습니다.");
}
```

## 6. Security 설계

### 6.1 인증 흐름

1. `POST /api/auth/signup` 또는 `POST /api/auth/login`
2. 서버가 user ID를 subject로 하는 JWT 발급
3. 클라이언트가 `Authorization: Bearer <token>`으로 요청
4. `JwtAuthenticationFilter`가 token 검증
5. 검증 성공 시 `AuthenticatedUser`를 SecurityContext에 저장
6. Controller에서 현재 사용자 ID를 사용

### 6.2 SecurityConfig

허용 경로:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/health`

나머지 `/api/**`는 인증 필요.

CSRF는 JWT API 서버이므로 비활성화한다.

세션은 stateless로 설정한다.

### 6.3 AuthenticatedUser

```java
public record AuthenticatedUser(
    Long id,
    String email,
    String name
) {
}
```

Controller에서는 `@AuthenticationPrincipal` 또는 custom `@CurrentUser`로 받는다.

## 7. Entity 설계

### 7.1 공통 Auditing

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

`TeamMember`, `TaskAssignee`, `RetrospectiveCollaborator`처럼 `updated_at`이 없는 테이블은 별도 필드만 둔다.

### 7.2 User

필드:

- `id`
- `name`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

관계:

- Entity에서는 양방향 관계를 최소화한다.
- User에서 teams/tasks/comments 컬렉션을 들고 있지 않는다.

Repository:

```java
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
```

### 7.3 Team

필드:

- `id`
- `name`
- `description`
- `passwordHash`
- `leader`
- `createdAt`
- `updatedAt`

JPA 매핑:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "leader_user_id", nullable = false)
private User leader;
```

주의:

- 팀장은 `Team.leader`를 권한 기준으로 사용한다.
- `TeamMember.role`은 목록 표시와 DB 제약 보조다.
- 팀 생성 시 Team 저장과 TeamMember 저장은 하나의 transaction에서 처리한다.

Repository:

```java
boolean existsByName(String name);
Optional<Team> findById(Long id);
List<Team> findByNameContaining(String keyword);
```

### 7.4 TeamMember

필드:

- `id`
- `team`
- `user`
- `role`
- `leaderTeamId`: optional, read-only
- `joinedAt`

JPA 매핑:

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private TeamRole role;

@Column(name = "leader_team_id", insertable = false, updatable = false)
private Long leaderTeamId;
```

Repository:

```java
Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
boolean existsByTeamIdAndUserId(Long teamId, Long userId);
List<TeamMember> findByTeamId(Long teamId);
Optional<TeamMember> findByIdAndTeamId(Long memberId, Long teamId);
```

### 7.5 Task

필드:

- `id`
- `team`
- `title`
- `description`
- `priority`
- `dueDate`
- `completed`
- `createdBy`
- `createdAt`
- `updatedAt`

JPA 매핑:

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private TaskPriority priority;
```

Repository:

```java
Optional<Task> findById(Long id);
List<Task> findByTeamId(Long teamId);
```

필터가 늘어날 수 있으므로 task 목록 조회는 `Specification` 또는 QueryDSL 없이 시작하되, 복잡해지면 repository custom query로 분리한다.

### 7.6 TaskAssignee

복합키:

```java
@Embeddable
public class TaskAssigneeId implements Serializable {
    private Long taskId;
    private Long userId;
}
```

Entity:

- `id`
- `task`
- `team`
- `user`
- `assignedAt`

주의:

- DB에는 `(task_id, team_id)`와 `(team_id, user_id)` FK가 있다.
- JPA에서는 모든 FK를 객체 관계로 과하게 매핑하면 복잡해질 수 있다.
- MVP에서는 `task`, `team`, `user`를 `ManyToOne(fetch = LAZY)`로 두고, Service에서 값 일관성을 보장한다.

Repository:

```java
List<TaskAssignee> findByTaskId(Long taskId);
void deleteByTaskId(Long taskId);
long countByTaskId(Long taskId);
long countByUserIdAndTeamId(Long userId, Long teamId);
```

### 7.7 TaskComment

필드:

- `id`
- `task`
- `user`
- `content`
- `createdAt`
- `updatedAt`

Repository:

```java
List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
Optional<TaskComment> findById(Long id);
```

### 7.8 Retrospective

필드:

- `id`
- `team`
- `author`
- `title`
- `yesterdayWork`
- `todayPlan`
- `note`
- `createdAt`
- `updatedAt`

Repository:

```java
List<Retrospective> findByTeamIdOrderByUpdatedAtDesc(Long teamId);
Optional<Retrospective> findById(Long id);
```

### 7.9 RetrospectiveCollaborator

복합키:

```java
@Embeddable
public class RetrospectiveCollaboratorId implements Serializable {
    private Long retrospectiveId;
    private Long userId;
}
```

Entity:

- `id`
- `retrospective`
- `team`
- `user`
- `addedAt`

Repository:

```java
List<RetrospectiveCollaborator> findByRetrospectiveId(Long retrospectiveId);
boolean existsByRetrospectiveIdAndUserId(Long retrospectiveId, Long userId);
void deleteByRetrospectiveId(Long retrospectiveId);
void deleteByTeamIdAndUserId(Long teamId, Long userId);
```

## 8. DTO 설계

### 8.1 Auth DTO

Request:

- `SignupRequest(name, email, password)`
- `LoginRequest(email, password)`

Response:

- `UserResponse(id, name, email)`
- `AuthResponse(user, accessToken)`

### 8.2 Team DTO

Request:

- `TeamCreateRequest(name, description, password)`
- `TeamUpdateRequest(name, description)`
- `TeamPasswordUpdateRequest(password)`
- `TeamJoinRequest(password)`
- `ChangeLeaderRequest(newLeaderUserId)`

Response:

- `TeamSummaryResponse`
- `TeamResponse`
- `TeamDashboardResponse`
- `TeamMemberResponse`
- `ChangeLeaderResponse`

### 8.3 Task DTO

Request:

- `TaskCreateRequest(title, description, priority, dueDate, assigneeUserIds)`
- `TaskUpdateRequest(title, description, priority, dueDate, assigneeUserIds)`
- `TaskCompletionRequest(completed)`
- `TaskCommentRequest(content)`

Response:

- `TaskResponse`
- `TaskCommentResponse`

### 8.4 Retrospective DTO

Request:

- `RetrospectiveCreateRequest(title, yesterdayWork, todayPlan, note, collaboratorUserIds)`
- `RetrospectiveUpdateRequest(title, yesterdayWork, todayPlan, note, collaboratorUserIds)`

Response:

- `RetrospectiveSummaryResponse`
- `RetrospectiveResponse`

## 9. Service 설계

## 9.1 AuthService

### `signup(SignupRequest request)`

Steps:

1. email 중복 확인
2. password BCrypt hash
3. User 저장
4. JWT 발급
5. `AuthResponse` 반환

Errors:

- `EMAIL_ALREADY_EXISTS`
- `VALIDATION_ERROR`

### `login(LoginRequest request)`

Steps:

1. email로 User 조회
2. password hash 비교
3. JWT 발급
4. `AuthResponse` 반환

Errors:

- `INVALID_CREDENTIALS`

## 9.2 TeamService

### `getTeams(Long currentUserId, String keyword)`

반환:

- 전체 팀 목록
- 각 팀의 `hasPassword`
- `memberCount`
- `leader`
- 현재 사용자의 가입 여부와 role

주의:

- `passwordHash`는 절대 반환하지 않는다.

### `createTeam(Long currentUserId, TeamCreateRequest request)`

Transaction required.

Steps:

1. 팀 이름 중복 확인
2. 현재 User 조회
3. 팀 비밀번호가 있으면 hash
4. Team 저장
5. TeamMember를 `LEADER`로 저장
6. TeamResponse 반환

### `joinTeam(Long currentUserId, Long teamId, TeamJoinRequest request)`

Transaction required.

Steps:

1. Team 조회
2. 이미 팀원인지 확인
3. 팀이 비밀번호 팀이면 비밀번호 검증
4. TeamMember를 `MEMBER`로 저장
5. TeamMemberResponse 반환

### `changeLeader(Long currentUserId, Long teamId, ChangeLeaderRequest request)`

Transaction required.

Steps:

1. 요청자가 현재 팀장인지 확인
2. 새 팀장 대상이 팀원인지 확인
3. 새 팀장이 이미 팀장이면 오류
4. 기존 팀장 TeamMember role을 `MEMBER`로 변경
5. 새 팀장 TeamMember role을 `LEADER`로 변경
6. Team.leader를 새 User로 변경

### `removeMember(Long currentUserId, Long teamId, Long memberId)`

Transaction required.

Steps:

1. 요청자가 팀장인지 확인
2. 제거 대상 TeamMember 조회
3. 본인 제거인지 확인
4. 제거 대상이 LEADER인지 확인
5. 제거 대상이 유일 담당자인 task가 있는지 확인
6. 회고록 공동 작업자 연결 삭제
7. task 담당자 연결 삭제
8. TeamMember 삭제

유일 담당 task 검증:

- 제거 대상이 담당자인 모든 task를 찾는다.
- 각 task의 담당자 수가 1이면 제거를 막는다.
- 오류 응답에 재배정이 필요한 task id 목록을 포함하는 확장도 가능하다.

## 9.3 TaskService

### `createTask(Long currentUserId, Long teamId, TaskCreateRequest request)`

Transaction required.

Steps:

1. 요청자가 팀원인지 확인
2. 담당자 목록이 1명 이상인지 확인
3. 담당자 전원이 같은 팀원인지 확인
4. Task 저장
5. TaskAssignee 목록 저장
6. TaskResponse 반환

### `updateTask(Long currentUserId, Long taskId, TaskUpdateRequest request)`

Transaction required.

Steps:

1. Task 조회
2. 요청자가 해당 팀의 팀원인지 확인
3. 담당자 목록이 1명 이상인지 확인
4. 담당자 전원이 같은 팀원인지 확인
5. Task 필드 수정
6. 기존 TaskAssignee 삭제 후 새 목록 저장

### `updateCompletion(Long currentUserId, Long taskId, boolean completed)`

Steps:

1. Task 조회
2. 요청자가 해당 팀의 팀원인지 확인
3. completed 값 변경

### `deleteTask(Long currentUserId, Long taskId)`

Steps:

1. Task 조회
2. 요청자가 해당 팀의 팀원인지 확인
3. Task 삭제

DB cascade로 담당자와 댓글이 삭제된다.

## 9.4 TaskCommentService

### `createComment(Long currentUserId, Long taskId, TaskCommentRequest request)`

Steps:

1. Task 조회
2. 요청자가 해당 팀의 팀원인지 확인
3. 댓글 저장

### `updateComment(Long currentUserId, Long commentId, TaskCommentRequest request)`

Steps:

1. Comment 조회
2. 작성자인지 확인
3. content 수정

### `deleteComment(Long currentUserId, Long commentId)`

Steps:

1. Comment 조회
2. 작성자인지 확인
3. Comment 삭제

팀장도 다른 사용자의 댓글을 수정/삭제할 수 없다.

## 9.5 RetrospectiveService

### `createRetrospective(Long currentUserId, Long teamId, RetrospectiveCreateRequest request)`

Transaction required.

Steps:

1. 요청자가 팀원인지 확인
2. 공동 작업자가 모두 팀원인지 확인
3. 작성자가 공동 작업자 목록에 없는지 확인
4. Retrospective 저장
5. RetrospectiveCollaborator 목록 저장

### `updateRetrospective(Long currentUserId, Long retrospectiveId, RetrospectiveUpdateRequest request)`

Transaction required.

Steps:

1. Retrospective 조회
2. 요청자가 작성자 또는 공동 작업자인지 확인
3. 공동 작업자가 모두 팀원인지 확인
4. 작성자가 공동 작업자 목록에 없는지 확인
5. 본문 필드 수정
6. 기존 공동 작업자 목록 삭제 후 새 목록 저장

주의:

- 공동 작업자가 자기 자신을 collaborator 목록에서 제거할 수도 있다.
- 이 경우 요청 자체는 성공하고, 이후에는 수정 권한을 잃는다.

### `deleteRetrospective(Long currentUserId, Long retrospectiveId)`

Steps:

1. Retrospective 조회
2. 요청자가 작성자 또는 공동 작업자인지 확인
3. Retrospective 삭제

DB cascade로 공동 작업자 연결이 삭제된다.

## 10. 권한 검증 헬퍼

중복 검증을 줄이기 위해 내부 helper를 둔다.

```java
TeamMember requireTeamMember(Long teamId, Long userId);
TeamMember requireTeamLeader(Long teamId, Long userId);
void requireTaskTeamMember(Task task, Long userId);
void requireCommentAuthor(TaskComment comment, Long userId);
void requireRetrospectiveEditor(Retrospective retrospective, Long userId);
void validateTaskAssignees(Long teamId, List<Long> assigneeUserIds);
void validateRetrospectiveCollaborators(Long teamId, Long authorUserId, List<Long> collaboratorUserIds);
```

헬퍼 위치:

- 처음에는 각 Service private method로 둔다.
- 중복이 커지면 `AuthorizationService` 또는 `TeamAccessService`로 분리한다.

## 11. Repository 메서드 목록

### UserRepository

```java
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
```

### TeamRepository

```java
boolean existsByName(String name);
List<Team> findAllByOrderByCreatedAtDesc();
List<Team> findByNameContainingOrderByCreatedAtDesc(String keyword);
```

### TeamMemberRepository

```java
Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
Optional<TeamMember> findByIdAndTeamId(Long id, Long teamId);
boolean existsByTeamIdAndUserId(Long teamId, Long userId);
List<TeamMember> findByTeamIdOrderByJoinedAtAsc(Long teamId);
long countByTeamId(Long teamId);
```

### TaskRepository

```java
List<Task> findByTeamIdOrderByCompletedAscDueDateAscCreatedAtDesc(Long teamId);
long countByTeamId(Long teamId);
long countByTeamIdAndCompleted(Long teamId, boolean completed);
long countByTeamIdAndCompletedFalseAndDueDateBefore(Long teamId, LocalDate date);
long countByTeamIdAndCompletedFalseAndDueDateBetween(Long teamId, LocalDate from, LocalDate to);
```

필터 조건이 많아지면 custom query로 전환한다.

### TaskAssigneeRepository

```java
List<TaskAssignee> findByTaskId(Long taskId);
void deleteByTaskId(Long taskId);
void deleteByTeamIdAndUserId(Long teamId, Long userId);
List<TaskAssignee> findByTeamIdAndUserId(Long teamId, Long userId);
long countByTaskId(Long taskId);
```

### TaskCommentRepository

```java
List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
long countByTaskId(Long taskId);
```

### RetrospectiveRepository

```java
List<Retrospective> findByTeamIdOrderByUpdatedAtDesc(Long teamId);
long countByTeamId(Long teamId);
long countByTeamIdAndAuthorId(Long teamId, Long authorId);
```

### RetrospectiveCollaboratorRepository

```java
List<RetrospectiveCollaborator> findByRetrospectiveId(Long retrospectiveId);
boolean existsByRetrospectiveIdAndUserId(Long retrospectiveId, Long userId);
void deleteByRetrospectiveId(Long retrospectiveId);
void deleteByTeamIdAndUserId(Long teamId, Long userId);
long countByTeamIdAndUserId(Long teamId, Long userId);
```

## 12. Controller 설계

Controller는 얇게 유지한다.

역할:

- request validation
- current user 전달
- service 호출
- `ApiResponse` wrapping

Controller에서 하지 않는 것:

- DB 조회
- 권한 검증
- 비밀번호 검증
- Entity 직접 조작

예시:

```java
@PostMapping("/api/teams/{teamId}/tasks")
public ResponseEntity<ApiResponse<TaskResponse>> createTask(
    @CurrentUser AuthenticatedUser user,
    @PathVariable Long teamId,
    @Valid @RequestBody TaskCreateRequest request
) {
    TaskResponse response = taskService.createTask(user.id(), teamId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
}
```

## 13. Validation 규칙

### Auth

| Request | Field | Rule |
|---|---|---|
| SignupRequest | name | `@NotBlank`, max 50 |
| SignupRequest | email | `@NotBlank`, `@Email`, max 255 |
| SignupRequest | password | `@NotBlank` |
| LoginRequest | email | `@NotBlank`, `@Email` |
| LoginRequest | password | `@NotBlank` |

### Team

| Request | Field | Rule |
|---|---|---|
| TeamCreateRequest | name | `@NotBlank`, max 80 |
| TeamCreateRequest | description | max length는 DB TEXT 기준 별도 제한 없음 |
| TeamCreateRequest | password | optional |
| TeamUpdateRequest | name | optional, blank면 오류 |
| TeamPasswordUpdateRequest | password | optional |

### Task

| Request | Field | Rule |
|---|---|---|
| TaskCreateRequest | title | `@NotBlank`, max 120 |
| TaskCreateRequest | priority | `@NotNull` |
| TaskCreateRequest | dueDate | `@NotNull` |
| TaskCreateRequest | assigneeUserIds | `@NotEmpty` |
| TaskUpdateRequest | assigneeUserIds | `@NotEmpty` |

### Retrospective

| Request | Field | Rule |
|---|---|---|
| RetrospectiveCreateRequest | title | `@NotBlank`, max 120 |
| RetrospectiveCreateRequest | collaboratorUserIds | optional |
| RetrospectiveUpdateRequest | title | `@NotBlank`, max 120 |

## 14. 테스트 설계

### 14.1 Service 단위 테스트

우선순위:

1. 회원가입 이메일 중복
2. 로그인 비밀번호 불일치
3. 팀 생성 시 LEADER 멤버십 생성
4. 비밀번호 팀 가입 실패
5. 팀장 변경 transaction
6. 팀원 제거 실패: 유일 담당 task 존재
7. task 생성 실패: 담당자 0명
8. task 생성 실패: 담당자가 팀원이 아님
9. 댓글 수정 실패: 작성자 아님
10. 회고록 수정 실패: 작성자/공동 작업자 아님

### 14.2 Controller 통합 테스트

권장 도구:

- `@SpringBootTest`
- `MockMvc`
- 테스트 DB는 H2 호환이 어려우면 MySQL test schema 사용

검증:

- 공통 응답 포맷
- status code
- error code
- JWT 인증 적용 여부

## 15. 구현 순서

1. 프로젝트 생성과 DB 연결
2. 공통 응답/예외
3. User/Auth/JWT
4. Team/TeamMember
5. Task/TaskAssignee
6. TaskComment
7. Retrospective/RetrospectiveCollaborator
8. 통합 테스트와 API 문서 대조

각 단계 완료 시 `API_SPEC.md`의 해당 API를 직접 호출해 request/response가 일치하는지 확인한다.

## 16. 구현 시 주의점

- Entity를 JSON으로 직접 반환하지 않는다.
- `passwordHash`는 어떤 DTO에도 포함하지 않는다.
- `Team.leader`와 `TeamMember.role`은 항상 transaction으로 같이 맞춘다.
- task 담당자 1명 이상은 DB가 아니라 Service에서 보장한다.
- 팀원 제거 시 task 담당자 0명 발생을 막는다.
- 댓글은 작성자만 수정/삭제 가능하다.
- 회고록은 작성자와 공동 작업자만 수정/삭제 가능하다.
- 팀장 권한은 팀 정보/팀원 관리에만 적용된다. 댓글과 회고록 작성자 권한을 침범하지 않는다.
