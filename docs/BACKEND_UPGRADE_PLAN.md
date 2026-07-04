# Scrum Helper Backend Upgrade Plan

## 1. 목적

이 문서는 MVP 이후 Scrum Helper의 백엔드 고도화 계획을 정리한다.

현재 결정:

- 디자인 적용과 UI 개선은 팀원 담당으로 분리한다.
- 이 계획은 Spring Boot API, DB, 권한, 테스트, 운영 설정만 다룬다.
- 기존 REST API 경로와 DTO 의미는 가능한 유지한다.
- 프론트엔드 작업은 새 API 연결을 위한 최소 client 추가까지만 포함한다.

## 2. 현재 백엔드 상태

구현 완료:

| 영역 | 상태 |
|---|---|
| 인증 | 회원가입, 로그인, 로그아웃, `GET /api/me`, JWT 인증 |
| 팀 | 팀 생성, 목록, 상세, 대시보드, 팀 정보 수정 |
| 팀 가입 | 공개 팀, 비밀번호 팀, 초대코드 가입 |
| 팀원 | 팀원 목록, 팀장 변경, 팀원 제거 |
| task | 생성, 목록, 상세, 수정, 완료 변경, 삭제 |
| task 댓글 | 목록, 작성, 수정, 삭제 |
| 회의록 | 생성, 목록, 상세, 수정, 삭제 |
| 스펙 문서 | 회의록 기반 초안 생성, 저장, 목록, 상세, 수정, 삭제, 메인 지정 |
| task 추천 | 스펙 문서 기반 추천 생성, 조회, 수락 |
| 리더보드/명성 | 팀원별 완료 task 수 집계, rank, reputation level |
| task dependency | 관계 조회, 선행 task 추가/삭제, 순환 차단 |
| notification mock event | 선행 task 완료 시 후행 task 담당자별 event 생성 |
| 회고록 | 생성, 목록, 상세, 수정, 삭제, 공동 작업자 권한 |
| AI fallback | Gemini 키가 없거나 실패하면 local draft 생성 |
| 로컬 실행 설정 | `bootRun` 기본 `root/root` MySQL 연결 |

현재 보강 필요:

| 항목 | 이유 |
|---|---|
| 새 API 프론트 연결 지점 | 구현된 백엔드 API를 화면에서 사용할 수 있게 해야 함 |
| MySQL 기반 통합 smoke test | 제출 데모 기준의 실제 실행 안정성을 확인해야 함 |
| 제출 문서 동기화 | API/DB/테스트/실행 문서가 현재 코드와 일치해야 함 |
| KCloud 설정 분리 | 로컬, KCloud, 데모 환경에서 같은 코드로 실행하기 위함 |

## 3. 제외 범위

이번 백엔드 업그레이드 계획에서 제외한다.

- 디자인 시스템 적용
- CSS token 정리
- 화면 레이아웃 변경
- Drag and drop UI
- Calendar UI
- Dark mode UI
- Figma 또는 `design/_ds` 산출물 매칭

단, 백엔드에서 필요한 데이터는 API로 제공할 수 있다.

## 4. 우선순위

| 순위 | 작업 | 목표 |
|---:|---|---|
| 1 | 새 API 프론트 연결 지점 정리 | 팀원 프론트와 충돌을 줄이고 API 사용 경로를 명확히 함 |
| 2 | MySQL 기반 통합 smoke test | 제출 데모 기준으로 실제 실행 확인 |
| 3 | 제출 문서 동기화 | 코드와 산출물 불일치 제거 |
| 4 | KCloud 운영 설정 정리 | local/KCloud 전환 비용 감소 |

## 5. Phase A: 백엔드 테스트와 안정화

목표:

- 기존 MVP 기능을 자동 테스트로 보호한다.
- 권한/트랜잭션/데이터 무결성 버그를 먼저 줄인다.

작업:

| 작업 | 상세 |
|---|---|
| 테스트 환경 정리 | `test` profile, 테스트 DB 설정, 필요 시 H2 또는 MySQL test schema 결정 |
| Auth 테스트 | 회원가입, 이메일 중복, 로그인 성공/실패, `/api/me` |
| Team 테스트 | 팀 생성, 공개 가입, 비밀번호 가입, 초대코드 가입, 중복 가입 차단 |
| Leader 테스트 | 팀장 변경, 본인 제거 차단, 팀장 제거 차단 |
| Task 테스트 | 담당자 0명 차단, 외부 팀원 담당자 차단, 완료 변경 |
| Comment 테스트 | 작성자만 수정/삭제 가능 |
| Meeting 테스트 | 팀원 조회, 작성자/팀장만 수정/삭제 가능 |
| Retrospective 테스트 | 공동 작업자 본문 수정, 공동 작업자 목록 작성자 전용 |
| Spec 테스트 보강 | 다른 팀 회의록으로 초안/저장 차단 |

