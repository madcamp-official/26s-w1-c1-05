# Scrum Helper Roadmap

## 1. 문서 목적

이 문서는 MVP 이후 확장할 기능을 우선순위, 설계 영향, 구현 단위로 정리한다.

현재 MVP는 팀 관리, task, 댓글, 회고록, 초대코드 가입까지를 핵심 범위로 둔다. 아래 기능은 제출 이후 또는 시간이 남는 경우 단계적으로 구현한다.

## 2. Immediate Refinements

이미 반영한 개선 사항:

| 항목 | 상태 | 구현 기준 |
|---|---|---|
| 초대코드 가입 | 구현 완료 | 팀 생성 시 unique 초대코드 자동 발급, `/api/teams/join-by-invite` 가입 |
| 초대코드 재발급 | 구현 완료 | 팀장만 `/api/teams/{teamId}/invite-code` 호출 가능 |
| 회고록 공동 작업자 권한 제한 | 구현 완료 | 본문은 작성자/공동 작업자가 수정, 공동 작업자 목록은 작성자만 수정 |
| 직접 접근 보안 예외 | 구현 완료 | 팀원이 아닌 사용자의 `teamId` 직접 접근은 `NOT_TEAM_MEMBER` 반환 |
| 회의록 CRUD | 구현 완료 | `/api/teams/{teamId}/meetings`, `/api/meetings/{meetingId}`와 회의 탭 UI |

검증 기준:

- 비밀번호 팀도 초대코드로 가입 가능해야 한다.
- 초대코드 재발급 후 이전 코드는 사용할 수 없어야 한다.
- 공동 작업자는 회고록 본문만 수정할 수 있고 공동 작업자 목록 변경은 실패해야 한다.

## 3. Phase 1: 회의 탭과 회의록 관리

상태: 구현 완료

목표:

- 팀별 회의록을 여러 개 저장하고, 회의 탭에서 조회할 수 있게 한다.

주요 기능:

- 회의록 생성/목록/상세/수정/삭제
- 회의 제목, 회의 일시, 원문 메모, 요약문 저장
- 회의록은 팀원만 조회 가능
- 회의록 수정/삭제는 작성자 또는 팀장만 가능

예상 DB:

| 테이블 | 주요 컬럼 |
|---|---|
| `meetings` | `id`, `team_id`, `author_user_id`, `title`, `meeting_at`, `raw_content`, `summary`, `created_at`, `updated_at` |

추후 확장:

- 참석자 저장이 필요하면 `meeting_attendees(meeting_id, team_id, user_id, joined_at)`를 추가한다.

API 초안:

- `GET /api/teams/{teamId}/meetings`
- `POST /api/teams/{teamId}/meetings`
- `GET /api/meetings/{meetingId}`
- `PATCH /api/meetings/{meetingId}`
- `DELETE /api/meetings/{meetingId}`

## 4. Phase 2: Gemini 기반 문서/Task 자동 생성

상태: 일부 구현 완료

목표:

- 선택한 회의록들을 바탕으로 스펙 문서 초안을 만들고, 스펙 문서에서 task 후보를 추천한다.

구현 원칙:

- Gemini API Key는 `.env` 또는 서버 환경변수로만 관리하고 Git에 커밋하지 않는다.
- AI 응답은 바로 DB에 확정 저장하지 않고, 사용자가 검토한 뒤 저장한다.
- 프롬프트 입력에는 팀 이름, 회의록 제목/요약/원문만 넣고 비밀번호/토큰은 절대 포함하지 않는다.

주요 기능:

- 회의록 다중 선택: 구현 완료
- 스펙 문서 초안 생성: 구현 완료
- Gemini API 키가 없거나 호출 실패 시 로컬 초안 생성: 구현 완료
- 생성 결과 수정 후 저장: 구현 완료
- 스펙 문서 기반 task 추천: 미구현
- 추천 task 중 선택한 항목만 실제 task로 생성: 미구현

예상 DB:

| 테이블 | 주요 컬럼 |
|---|---|
| `spec_documents` | `id`, `team_id`, `created_by_user_id`, `title`, `content`, `source_meeting_ids`, `created_at`, `updated_at` |
| `task_suggestions` | `id`, `team_id`, `spec_document_id`, `title`, `description`, `priority`, `due_date`, `accepted`, `created_at` |

API 초안:

- `POST /api/teams/{teamId}/spec-documents/draft`
- `POST /api/teams/{teamId}/spec-documents`
- `GET /api/teams/{teamId}/spec-documents`
- `POST /api/spec-documents/{specDocumentId}/task-suggestions`
- `POST /api/task-suggestions/{suggestionId}/accept`

## 5. Phase 3: 게이미피케이션

목표:

- 완료한 task를 기반으로 팀원의 참여 현황을 시각화한다.

주요 기능:

- 리더보드: 유저별 완료 task 수 집계
- 명성 시스템: 누적 완료 task 수에 따른 등급 부여
- 업적 시스템: 특정 조건 달성 시 배지 부여
- 성장 나무: 날짜와 완료 task 수에 따라 나무 기둥/잎 변화

