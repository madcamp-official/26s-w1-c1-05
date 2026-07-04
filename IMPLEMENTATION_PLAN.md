# Scrum Helper Implementation Plan

## 1. 문서 목적

이 문서는 `SPEC.md`, `DB_SCHEMA.md`, `API_SPEC.md`, `IA.md`, `BACKEND_DESIGN.md`, `FRONTEND_DESIGN.md`를 실제 구현 작업으로 변환한 계획서다.

구현 중 기능 범위나 정책이 바뀌면 먼저 `SPEC.md`를 수정하고, 그 다음 이 문서를 갱신한다.

## 2. 구현 목표

5일 안에 로컬에서 실행 가능한 Scrum Helper MVP를 완성한다.

완료 기준:

- React + TypeScript 프론트엔드가 실행된다.
- Java + Spring Boot API 서버가 실행된다.
- MySQL DB와 Spring Data JPA Entity가 연결된다.
- JWT 기반 회원가입/로그인이 동작한다.
- 전체 팀 목록, 팀 생성, 공개 팀 가입, 비밀번호 팀 가입, 초대코드 가입이 동작한다.
- 팀장 1명 정책, 팀장 변경, 팀원 제거가 동작한다.
- task 생성/수정/삭제/완료/담당자 지정/댓글이 동작한다.
- 회의록 생성/목록/상세/수정/삭제가 동작한다.
- 회고록 생성/수정/삭제/공동 작업자 지정이 동작한다.
- 회고록 공동 작업자 목록 변경은 작성자만 가능하다.
- README 또는 실행 문서만 보고 로컬에서 실행할 수 있다.

## 3. 폴더 구조 초안

```text
repository-root/
  SPEC.md
  DB_SCHEMA.md
  API_SPEC.md
  IA.md
  IMPLEMENTATION_PLAN.md
  BACKEND_DESIGN.md
  FRONTEND_DESIGN.md
  backend/
    build.gradle
    settings.gradle
    src/main/java/...
    src/main/resources/
  frontend/
    package.json
    src/
  docs/
    RUNBOOK.md
    TEST_PLAN.md
```

`backend/`와 `frontend/`는 구현 시작 시 생성한다.

## 4. 백엔드 구현 계획

### 4.1 기술 선택

| 항목 | 선택 |
|---|---|
| Language | Java |
| Framework | Spring Boot |
| Build | Gradle |
| DB | MySQL |
| ORM | Spring Data JPA |
| Auth | Spring Security + JWT |
| Password Hash | BCrypt |
| Validation | Jakarta Bean Validation |

### 4.2 패키지 구조

```text
com.scrumhelper
  ScrumHelperApplication
  common
    ApiResponse
    ErrorResponse
    GlobalExceptionHandler
    ErrorCode
  security
    JwtTokenProvider
    JwtAuthenticationFilter
    SecurityConfig
    CurrentUser
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
  team
    TeamController
    TeamService
    dto
  task
    TaskController
    TaskService
    TaskCommentController
    TaskCommentService
    dto
  retrospective
    RetrospectiveController
    RetrospectiveService
    dto
```

### 4.3 구현 순서

| 순서 | 작업 | 완료 기준 |
|---:|---|---|
| 1 | Spring Boot 프로젝트 생성 | `/actuator/health` 또는 `/api/health` 응답 |
| 2 | MySQL 연결 설정 | 애플리케이션 기동 시 DB 연결 성공 |
| 3 | JPA Entity 작성 | `DB_SCHEMA.md`와 필드/관계 일치 |
| 4 | Repository 작성 | 주요 조회 메서드 컴파일 통과 |
| 5 | 공통 응답/예외 처리 | 성공/실패 응답 포맷 통일 |
| 6 | JWT 인증 구현 | 회원가입/로그인/내 정보 조회 성공 |
| 7 | Team API 구현 | 팀 생성/목록/가입/상세/대시보드 |
| 8 | Team Member API 구현 | 팀원 목록/팀원 제거/팀장 변경 |
| 9 | Task API 구현 | task CRUD/완료 변경/담당자 검증 |
| 10 | Comment API 구현 | 댓글 작성/수정/삭제 권한 검증 |
| 11 | Retrospective API 구현 | 회고록 CRUD/공동 작업자 검증 |
| 12 | 통합 테스트 | 핵심 API 시나리오 통과 |

### 4.4 백엔드 핵심 트랜잭션