완료 기준:

- `./gradlew test` 통과
- 핵심 권한 실패 케이스가 테스트에 포함됨
- 팀원 제거와 task 담당자 정합성 테스트가 포함됨

## 6. Phase B: 스펙 문서 기반 task 추천

목표:

- 저장된 스펙 문서를 기반으로 task 후보를 만들고, 사용자가 선택한 후보를 실제 task로 전환할 수 있게 한다.

DB 추가:

| 테이블 | 컬럼 |
|---|---|
| `task_suggestions` | `id`, `team_id`, `spec_document_id`, `title`, `description`, `priority`, `due_date`, `accepted`, `created_at`, `updated_at` |

권장 정책:

- task 추천 생성은 팀원만 가능하다.
- source spec document는 같은 팀 소속이어야 한다.
- Gemini API 호출 실패 시 local fallback 추천을 생성한다.
- 추천은 바로 task로 저장하지 않는다.
- 수락 시 담당자 1명 이상을 요청으로 받아 실제 task를 생성한다.
- 한 번 수락한 suggestion은 중복 수락할 수 없다.

API 초안:

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/api/spec-documents/{specDocumentId}/task-suggestions` | 스펙 문서 기반 task 추천 생성 |
| `GET` | `/api/spec-documents/{specDocumentId}/task-suggestions` | 추천 목록 조회 |
| `POST` | `/api/task-suggestions/{suggestionId}/accept` | 추천을 실제 task로 생성 |

DTO 초안:

```json
{
  "id": 1,
  "teamId": 1,
  "specDocumentId": 3,
  "title": "팀 가입 API 예외 처리 보강",
  "description": "비밀번호 팀, 초대코드 팀, 중복 가입 케이스를 정리한다.",
  "priority": "MEDIUM",
  "dueDate": "2026-07-06",
  "accepted": false,
  "createdAt": "2026-07-04T12:00:00",
  "updatedAt": "2026-07-04T12:00:00"
}
```

수락 요청:

```json
{
  "assigneeUserIds": [1, 2]
}
```

완료 기준:

- 추천 생성, 조회, 수락 API가 동작한다.
- 수락된 suggestion은 `accepted = true`로 변경된다.
- 수락 결과로 생성된 task는 기존 task API에서 조회된다.
- 담당자가 없거나 같은 팀원이 아니면 실패한다.

## 7. Phase C: 리더보드와 명성 API

목표:

- 팀원별 완료 task 수를 집계하고, 명성 등급을 계산한다.

초기 구현은 별도 snapshot 저장 없이 실시간 집계로 시작한다.

API 초안:

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/api/teams/{teamId}/leaderboard` | 팀원별 완료 task 수와 등급 조회 |

응답 초안:

```json
[
  {
    "user": {
      "id": 1,
      "name": "안종화",
      "email": "owner@example.com"
    },
    "completedTaskCount": 8,
    "rank": 1,
    "reputationLevel": "OAK"
  }
]
```

등급 초안:

| Level | 조건 |
|---|---:|
| `SEED` | 0개 |
| `SPROUT` | 1개 이상 |
| `SAPLING` | 5개 이상 |
| `OAK` | 10개 이상 |

완료 기준:

- 팀원만 조회 가능하다.
- 완료 task 수는 담당자 기준으로 집계한다.
- 동점자는 이름 또는 user id 기준으로 안정 정렬한다.

## 8. Phase D: Task Dependency

목표:

- task 간 선후 관계를 저장하고, 순환 의존성을 차단한다.

DB 추가:

| 테이블 | 컬럼 |
|---|---|
| `task_dependencies` | `predecessor_task_id`, `successor_task_id`, `created_at` |

정책:

- 선행 task와 후행 task는 같은 팀에 속해야 한다.
- 자기 자신을 의존성으로 지정할 수 없다.
- 이미 존재하는 관계는 중복 저장하지 않는다.
- 새 관계 추가 시 순환 그래프가 생기면 저장하지 않는다.
- task 삭제 시 관련 dependency도 삭제한다.

