# Scrum Helper Frontend Design

## 1. 문서 목적

이 문서는 Scrum Helper MVP의 React + TypeScript 프론트엔드 구현 기준이다.

`SPEC.md`, `API_SPEC.md`, `IA.md`, `BACKEND_DESIGN.md`에서 확정한 기능을 실제 라우트, 컴포넌트, 상태 관리, API 클라이언트, 권한 UI로 변환한다.

프론트엔드 구현 중 화면 정책이 애매하면 이 문서를 우선 확인하고, API 응답 구조가 애매하면 `API_SPEC.md`를 기준으로 맞춘다.

## 2. 구현 원칙

- 서버가 권한과 데이터 무결성을 최종 판단한다.
- 프론트엔드는 사용자가 잘못된 요청을 보내지 않도록 1차 validation과 버튼 노출 제어를 담당한다.
- MVP에서는 React Query, Redux, Zustand 같은 전역 상태 라이브러리를 사용하지 않는다.
- 인증 정보와 현재 사용자만 전역 Context로 관리한다.
- 팀, task, 회고록 데이터는 페이지 단위로 조회하고 mutation 후 다시 조회한다.
- API 응답 타입은 `API_SPEC.md`의 DTO와 1:1로 맞춘다.
- 비밀번호 해시, 팀 비밀번호 원문, 사용자 비밀번호는 화면 상태에 오래 보관하지 않는다.

## 3. 기술 선택

| 항목 | 선택 |
|---|---|
| Language | TypeScript |
| Framework | React |
| Build | Vite |
| Routing | React Router |
| API Client | fetch wrapper |
| State | React Context + hooks |
| Styling | CSS Modules + global CSS |
| Date 표시 | 브라우저 기본 `Intl.DateTimeFormat` |

추가 라이브러리는 MVP에 꼭 필요한 경우만 설치한다. 우선 필수 의존성은 아래 정도로 제한한다.

```text
react
react-dom
react-router-dom
typescript
vite
```

아이콘이 필요하면 `lucide-react`를 사용한다. 단, 기능 구현을 우선하고 아이콘은 마지막 UI 정리 단계에서 추가한다.

## 4. 환경 변수

프론트엔드는 API 서버 주소를 `.env.local`에서 읽는다.

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

기본값은 `http://localhost:8080/api`로 둔다. `.env.local`이 없어도 로컬 개발이 바로 가능해야 한다.

## 5. 폴더 구조

```text
frontend/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    app/
      App.tsx
      router.tsx
    api/
      client.ts
      authApi.ts
      teamApi.ts
      taskApi.ts
      retrospectiveApi.ts
    auth/
      AuthProvider.tsx
      authStorage.ts
      useAuth.ts
    components/
      common/
        Button.tsx
        ConfirmDialog.tsx
        EmptyState.tsx
        ErrorMessage.tsx
        FormField.tsx
        LoadingState.tsx
        Modal.tsx
        SelectableUserList.tsx
      layout/
        AppLayout.tsx
        AuthLayout.tsx
        TeamLayout.tsx
    pages/
      auth/
        LoginPage.tsx
        SignupPage.tsx
      teams/
        TeamListPage.tsx
        TeamDashboardPage.tsx
        TeamMembersPage.tsx
        TeamSettingsPage.tsx
      tasks/
        TaskListPage.tsx
        TaskDetailPage.tsx
      retrospectives/
        RetrospectiveListPage.tsx
        RetrospectiveDetailPage.tsx
    types/
      api.ts
      auth.ts
      team.ts
      task.ts
      retrospective.ts
    utils/
      date.ts
      errors.ts
      permissions.ts
      validators.ts
    styles/
      global.css
```

## 6. 라우팅 설계

### 6.1 라우트 목록

| Route | Component | Guard | 설명 |
|---|---|---|---|
| `/login` | `LoginPage` | `PublicOnlyRoute` | 로그인 |
| `/signup` | `SignupPage` | `PublicOnlyRoute` | 회원가입 |
| `/teams` | `TeamListPage` | `ProtectedRoute` | 전체 팀 목록 |
| `/teams/:teamId` | `TeamDashboardPage` | `TeamMemberRoute` | 팀 대시보드 |
| `/teams/:teamId/members` | `TeamMembersPage` | `TeamMemberRoute` | 팀원 관리 |
| `/teams/:teamId/settings` | `TeamSettingsPage` | `TeamMemberRoute` | 팀 설정 조회, 팀장 전용 수정 |
| `/teams/:teamId/tasks` | `TaskListPage` | `TeamMemberRoute` | task 목록 |
| `/teams/:teamId/tasks/:taskId` | `TaskDetailPage` | `TeamMemberRoute` | task 상세 |
| `/teams/:teamId/meetings` | `MeetingListPage` | `TeamMemberRoute` | 회의록 목록 |
| `/teams/:teamId/meetings/:meetingId` | `MeetingDetailPage` | `TeamMemberRoute` | 회의록 상세 |
| `/teams/:teamId/retrospectives` | `RetrospectiveListPage` | `TeamMemberRoute` | 회고록 목록 |
| `/teams/:teamId/retrospectives/:retrospectiveId` | `RetrospectiveDetailPage` | `TeamMemberRoute` | 회고록 상세 |