| 기능 | 트랜잭션 내용 |
|---|---|
| 팀 생성 | `teams` 생성, `team_members` LEADER 생성 |
| 팀장 변경 | 기존 팀장 MEMBER 변경, 새 팀장 LEADER 변경, `teams.leader_user_id` 변경 |
| 팀원 제거 | 유일 담당 task 검증, 공동 작업자 제거, 멤버십 제거 |
| task 생성 | task 생성, 담당자 1명 이상 저장 |
| task 수정 | task 필드 수정, 담당자 목록 교체 |
| 회의록 생성 | 회의록 생성, 작성자 저장 |
| 회의록 수정/삭제 | 작성자 또는 팀장 권한 확인 |
| 회고록 생성 | 회고록 생성, 공동 작업자 저장 |
| 회고록 수정 | 회고록 필드 수정, 작성자인 경우에만 공동 작업자 목록 교체 |

### 4.5 백엔드 검증 체크리스트

- `users.email` 중복 가입 차단
- 팀 이름 중복 생성 차단
- 공개 팀은 비밀번호 없이 가입
- 비밀번호 팀은 비밀번호 검증 후 가입
- 초대코드로 공개/비밀번호 팀 가입
- 팀장은 정확히 1명만 존재
- 팀장 변경 후 기존 팀장은 MEMBER
- 팀장은 본인을 제거할 수 없음
- 유일 담당자인 팀원은 제거할 수 없음
- task 담당자는 1명 이상
- task 담당자는 같은 팀원만 가능
- 댓글 수정/삭제는 작성자만 가능
- 회의록 수정/삭제는 작성자 또는 팀장만 가능
- 회고록 수정/삭제는 작성자 또는 공동 작업자만 가능
- 회고록 공동 작업자 목록 변경은 작성자만 가능
- 회고록 작성자는 공동 작업자에 포함 불가
- API 응답에 `password_hash` 노출 금지

## 5. 프론트엔드 구현 계획

### 5.1 기술 선택

| 항목 | 선택 |
|---|---|
| Language | TypeScript |
| Framework | React |
| Build | Vite |
| Routing | React Router |
| API Client | fetch wrapper 또는 Axios |
| State | React hooks |
| Styling | CSS 또는 CSS Modules |

MVP에서는 전역 상태 관리 라이브러리를 필수로 사용하지 않는다. 인증 token과 현재 사용자 정보만 최소한으로 공통 관리한다.

### 5.2 화면 구현 순서

| 순서 | 화면 | 완료 기준 |
|---:|---|---|
| 1 | 로그인/회원가입 | token 저장, 보호 라우트 진입 |
| 2 | 팀 목록 | 전체 팀 목록 표시, 팀 생성/가입/초대코드 가입 동작 |
| 3 | 팀 대시보드 | 요약 카드 표시 |
| 4 | 팀원 관리 | 팀원 목록, 팀장 변경, 팀원 제거 |
| 5 | 팀 설정 | 팀명/설명/비밀번호 변경, 초대코드 재발급 |
| 6 | Task 목록 | 필터, 생성 모달, 완료/미완료 구분 |
| 7 | Task 상세 | 수정, 삭제, 완료 변경, 댓글 |
| 8 | 회의록 목록 | 목록, 생성 폼 |
| 9 | 회의록 상세 | 수정, 삭제 |
| 10 | 회고록 목록 | 목록, 생성 모달 |
| 11 | 회고록 상세 | 수정, 삭제, 작성자 전용 공동 작업자 변경 |

### 5.3 API 클라이언트 구조

```text
src/api/
  client.ts
  authApi.ts
  teamApi.ts
  taskApi.ts
  retrospectiveApi.ts
```

`client.ts` 역할:

- base URL 관리
- JWT header 자동 추가
- 공통 응답 unwrap
- 401 발생 시 token 삭제 후 로그인 이동
- API 오류 메시지 표준화

### 5.4 프론트엔드 검증 체크리스트

- 로그인 후 새로고침해도 token 기반으로 사용자 복구
- 비로그인 보호 라우트 접근 시 `/login` 이동
- 팀 목록에서 공개 팀과 비밀번호 팀 구분 표시
- 공개 팀은 클릭 즉시 가입
- 비밀번호 팀은 모달 입력 후 가입
- 팀 가입/생성 후 팀 대시보드 이동
- 팀장만 팀 설정/팀장 변경/팀원 제거 버튼 표시
- task 생성 시 담당자 0명이면 저장 불가
- task 완료 상태가 목록에 즉시 반영
- 댓글 수정/삭제 버튼은 작성자에게만 표시
- 회고록 수정/삭제 버튼은 작성자와 공동 작업자에게만 표시
- 작성자는 회고록 공동 작업자 선택 목록에서 제외