API 초안:

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/api/teams/{teamId}/task-dependencies` | 팀 task 관계 전체 조회 |
| `POST` | `/api/tasks/{taskId}/dependencies` | 특정 task의 선행 task 추가 |
| `DELETE` | `/api/tasks/{taskId}/dependencies/{predecessorTaskId}` | 선행 관계 삭제 |

완료 기준:

- 같은 팀 task 사이에서만 관계 생성 가능하다.
- 순환 관계 생성 시 `TASK_DEPENDENCY_CYCLE`로 실패한다.
- 선행 task 완료 후 후행 task 목록을 조회할 수 있다.

## 9. Phase E: 알림 Mock Event

목표:

- 실제 이메일 연동 전에 알림 발생 조건을 서버에서 검증한다.

초기 구현:

- task 완료 처리 시 후행 task 담당자별 notification event를 생성한다.
- 실제 이메일 발송은 하지 않는다.
- 로컬에서는 event table 조회 또는 로그로 검증한다.

DB 후보:

| 테이블 | 컬럼 |
|---|---|
| `notification_events` | `id`, `team_id`, `recipient_user_id`, `type`, `payload`, `delivered`, `created_at` |

API 후보:

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/api/teams/{teamId}/notifications` | 내 알림 event 조회 |

완료 기준:

- 선행 task 완료 시 후행 task 담당자에게 event가 생성된다.
- 같은 완료 이벤트로 중복 알림이 계속 생성되지 않는다.
- 실제 SMTP 정보 없이 로컬에서 검증 가능하다.

## 10. Phase F: 설정과 운영 준비

목표:

- 로컬 개발과 KCloud 연결을 코드 변경 없이 전환한다.

작업:

| 항목 | 계획 |
|---|---|
| profile | `local`, `prod` 또는 환경변수 기반 실행 문서화 |
| DB | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 유지 |
| JWT | `JWT_SECRET` 필수 환경변수화, local 기본값은 개발 전용으로만 사용 |
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` 환경변수 유지 |
| CORS | `CORS_ALLOWED_ORIGINS`로 로컬/KCloud origin 분리 |
| DDL | `ddl-auto=update`는 로컬 편의용, 제출 전 스키마 문서와 실제 Entity 차이 확인 |
| 로그 | 권한 실패, AI fallback, notification event 로그 확인 가능하게 정리 |

완료 기준:

- README 또는 RUNBOOK만 보고 로컬 실행 가능
- KCloud 배포 시 필요한 환경변수 목록이 문서화됨
- 민감정보가 Git에 커밋되지 않음

## 11. 새 에러 코드 후보

| Code | HTTP | 조건 |
|---|---:|---|
| `SPEC_DOCUMENT_NOT_FOUND` | 404 | 스펙 문서 없음 |
| `TASK_SUGGESTION_NOT_FOUND` | 404 | task 추천 없음 |
| `TASK_SUGGESTION_ALREADY_ACCEPTED` | 409 | 이미 수락한 추천 |
| `TASK_DEPENDENCY_NOT_FOUND` | 404 | task 관계 없음 |
| `TASK_DEPENDENCY_ALREADY_EXISTS` | 409 | 이미 존재하는 관계 |
| `TASK_DEPENDENCY_SELF_REFERENCE` | 400 | 자기 자신을 의존성으로 지정 |
| `TASK_DEPENDENCY_CYCLE` | 409 | 순환 의존성 발생 |
| `TASK_NOT_SAME_TEAM` | 400 | 서로 다른 팀 task 관계 생성 시도 |

## 12. 추천 구현 순서

1. 테스트 profile과 핵심 service/controller 테스트부터 정리한다.
2. `task_suggestions` Entity, Repository, Service, Controller를 추가한다.
3. Gemini/local fallback task 추천 client를 만든다.
4. suggestion accept API에서 기존 `TaskService` 생성 로직을 재사용한다.
5. leaderboard API는 실시간 aggregate query로 먼저 구현한다.
6. task dependency는 DB와 cycle validation을 먼저 완성한다.
7. notification event는 dependency가 안정된 뒤 붙인다.
8. 모든 새 API를 `API_SPEC.md`, `DB_SCHEMA.md`, 테스트 시나리오에 반영한다.

## 13. 진행 기록

### 2026-07-04

완료:

- `BackendPolicyRegressionTests` 추가
- 팀 가입 정책 테스트: 비밀번호 필수, 비밀번호 불일치, 중복 가입
- 초대코드 가입 테스트: 비밀번호 팀도 초대코드로 가입 가능, 중복 가입 차단
- 팀장 정책 테스트: 팀장 본인 제거 차단, 팀장 변경 후 기존 팀장 권한 제거
- task 정책 테스트: 담당자 0명 차단, 외부 팀원 담당자 차단, 유일 담당자 팀원 제거 차단
- 댓글 권한 테스트: 댓글 작성자만 수정 가능, 비팀원 삭제 차단
- 회의록 권한 테스트: 작성자 또는 팀장만 수정 가능
- 회고록 권한 테스트: 공동 작업자 본문 수정 가능, 공동 작업자 목록은 작성자만 변경 가능

검증:

- `./gradlew test` 통과

추가 완료:

- `task_suggestions` Entity/Repository 추가
- task 추천 생성 API 추가: `POST /api/spec-documents/{specDocumentId}/task-suggestions`
- task 추천 조회 API 추가: `GET /api/spec-documents/{specDocumentId}/task-suggestions`
- task 추천 수락 API 추가: `POST /api/task-suggestions/{suggestionId}/accept`
- Gemini JSON 응답 파싱 및 local fallback 추천 5개 생성
- 추천 수락 시 기존 `TaskService.createTask` 재사용
- 중복 수락 차단: `TASK_SUGGESTION_ALREADY_ACCEPTED`
- `TaskSuggestionServiceTests` 추가
- `API_SPEC.md`, `DB_SCHEMA.md` 동기화

추가 완료:

- 팀 단위 리더보드 API 추가: `GET /api/teams/{teamId}/leaderboard`
- 담당자 기준 완료 task 수 실시간 집계
- 동점 rank 공유 정책 구현
- reputation level 계산: `SEED`, `SPROUT`, `SAPLING`, `OAK`
- `TeamLeaderboardServiceTests` 추가
- `API_SPEC.md` 동기화

추가 완료:

- `task_dependencies` Entity/Repository 추가
- task 관계 조회 API 추가: `GET /api/teams/{teamId}/task-dependencies`
- 선행 task 추가 API 추가: `POST /api/tasks/{taskId}/dependencies`
- 선행 task 삭제 API 추가: `DELETE /api/tasks/{taskId}/dependencies/{predecessorTaskId}`
- 같은 팀 task 관계 검증
- 자기 참조, 중복 관계, 순환 의존성 차단
- task 삭제 시 관련 dependency 삭제
- `TaskDependencyServiceTests` 추가
- `API_SPEC.md`, `DB_SCHEMA.md` 동기화

추가 완료:

- `notification_events` Entity/Repository 추가
- 내 알림 조회 API 추가: `GET /api/teams/{teamId}/notifications`
- 선행 task 완료 시 후행 task 담당자별 `TASK_DEPENDENCY_READY` 이벤트 생성
- 같은 수신자, 선행 task, 후행 task 조합의 중복 이벤트 생성 방지
- 실제 이메일 발송 없이 DB mock event로 검증 가능
- `NotificationEventServiceTests` 추가
- `API_SPEC.md`, `DB_SCHEMA.md` 동기화

다음 작업:

1. 새 API 프론트 연결 지점 목록 정리
2. 전체 백엔드 테스트 결과와 제출용 실행 문서 업데이트
3. KCloud 실행 설정과 환경변수 문서 정리

추가 완료:

- 프론트 merge 후 충돌 marker 제거
- 백엔드 `ErrorCode` 충돌 정리
- 팀원 프론트 구현 우선으로 중복 UI/viewModel 잔재 제거
- `TaskNewPage` date input 제출 보강
- `bootRun` 전용 로컬 기본값 추가: `DB_USERNAME=root`, `DB_PASSWORD=root`, `JWT_SECRET=local-development-secret-change-me`
- `RUNBOOK.md` 로컬 실행 절차 갱신
- `docs/CURRENT_WORK_PLAN.md` 생성

검증:

- 환경변수 없이 `./gradlew bootRun` 실행 성공
- `GET /api/health` 성공
- 브라우저 smoke test: 회원가입, 팀 생성, task 생성 성공
- `./gradlew test` 통과
- `npm run build` 통과
- `npm run lint` 통과, 기존 warning만 존재

재수립된 다음 작업:

1. `README.md`, `docs/ROADMAP.md`, `docs/TEST_RESULTS.md` 현재 상태 동기화
2. 새 백엔드 API 프론트 type/client 연결
3. MySQL 기반 전체 smoke test
4. 제출 산출물 최종 정리
5. KCloud 준비 문서화