### 6.2 Guard 정책

`ProtectedRoute`

- 인증 초기화 중이면 로딩 화면을 표시한다.
- token이 없거나 `/api/me`가 실패하면 `/login`으로 보낸다.
- 로그인 상태면 하위 route를 렌더링한다.

`PublicOnlyRoute`

- 비로그인 사용자는 로그인/회원가입 화면을 볼 수 있다.
- 로그인 사용자는 `/teams`로 보낸다.

`TeamMemberRoute`

- `GET /api/teams/{teamId}`를 호출해 팀원 여부와 `myRole`을 확인한다.
- 팀원이 아니면 `/teams`로 보내고 오류 메시지를 표시한다.
- 팀 정보는 `TeamLayout`에 전달해 사이드 내비게이션과 팀장 여부 판단에 사용한다.

`LeaderRoute`

- `TeamMemberRoute`와 같은 조회를 수행한다.
- `myRole !== "LEADER"`이면 `/teams/:teamId`로 보낸다.

## 7. API 클라이언트 설계

### 7.1 공통 응답 타입

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
```

### 7.2 client.ts 책임

`src/api/client.ts`는 아래를 담당한다.

- base URL 적용
- JSON stringify
- `Authorization: Bearer <token>` 자동 추가
- 공통 응답 envelope unwrap
- 실패 응답을 `ApiError`로 변환
- 401 발생 시 token 삭제와 로그인 이동을 할 수 있도록 hook 제공

함수 형태:

```ts
type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
};

export async function request<T>(path: string, options?: RequestOptions): Promise<T>;
```

구현 원칙:

- `body`가 `undefined`면 request body를 보내지 않는다.
- `null`은 JSON body로 보낼 수 있어야 한다. 팀 비밀번호 제거에서 필요하다.
- query 값이 `null` 또는 `undefined`이면 URL에 붙이지 않는다.
- API 실패 메시지는 우선 서버의 `error.message`를 사용한다.
- 네트워크 오류는 `서버에 연결할 수 없습니다.`로 표시한다.

### 7.3 API 모듈

`authApi.ts`

```ts
signup(request: SignupRequest): Promise<AuthResponse>
login(request: LoginRequest): Promise<AuthResponse>
logout(): Promise<void>
getMe(): Promise<UserSummary>
```

`teamApi.ts`

```ts
getTeams(params?: { keyword?: string }): Promise<TeamSummary[]>
createTeam(request: CreateTeamRequest): Promise<TeamDetail>
getTeam(teamId: number): Promise<TeamDetail>
getDashboard(teamId: number): Promise<TeamDashboard>
joinTeam(teamId: number, request?: JoinTeamRequest): Promise<TeamMember>
joinTeamByInviteCode(request: JoinTeamByInviteCodeRequest): Promise<TeamMember>
updateTeam(teamId: number, request: UpdateTeamRequest): Promise<TeamDetail>
updateTeamPassword(teamId: number, request: UpdateTeamPasswordRequest): Promise<TeamPasswordStatus>
rotateInviteCode(teamId: number): Promise<TeamInviteCodeStatus>
getMembers(teamId: number): Promise<TeamMember[]>
removeMember(teamId: number, memberId: number): Promise<void>
transferLeader(teamId: number, request: TransferLeaderRequest): Promise<TransferLeaderResponse>
```

`taskApi.ts`

```ts
getTasks(teamId: number, params?: TaskFilter): Promise<Task[]>
createTask(teamId: number, request: SaveTaskRequest): Promise<Task>
getTask(taskId: number): Promise<Task>
updateTask(taskId: number, request: SaveTaskRequest): Promise<Task>
updateTaskCompletion(taskId: number, completed: boolean): Promise<Task>
deleteTask(taskId: number): Promise<void>
getComments(taskId: number): Promise<TaskComment[]>
createComment(taskId: number, request: SaveCommentRequest): Promise<TaskComment>
updateComment(commentId: number, request: SaveCommentRequest): Promise<TaskComment>
deleteComment(commentId: number): Promise<void>
```

`retrospectiveApi.ts`

```ts
getRetrospectives(teamId: number, params?: RetrospectiveFilter): Promise<RetrospectiveListItem[]>
createRetrospective(teamId: number, request: SaveRetrospectiveRequest): Promise<Retrospective>
getRetrospective(retrospectiveId: number): Promise<Retrospective>
updateRetrospective(retrospectiveId: number, request: SaveRetrospectiveRequest): Promise<Retrospective>
deleteRetrospective(retrospectiveId: number): Promise<void>
```

`meetingApi.ts`

```ts
getMeetings(teamId: number): Promise<Meeting[]>
createMeeting(teamId: number, request: SaveMeetingRequest): Promise<Meeting>
getMeeting(meetingId: number): Promise<Meeting>
updateMeeting(meetingId: number, request: SaveMeetingRequest): Promise<Meeting>
deleteMeeting(meetingId: number): Promise<void>
```

## 8. TypeScript 모델

```ts
export type UserSummary = {
  id: number;
  name: string;
  email: string;
};