## 6. 5일 작업 일정

### Day 1: 프로젝트 세팅과 인증

목표:

- 백엔드/프론트 프로젝트 생성
- MySQL 연결
- 회원가입/로그인/JWT 기초 완성

백엔드:

- Spring Boot 프로젝트 생성
- MySQL datasource 설정
- 공통 응답/예외 구조 작성
- User Entity/Repository 작성
- Auth API 구현
- JWT filter 구현

프론트엔드:

- Vite React 프로젝트 생성
- Router 설정
- Login/Signup 화면 구현
- API client 기본 구현
- token 저장/복구 구현

완료 기준:

- 회원가입 후 로그인 상태로 `/teams` 이동
- `GET /api/me` 성공

### Day 2: 팀 기능

목표:

- 팀 목록, 팀 생성, 팀 가입, 팀 대시보드 완성

백엔드:

- Team, TeamMember Entity 작성
- 팀 생성 transaction 구현
- 전체 팀 목록 API 구현
- 공개/비밀번호 팀 가입 구현
- 초대코드 가입과 팀장 전용 초대코드 재발급 구현
- 팀 대시보드 API 구현

프론트엔드:

- 팀 목록 화면
- 팀 생성 모달
- 비밀번호 팀 가입 모달
- 초대코드 가입 폼
- 팀 대시보드 화면

완료 기준:

- 공개 팀 즉시 가입
- 비밀번호 팀은 비밀번호 검증 후 가입
- 가입/생성 후 대시보드 이동

### Day 3: 팀원 관리와 task

목표:

- 팀장 정책과 task 핵심 기능 완성

백엔드:

- 팀원 목록 API
- 팀장 변경 API
- 팀원 제거 API
- Task, TaskAssignee Entity 작성
- task 생성/목록/수정/완료/삭제 API 구현

프론트엔드:

- 팀원 관리 화면
- 팀 설정 일부
- Task 목록 화면
- Task 생성 모달
- 완료/미완료 구분

완료 기준:

- 팀장 변경 후 기존 팀장이 MEMBER가 됨
- task 생성 시 담당자 1명 이상 검증
- task 완료/미완료 변경 가능

### Day 4: 댓글과 회고록

목표:

- task 댓글과 회고록 협업 기능 완성

백엔드:

- TaskComment Entity/API 구현
- Retrospective Entity/API 구현
- RetrospectiveCollaborator Entity/API 구현
- 회고록 공동 작업자 권한 검증

프론트엔드:

- Task 상세 화면
- 댓글 목록/작성/수정/삭제
- 회고록 목록 화면
- 회고록 생성/상세/수정/삭제
- 공동 작업자 선택 UI

완료 기준:

- 댓글 수정/삭제는 작성자만 가능
- 회고록 수정/삭제는 작성자와 공동 작업자만 가능

### Day 5: 통합, 테스트, 문서화

목표:

- 전체 시나리오 검증
- 실행 문서 완성
- 제출 산출물 정리

작업:

- API 통합 테스트
- 브라우저 E2E 수동 테스트
- UI 빈 상태/오류 상태 점검
- README 또는 RUNBOOK 작성
- DB/API/IA 문서 최종 동기화
- 발표/데모 시나리오 정리

완료 기준:

- 새 환경에서 실행 문서대로 서버와 클라이언트 실행
- 핵심 사용자 흐름 1회 이상 완주
- 발견 이슈와 미구현 범위 명시

## 7. 역할 분담안

2인 팀 기준 권장 분담이다.

| 역할 | 담당 |
|---|---|
| 팀원 A | Spring Boot, DB, Auth, Team, 권한 검증 |
| 팀원 B | React, 화면 구현, API 연동, UI 상태 처리 |

공동 담당:

- API request/response DTO 합의
- task/회고록 권한 정책 테스트
- 최종 문서 정리
- 데모 시나리오 작성

Day 3 이후에는 기능 단위로 교차 검증한다.

| 검증자 | 검증 대상 |
|---|---|
| 팀원 A | 프론트 화면에서 API 오류가 사용자에게 보이는지 |
| 팀원 B | API 응답이 화면 구현에 충분한지 |