정책:

- 랭킹은 팀 단위로 계산한다.
- 하위권 강조는 조롱성 문구 없이 개선 필요 정도로만 표시한다.
- 완료 task 집계는 task 담당자 기준으로 계산한다.

예상 DB:

| 테이블 | 주요 컬럼 |
|---|---|
| `achievement_definitions` | `id`, `code`, `name`, `description`, `condition_type`, `condition_value` |
| `user_achievements` | `user_id`, `achievement_id`, `team_id`, `earned_at` |
| `user_reputation_snapshots` | `id`, `team_id`, `user_id`, `completed_task_count`, `rank_level`, `snapshot_date` |

## 6. Phase 4: Task 관리 고도화

목표:

- 단일 task 목록을 넘어 의존성, 하위 task, 로드맵 Overview를 제공한다.

주요 기능:

- Task 전후 관계 설정
- 선행 task 완료 시 후행 task 담당자에게 이메일 알림
- Task 그룹과 하위 task
- 로드맵 Overview 화면

예상 DB:

| 테이블 | 주요 컬럼 |
|---|---|
| `task_dependencies` | `predecessor_task_id`, `successor_task_id`, `created_at` |
| `task_groups` | `id`, `team_id`, `name`, `sort_order`, `created_at` |
| `sub_tasks` | `id`, `parent_task_id`, `title`, `completed`, `sort_order`, `created_at`, `updated_at` |

주의 사항:

- 순환 의존성은 저장 전에 차단한다.
- 이메일 발송은 로컬 개발에서는 mock sender로 처리하고, 실제 SMTP는 배포 단계에서 설정한다.
- 하위 task 완료와 상위 task 완료를 자동 연동할지 여부는 별도 정책으로 확정한다.

## 7. Phase 5: 백엔드 안정화와 운영 준비

목표:

- MVP 기능을 회귀 테스트로 보호한다.
- local과 KCloud 환경을 코드 변경 없이 전환할 수 있게 한다.
- 새 기능 추가 전에 권한, 트랜잭션, DB 정합성을 명확하게 검증한다.

주요 작업:

- 백엔드 service/controller 테스트 확장
- 팀장 1명 정책, task 담당자 1명 이상 정책, 회고록 공동 작업자 권한 회귀 테스트
- 스펙 문서 초안 생성과 저장의 팀 소속 검증 테스트
- `local`/운영 환경변수 정리
- `JWT_SECRET`, `GEMINI_API_KEY`, DB 접속 정보 문서화
- API 오류 코드와 HTTP status 동기화
- README/RUNBOOK 실행 절차 업데이트

구현 기준:

- 디자인, CSS, 화면 레이아웃 개선은 이 로드맵의 실행 범위에서 제외한다.
- 프론트엔드 변경은 새 백엔드 API 연결에 필요한 최소 API client 추가까지만 포함한다.
- 모든 신규 기능은 `API_SPEC.md`, `DB_SCHEMA.md`, 테스트 문서와 함께 갱신한다.

## 8. 우선순위

| 순위 | 기능 | 이유 |
|---:|---|---|
| 1 | 백엔드 회귀 테스트 확장 | 기존 MVP 기능을 보호해야 새 기능을 안전하게 붙일 수 있음 |
| 2 | 스펙 문서 기반 task 자동 추천 | 회의록 -> 스펙 문서 -> task로 이어지는 핵심 자동화 |
| 3 | 리더보드/명성 API | 완료 task 수 기반 게이미피케이션의 서버 기반 |
| 4 | task 의존성/로드맵 API | task 관리 고도화의 DB/API 기반 |
| 5 | 알림 mock event | 실제 이메일 연동 전 서버 이벤트 조건 검증 |

## 9. 백엔드 업그레이드 실행 계획

상세 실행 계획은 `docs/BACKEND_UPGRADE_PLAN.md`를 기준으로 한다.

요약:

1. 테스트 profile과 백엔드 회귀 테스트를 먼저 정리한다.
2. `task_suggestions` 도메인과 API를 추가한다.
3. 스펙 문서 기반 Gemini/local fallback task 추천을 구현한다.
4. 추천 task 수락 시 기존 task 생성 정책을 재사용한다.
5. 팀 단위 leaderboard API를 실시간 집계로 구현한다.
6. task dependency 저장과 순환 의존성 차단을 구현한다.
7. 선행 task 완료 시 mock notification event를 남긴다.
8. 새 API와 DB 변경은 `API_SPEC.md`, `DB_SCHEMA.md`, 테스트 문서에 반영한다.

## 10. 현재 보류 결정

| 항목 | 보류 이유 |
|---|---|
| 음성 파일 업로드/전사 | 파일 저장소, 업로드 제한, STT API 비용/키 관리가 필요 |
| 이메일 알림 | SMTP 또는 외부 메일 서비스 설정이 필요 |
| KCloud 배포 연동 | 현재 요청 기준은 로컬 우선 개발 |
| 실시간 동시 편집 | 충돌 처리와 WebSocket 설계가 필요 |