export type TeamRole = "LEADER" | "MEMBER";

export type TeamSummary = {
  id: number;
  name: string;
  description: string | null;
  hasPassword: boolean;
  memberCount: number;
  leader: UserSummary;
  joined: boolean;
  myRole: TeamRole | null;
};

export type TeamDetail = {
  id: number;
  name: string;
  description: string | null;
  hasPassword: boolean;
  inviteCode: string | null;
  leader: UserSummary;
  myRole: TeamRole;
  createdAt: string;
  updatedAt: string;
};

export type JoinTeamByInviteCodeRequest = {
  inviteCode: string;
};

export type TeamInviteCodeStatus = {
  teamId: number;
  inviteCode: string;
};

export type TeamMember = {
  id: number;
  teamId: number;
  user: UserSummary;
  role: TeamRole;
  joinedAt: string;
};

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: number;
  teamId: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string;
  completed: boolean;
  createdBy: UserSummary;
  assignees: UserSummary[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: number;
  taskId: number;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type RetrospectiveListItem = {
  id: number;
  teamId: number;
  title: string;
  author: UserSummary;
  collaborators: UserSummary[];
  createdAt: string;
  updatedAt: string;
};

export type Retrospective = RetrospectiveListItem & {
  yesterdayWork: string | null;
  todayPlan: string | null;
  note: string | null;
};

export type Meeting = {
  id: number;
  teamId: number;
  title: string;
  meetingAt: string;
  rawContent: string | null;
  summary: string | null;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
};
```

## 9. 인증 상태 설계

### 9.1 저장소

localStorage key:

```text
scrum-helper.access-token
```

저장 데이터:

- JWT access token만 저장한다.
- 사용자 정보는 앱 시작 시 `/api/me`로 다시 가져온다.

### 9.2 AuthContext

```ts
type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: UserSummary | null;
  token: string | null;
  login: (request: LoginRequest) => Promise<void>;
  signup: (request: SignupRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};
```

### 9.3 앱 시작 흐름

1. localStorage에서 token을 읽는다.
2. token이 없으면 `anonymous` 상태로 둔다.
3. token이 있으면 `/api/me`를 호출한다.
4. 성공하면 `authenticated`와 사용자 정보를 설정한다.
5. 실패하면 token을 삭제하고 `anonymous`로 전환한다.

## 10. 레이아웃 설계

### 10.1 AuthLayout

사용 route:

- `/login`
- `/signup`

구성:

- 서비스명 `Scrum Helper`
- 인증 폼 영역
- 로그인/회원가입 전환 링크

디자인 방향:

- 첫 화면부터 실제 로그인 폼을 보여준다.
- 마케팅성 hero 페이지는 만들지 않는다.

### 10.2 AppLayout

사용 route:

- `/teams`
- `/teams/:teamId/*`

구성:

- 상단 바
  - 서비스명
  - 현재 사용자 이름
  - 로그아웃 버튼
- 본문 영역

로그아웃:

- localStorage token 삭제
- AuthContext 초기화
- `/login` 이동

### 10.3 TeamLayout

사용 route:

- `/teams/:teamId/*`

구성:

- 팀 이름
- 팀장 이름
- 사이드 내비게이션
  - 대시보드
  - Task
  - 회고록
  - 팀원
  - 설정: `myRole === "LEADER"`일 때만 노출
- 하위 페이지 outlet

팀 정보 조회 실패:

- `NOT_TEAM_MEMBER`: `/teams`로 이동
- `TEAM_NOT_FOUND`: `/teams`로 이동
- 그 외 오류: 본문에 오류 상태 표시

## 11. 페이지별 구현 상세

### 11.1 LoginPage

API:

- `POST /api/auth/login`

상태:

- `email`
- `password`
- `isSubmitting`
- `errorMessage`

동작:

- 이메일/비밀번호가 비어 있으면 API 호출 전 오류 표시
- 로그인 성공 시 token 저장 후 `/teams` 이동
- `INVALID_CREDENTIALS`는 폼 하단에 표시

### 11.2 SignupPage

API:

- `POST /api/auth/signup`

상태:

- `name`
- `email`
- `password`
- `isSubmitting`
- `errorMessage`

동작:

- 이름, 이메일, 비밀번호 필수 입력 검증
- 이메일 형식은 브라우저 기본 validation 또는 간단한 정규식으로 검증
- 가입 성공 시 token 저장 후 `/teams` 이동
- `EMAIL_ALREADY_EXISTS`는 이메일 필드 근처에 표시

### 11.3 TeamListPage

API:

- `GET /api/teams`
- `POST /api/teams`
- `POST /api/teams/{teamId}/join`

상태:

- `teams`
- `keyword`
- `isLoading`
- `errorMessage`
- `createModalOpen`
- `joinPasswordModal`

화면:

- 검색 입력
- 초대코드 가입 입력
- 팀 생성 버튼
- 팀 카드 목록

팀 카드 버튼:

| 조건 | 버튼 | 동작 |
|---|---|---|
| `joined === true` | 입장 | `/teams/{teamId}` 이동 |
| `joined === false && hasPassword === false` | 가입 | 즉시 join 호출 |
| `joined === false && hasPassword === true` | 비밀번호 입력 | 비밀번호 모달 표시 |

초대코드 가입 폼:

- `inviteCode`: required
- 저장 시 `POST /api/teams/join-by-invite`
- 성공 시 응답의 `teamId` 기준으로 `/teams/{teamId}` 이동

팀 생성 폼:

- `name`: required
- `description`: optional
- `password`: optional

팀 생성 성공:

- 생성된 팀의 `/teams/{teamId}`로 이동한다.

### 11.4 TeamDashboardPage

API:

- `GET /api/teams/{teamId}/dashboard`

화면:

- task 요약
- 회고록 요약
- 팀원 수
- 빠른 이동 버튼

상태:

- 대시보드 데이터 로딩
- 데이터 없음
- API 오류

대시보드의 숫자는 서버 응답을 그대로 사용한다. 프론트에서 task 목록을 다시 계산하지 않는다.

### 11.5 TeamMembersPage

API:

- `GET /api/teams/{teamId}/members`
- `PATCH /api/teams/{teamId}/leader`
- `DELETE /api/teams/{teamId}/members/{memberId}`

화면:

- 팀원 목록
- 역할 badge
- 가입일
- 팀장 전용 액션

팀장 변경:

- 현재 팀장이 아닌 멤버만 대상이 될 수 있다.
- 확인 모달 후 요청한다.
- 성공하면 팀원 목록과 TeamLayout의 팀 정보를 다시 조회한다.

팀원 제거:

- 팀장 본인과 현재 팀장 제거 버튼은 노출하지 않는다.
- 확인 모달 후 요청한다.
- `REASSIGN_TASK_REQUIRED`가 오면 재배정 안내 메시지를 표시한다.

### 11.6 TeamSettingsPage

API:

- `PATCH /api/teams/{teamId}`
- `PATCH /api/teams/{teamId}/password`

접근:

- 팀장만 가능하다.

폼:

- 팀 이름
- 팀 설명
- 새 팀 비밀번호
- 공개 팀으로 변경 버튼

동작:

- 팀 이름/설명 저장과 비밀번호 변경은 버튼을 분리한다.
- 공개 팀으로 변경은 `{ password: null }`을 보낸다.
- 저장 성공 후 TeamLayout의 팀 정보를 갱신한다.

### 11.7 TaskListPage

API:

- `GET /api/teams/{teamId}/tasks`
- `POST /api/teams/{teamId}/tasks`
- `GET /api/teams/{teamId}/members`

필터:

- 완료 여부: 전체/미완료/완료
- 중요도: 전체/낮음/보통/높음
- 담당자
- 마감일 시작
- 마감일 종료

Task 생성 모달:

- 제목: required
- 설명: optional
- 중요도: required, 기본 `MEDIUM`
- 마감일: required
- 담당자: 1명 이상

목록 구성:

- 미완료 task
- 완료 task

정렬:

- 미완료 task: 마감일 빠른 순, 중요도 높은 순
- 완료 task: 최근 수정일 늦은 순

마감 표시:

- 미완료이고 `dueDate < today`: `마감 초과`
- 미완료이고 오늘부터 2일 이내: `마감 임박`

### 11.8 TaskDetailPage

API:

- `GET /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}/completion`
- `DELETE /api/tasks/{taskId}`
- `GET /api/tasks/{taskId}/comments`
- `POST /api/tasks/{taskId}/comments`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

화면:

- task 수정 폼
- 완료 여부 토글
- 담당자 선택
- 삭제 버튼
- 댓글 목록
- 댓글 입력

정책:

- 팀원 모두 task를 수정/삭제할 수 있다.
- 담당자는 항상 1명 이상이어야 한다.
- 댓글 작성은 팀원 모두 가능하다.
- 댓글 수정/삭제 버튼은 `comment.author.id === currentUser.id`일 때만 노출한다.

삭제:

- 확인 모달 후 삭제한다.
- 삭제 성공 시 `/teams/{teamId}/tasks`로 이동한다.

### 11.9 RetrospectiveListPage

API:

- `GET /api/teams/{teamId}/retrospectives`
- `POST /api/teams/{teamId}/retrospectives`
- `GET /api/teams/{teamId}/members`

필터:

- 작성자
- 공동 작업자

회고록 생성 모달:

- 제목: required
- 어제 한 일
- 오늘 할 일
- 궁금한/필요한/알아낸 것
- 공동 작업자: optional

정책:

- 작성자는 현재 로그인 사용자다.
- 공동 작업자 선택 목록에서 현재 사용자는 제외한다.
- 공동 작업자는 같은 팀원만 선택할 수 있다.

### 11.10 RetrospectiveDetailPage

API:

- `GET /api/retrospectives/{retrospectiveId}`
- `PATCH /api/retrospectives/{retrospectiveId}`
- `DELETE /api/retrospectives/{retrospectiveId}`
- `GET /api/teams/{teamId}/members`

권한 판단:

```ts
const canEdit =
  retrospective.author.id === currentUser.id ||
  retrospective.collaborators.some((user) => user.id === currentUser.id);

const canManageCollaborators =
  retrospective.author.id === currentUser.id;
```

화면:

- 읽기 모드
- 수정 모드
- 삭제 버튼

정책:

- 팀원은 모두 조회할 수 있다.
- 작성자와 공동 작업자만 수정/삭제할 수 있다.
- 팀장이라도 작성자/공동 작업자가 아니면 수정/삭제 버튼을 볼 수 없다.
- 공동 작업자 목록은 작성자만 수정할 수 있다.
- 공동 작업자는 본문만 수정할 수 있다.
- 공동 작업자 목록을 수정할 때 작성자는 선택 후보에서 제외한다.

## 12. 공통 컴포넌트

### 12.1 Button

props:

- `variant`: `primary`, `secondary`, `danger`, `ghost`
- `size`: `sm`, `md`
- `isLoading`
- `disabled`

원칙:

- 저장/생성은 `primary`
- 삭제는 `danger`
- 단순 이동은 `secondary` 또는 `ghost`

### 12.2 Modal

용도:

- 팀 생성
- 팀 비밀번호 입력
- task 생성
- 회고록 생성
- 확인 다이얼로그

원칙:

- ESC 또는 닫기 버튼으로 닫을 수 있다.
- 저장 중에는 닫기 버튼과 제출 버튼을 disabled 처리한다.

### 12.3 ConfirmDialog

용도:

- task 삭제
- 댓글 삭제
- 회고록 삭제
- 팀장 변경
- 팀원 제거
- 공개 팀 전환

props:

- `title`
- `description`
- `confirmLabel`
- `variant`
- `onConfirm`

### 12.4 SelectableUserList

용도:

- task 담당자 선택
- 회고록 공동 작업자 선택
- 필터의 담당자/작성자 선택

props:

- `users`
- `selectedUserIds`
- `multiple`
- `disabledUserIds`
- `onChange`

정책:

- task 담당자는 1명 이상 선택되어야 한다.
- 회고록 공동 작업자는 0명 이상 가능하다.
- 회고록 작성자는 disabled 또는 목록 제외 처리한다.

## 13. 권한 유틸리티

`src/utils/permissions.ts`

```ts
export function isLeader(role: TeamRole | null): boolean;

export function canEditComment(comment: TaskComment, user: UserSummary): boolean;

export function canEditRetrospective(
  retrospective: Retrospective,
  user: UserSummary
): boolean;

export function canManageTeam(role: TeamRole | null): boolean;
```

권한 UI는 편의 장치일 뿐이다. 서버 API 오류가 발생하면 화면에 그대로 표시한다.

## 14. Validation 규칙

### 14.1 공통

- 문자열 required 필드는 `trim()` 후 빈 문자열을 거부한다.
- API 호출 전 validation 실패 시 서버 요청을 보내지 않는다.
- 서버 validation 오류가 오면 폼 하단 또는 해당 필드 근처에 표시한다.

### 14.2 인증

| 필드 | 규칙 |
|---|---|
| name | required |
| email | required, email 형식 |
| password | required |

비밀번호 복잡도 검사는 하지 않는다.

### 14.3 팀

| 필드 | 규칙 |
|---|---|
| name | required |
| description | optional |
| password | optional |

비밀번호가 공백이면 공개 팀 생성 또는 공개 팀 전환으로 해석한다.

### 14.4 Task

| 필드 | 규칙 |
|---|---|
| title | required |
| description | optional |
| priority | `LOW`, `MEDIUM`, `HIGH` |
| dueDate | required |
| assigneeUserIds | 1명 이상 |

### 14.5 댓글

| 필드 | 규칙 |
|---|---|
| content | required |

### 14.6 회고록

| 필드 | 규칙 |
|---|---|
| title | required |
| yesterdayWork | optional |
| todayPlan | optional |
| note | optional |
| collaboratorUserIds | optional, 작성자 제외 |

## 15. 데이터 조회 전략

### 15.1 기본 전략

- 페이지 진입 시 필요한 데이터를 조회한다.
- mutation 성공 후 해당 페이지 데이터를 다시 조회한다.
- 여러 페이지에서 공유되는 것은 최소화한다.

### 15.2 페이지별 조회 데이터

| 페이지 | 조회 데이터 |
|---|---|
| `/teams` | 팀 목록 |
| `/teams/:teamId` | 팀 상세, 대시보드 |
| `/teams/:teamId/members` | 팀 상세, 팀원 목록 |
| `/teams/:teamId/settings` | 팀 상세 |
| `/teams/:teamId/tasks` | 팀 상세, 팀원 목록, task 목록 |
| `/teams/:teamId/tasks/:taskId` | 팀 상세, 팀원 목록, task 상세, 댓글 목록 |
| `/teams/:teamId/retrospectives` | 팀 상세, 팀원 목록, 회고록 목록 |
| `/teams/:teamId/retrospectives/:retrospectiveId` | 팀 상세, 팀원 목록, 회고록 상세 |

### 15.3 Mutation 후 갱신

| Mutation | 갱신 |
|---|---|
| 팀 생성 | `/teams/{teamId}` 이동 |
| 팀 가입 | `/teams/{teamId}` 이동 |
| 팀 정보 수정 | 팀 상세 다시 조회 |
| 팀장 변경 | 팀원 목록, 팀 상세 다시 조회 |
| 팀원 제거 | 팀원 목록 다시 조회 |
| task 생성 | task 목록 다시 조회 |
| task 수정 | task 상세 다시 조회 |
| task 완료 변경 | task 상세 또는 목록 다시 조회 |
| task 삭제 | task 목록으로 이동 |
| 댓글 생성/수정/삭제 | 댓글 목록 다시 조회 |
| 회고록 생성 | 생성된 회고록 상세로 이동 |
| 회고록 수정 | 회고록 상세 다시 조회 |
| 회고록 삭제 | 회고록 목록으로 이동 |

## 16. 오류 처리

### 16.1 표시 위치

| 오류 유형 | 표시 위치 |
|---|---|
| 폼 validation | 필드 아래 또는 폼 하단 |
| API validation | 폼 하단 |
| 권한 오류 | 화면 상단 alert 또는 안전한 route 이동 |
| 네트워크 오류 | 페이지 본문 오류 상태 |
| 삭제/변경 실패 | 확인 모달 닫지 않고 메시지 표시 |

### 16.2 주요 에러 코드별 화면 처리

| Code | 화면 처리 |
|---|---|
| `INVALID_CREDENTIALS` | 로그인 폼 하단 표시 |
| `EMAIL_ALREADY_EXISTS` | 회원가입 이메일 필드 근처 표시 |
| `TEAM_NAME_ALREADY_EXISTS` | 팀 생성/설정 폼 하단 표시 |
| `TEAM_PASSWORD_REQUIRED` | 비밀번호 입력 모달 표시 |
| `INVALID_TEAM_PASSWORD` | 비밀번호 모달 하단 표시 |
| `NOT_TEAM_MEMBER` | `/teams` 이동 |
| `LEADER_ONLY` | 팀 대시보드 이동 |
| `ASSIGNEE_REQUIRED` | task 폼 담당자 영역 표시 |
| `REASSIGN_TASK_REQUIRED` | 팀원 제거 모달에 재배정 안내 |
| `COMMENT_AUTHOR_ONLY` | 댓글 목록 다시 조회 후 메시지 표시 |
| `RETROSPECTIVE_EDITOR_ONLY` | 회고록 상세를 읽기 모드로 전환 |

## 17. 화면 상태 체크리스트

각 페이지는 아래 상태를 반드시 가진다.

- 최초 로딩
- 데이터 있음
- 데이터 없음
- API 오류
- 저장 중
- 삭제 확인
- 권한 없음

목록 화면 빈 상태 문구:

| 화면 | 문구 |
|---|---|
| 팀 목록 | `아직 생성된 팀이 없습니다.` |
| task 목록 | `아직 등록된 task가 없습니다.` |
| 댓글 목록 | `아직 댓글이 없습니다.` |
| 회고록 목록 | `아직 작성된 회고록이 없습니다.` |

## 18. 스타일 방향

Scrum Helper는 협업용 업무 도구이므로 조용하고 명확한 대시보드 형태로 만든다.

원칙:

- 첫 화면은 로그인/회원가입 폼이다.
- 팀 내부 화면은 상단 바 + 사이드 내비게이션 + 본문 구조를 유지한다.
- 카드 안에 또 다른 카드를 넣지 않는다.
- 버튼, 입력창, badge 크기는 화면마다 일관되게 유지한다.
- 완료/미완료, 중요도, 마감 상태는 색상과 텍스트를 함께 사용한다.
- 모바일에서는 사이드 내비게이션을 상단 탭 또는 접이식 메뉴로 전환한다.

색상 역할:

| 역할 | 예시 |
|---|---|
| Primary | 주요 저장/생성 버튼 |
| Danger | 삭제 |
| Warning | 마감 임박 |
| Error | 마감 초과, API 오류 |
| Success | 완료 task |
| Neutral | 목록, 테이블, 설명 텍스트 |

## 19. 접근성 기준

- 모든 입력에는 label을 연결한다.
- 버튼 텍스트는 동작을 명확히 표현한다.
- 모달은 열릴 때 첫 입력 또는 제목으로 focus를 이동한다.
- Enter 제출, ESC 닫기를 지원한다.
- 색상만으로 상태를 구분하지 않고 텍스트 badge를 같이 표시한다.

## 20. 구현 순서

### Step 1: 프로젝트 생성

- Vite React TypeScript 프로젝트 생성
- React Router 설치
- global CSS 초기화
- 기본 layout 작성

완료 기준:

- `/login`, `/signup`, `/teams` route가 렌더링된다.

### Step 2: API client와 Auth

- `client.ts` 작성
- token storage 작성
- `AuthProvider` 작성
- 로그인/회원가입 구현
- 보호 route 구현

완료 기준:

- 회원가입/로그인 후 `/teams`로 이동한다.
- 새로고침 후 `/api/me`로 로그인 상태가 복구된다.

### Step 3: 팀 목록과 팀 생성/가입

- 팀 목록 조회
- 팀 생성 모달
- 공개 팀 가입
- 비밀번호 팀 가입 모달
- 초대코드 가입 폼

완료 기준:

- 전체 팀 목록을 볼 수 있다.
- 공개 팀은 즉시 가입된다.
- 비밀번호 팀은 비밀번호 입력 후 가입된다.
- 초대코드를 입력해 가입할 수 있다.

### Step 4: 팀 내부 레이아웃과 대시보드

- `TeamLayout`
- 팀 상세 조회
- 팀 대시보드 조회
- 팀장 전용 설정 메뉴 노출

완료 기준:

- 팀원이 팀 대시보드에 접근할 수 있다.
- 팀장이 아닌 사용자는 설정 메뉴가 보이지 않는다.

### Step 5: 팀원 관리와 팀 설정

- 팀원 목록
- 팀장 변경
- 팀원 제거
- 팀 이름/설명 수정
- 팀 비밀번호 변경
- 초대코드 표시와 재발급

완료 기준:

- 팀장만 관리 버튼을 볼 수 있다.
- 팀장만 팀 설정을 수정하고 초대코드를 재발급할 수 있다.
- 팀장 변경 후 화면 권한이 갱신된다.

### Step 6: Task

- task 목록
- task 필터
- task 생성
- task 상세 수정
- 완료 변경
- task 삭제

완료 기준:

- task 담당자를 1명 이상 지정해 생성할 수 있다.
- 완료/미완료 변경이 목록에 반영된다.

### Step 7: 댓글

- 댓글 목록
- 댓글 작성
- 댓글 수정
- 댓글 삭제

완료 기준:

- 작성자만 댓글 수정/삭제 버튼을 볼 수 있다.

### Step 8: 회의록

- 회의록 목록
- 회의록 생성
- 회의록 상세
- 회의록 수정
- 회의록 삭제

완료 기준:

- 팀원은 회의록을 조회할 수 있다.
- 작성자 또는 팀장만 회의록을 수정/삭제할 수 있다.

### Step 9: 회고록

- 회고록 목록
- 회고록 생성
- 회고록 상세
- 회고록 수정
- 공동 작업자 변경
- 회고록 삭제

완료 기준:

- 작성자와 공동 작업자만 회고록을 수정/삭제할 수 있다.

### Step 10: UI 정리와 테스트

- 빈 상태
- 오류 상태
- 저장 중 상태
- 모바일 레이아웃
- 실행 문서와 수동 테스트 시나리오 정리

완료 기준:

- 주요 브라우저 시나리오를 처음부터 끝까지 수행할 수 있다.

## 21. 수동 테스트 체크리스트

### 인증

- [ ] 회원가입 성공
- [ ] 중복 이메일 가입 실패
- [ ] 로그인 성공
- [ ] 잘못된 비밀번호 로그인 실패
- [ ] 새로고침 후 로그인 유지
- [ ] 로그아웃 후 보호 route 접근 차단

### 팀

- [ ] 공개 팀 생성
- [ ] 비밀번호 팀 생성
- [ ] 팀 이름 중복 생성 실패
- [ ] 공개 팀 즉시 가입
- [ ] 비밀번호 팀 가입 성공
- [ ] 비밀번호 팀 가입 실패
- [ ] 초대코드 가입 성공
- [ ] 팀장만 팀 설정 수정/초대코드 재발급
- [ ] 팀장 변경 성공
- [ ] 팀원 제거 성공
- [ ] 유일 담당자인 팀원 제거 실패

### Task

- [ ] task 생성
- [ ] 담당자 0명 task 생성 실패
- [ ] task 목록 필터
- [ ] task 상세 조회
- [ ] task 수정
- [ ] task 완료 처리
- [ ] task 미완료 처리
- [ ] task 삭제

### 댓글

- [ ] 댓글 작성
- [ ] 작성자 댓글 수정
- [ ] 작성자 댓글 삭제
- [ ] 타인의 댓글 수정/삭제 버튼 미노출

### 회고록

- [ ] 회고록 생성
- [ ] 작성자를 공동 작업자로 선택할 수 없음
- [ ] 공동 작업자 회고록 수정
- [ ] 공동 작업자의 공동 작업자 목록 변경 실패
- [ ] 일반 팀원 회고록 수정 버튼 미노출
- [ ] 회고록 삭제

## 22. MVP 제외 항목

아래 항목은 현재 MVP에 포함하지 않는다.

- 회원 탈퇴
- 비밀번호 찾기
- refresh token
- 실시간 알림
- task drag and drop
- 파일 첨부
- 멘션 알림
- 팀 초대 링크: 코드 기반 초대는 구현, URL 링크 공유는 제외
- 팀 가입 승인 대기
- 배포 환경별 설정 자동화

## 23. 구현 시작 기준

프론트엔드 구현은 아래 문서를 기준으로 시작한다.

- `SPEC.md`: 제품 정책과 기능 범위
- `API_SPEC.md`: API request/response
- `IA.md`: 화면 흐름
- `FRONTEND_DESIGN.md`: React 구현 단위

구현을 시작하면 먼저 `frontend/` 프로젝트를 생성하고, `Step 1`부터 순서대로 진행한다.