## 8. 테스트 계획

### 8.1 API 테스트

우선순위 높은 API 테스트:

1. 회원가입/로그인
2. 팀 생성과 팀장 생성
3. 공개 팀 가입
4. 비밀번호 팀 가입
5. 초대코드 가입
6. 팀장 변경
7. 팀원 제거 실패: 유일 담당 task 존재
8. task 생성 실패: 담당자 0명
9. task 생성 실패: 다른 팀 사용자 담당자 지정
10. 댓글 수정 실패: 작성자 아님
11. 회고록 수정 실패: 작성자/공동 작업자 아님
12. 공동 작업자의 회고록 공동 작업자 목록 변경 실패

### 8.2 브라우저 시나리오

1. 유저 A 회원가입
2. 유저 A 팀 생성
3. 유저 B 회원가입
4. 유저 B 팀 목록에서 팀 가입
5. 유저 A가 task 생성 후 B를 담당자로 지정
6. 유저 B가 task 완료 처리
7. 유저 B가 댓글 작성
8. 유저 A가 회고록 생성 후 B를 공동 작업자로 지정
9. 유저 B가 회고록 수정
10. 유저 A가 B에게 팀장 위임

## 9. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| Spring Security/JWT 설정 지연 | 로그인 이후 기능이 막힘 | Day 1에서 가장 먼저 처리 |
| MySQL 환경 차이 | 팀원 간 실행 불일치 | `.env` 또는 `application-local.yml` 템플릿 제공 |
| 팀장 1명 정책 구현 실수 | 권한 오류 | 팀장 변경 transaction 테스트 작성 |
| task 담당자 1명 이상 정책 누락 | 데이터 무결성 저하 | task 생성/수정/팀원 제거 테스트 작성 |
| 회고록 공동 작업자 권한 혼동 | 수정/삭제 권한 오류 | 권한 매트릭스를 테스트 케이스로 변환 |
| 프론트/백 DTO 불일치 | API 연동 지연 | `API_SPEC.md`를 DTO 기준으로 고정 |

## 10. 구현 시작 전 체크리스트

- [ ] MySQL 로컬 실행 방식 확정
- [ ] backend 포트 확정: 기본 `8080`
- [ ] frontend 포트 확정: 기본 `5173`
- [ ] CORS 허용 origin 확정
- [ ] JWT secret local 설정 방식 확정
- [ ] Spring Boot 버전 확정
- [ ] Java 버전 확정
- [ ] React 프로젝트 생성 방식 확정

## 11. 다음 단계

Day 1부터 Day 4까지의 MVP 기능은 로컬 빌드 기준으로 구현되었다. 다음 단계부터는 디자인 적용을 이 계획에서 제외하고, 백엔드 기능 고도화와 검증에 집중한다.

디자인 작업은 팀원 담당 트랙으로 분리한다. 이 문서의 다음 단계는 Spring Boot API, DB 스키마, 권한 정책, 테스트, 운영 준비만 다룬다.

백엔드 다음 단계:

1. 백엔드 회귀 테스트 확장: 인증, 팀 가입, 팀장 변경, task, 댓글, 회의록, 회고록 권한 테스트 작성
2. 스펙 문서 기반 task 추천 기능 구현: `task_suggestions` 도메인, Gemini/local fallback 추천, 선택 수락 API
3. 리더보드/명성 기초 API 구현: 팀원별 완료 task 수 집계, rank level 계산, 대시보드용 응답 제공
4. task 관계 모델 1차 구현: task dependency 저장, 순환 의존성 차단, 선행 task 완료 시 후행 task 조회
5. 알림 기반 준비: 로컬 mock notification event 기록 테이블 또는 로그 sender 구현
6. DB 정합성 보강: 인덱스, unique 제약, 팀원 제거/담당자/공동 작업자 edge case 재검증
7. 설정 분리: local/KCloud profile, `JWT_SECRET`, `GEMINI_API_KEY`, DB 접속 정보 환경변수 문서화
8. API 문서 동기화: 새 백엔드 API를 `API_SPEC.md`, `DB_SCHEMA.md`, `docs/BACKEND_UPGRADE_PLAN.md`에 반영
9. 백엔드 테스트 통과 후 프론트에는 최소 API client 연결 지점만 공유
10. 제출 전 전체 기능 수동 시나리오와 backend test 결과 정리

상세 계획은 `docs/BACKEND_UPGRADE_PLAN.md`를 기준으로 진행한다.
