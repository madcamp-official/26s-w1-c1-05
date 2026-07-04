# Scrum Helper

Scrum Helper는 2인 팀의 웹 기반 공통 과제를 위한 스크럼 관리 서비스입니다.

팀 생성, 팀 가입, 팀장 변경, task 담당자 지정, task 댓글, 일지형 회고록 작성을 MVP 범위로 구현합니다.
회의록 기반 스펙 문서 초안 생성, 스펙 문서 기반 task 추천, 리더보드, task 의존성, mock 알림은 MVP 이후 확장 기능으로 백엔드 구현이 완료되어 있습니다.

## Tech Stack

| 영역 | 기술 |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA |
| Database | MySQL |
| Auth | JWT, BCrypt |

## Directory

```text
backend/                 Spring Boot API server
frontend/                React TypeScript client
docs/                    Local runbook and deliverable docs
docs/TEST_SCENARIOS.md   Manual test scenarios
docs/TEST_RESULTS.md     Latest test execution result
docs/ROADMAP.md          Post-MVP feature roadmap
docs/CURRENT_WORK_PLAN.md Current status and next work plan
SPEC.md                  Product specification
DB_SCHEMA.md             DB schema
API_SPEC.md              API specification
IA.md                    IA and screen flow
BACKEND_DESIGN.md        Backend implementation design
FRONTEND_DESIGN.md       Frontend implementation design
IMPLEMENTATION_PLAN.md   5-day implementation plan
```

## Local Run

자세한 로컬 실행 방법은 [docs/RUNBOOK.md](docs/RUNBOOK.md)를 확인하세요.

Backend:

```powershell
cd backend
.\gradlew.bat bootRun
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

기본 접속 주소:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
```

Gemini 기반 회의록 요약, 스펙 문서 초안 생성, task 추천 생성을 사용하려면 백엔드 실행 전에 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` 환경변수를 설정합니다.
키가 없거나 호출에 실패하면 로컬 규칙 기반 결과가 생성됩니다.

## Current Status

구현 완료:

- 프로젝트 루트 정리
- Spring Boot backend 스캐폴딩
- React frontend 스캐폴딩
- JWT 기반 회원가입/로그인/내 정보 조회
- 프론트 인증 상태 복구와 보호 라우트
- Team / TeamMember Entity
- 팀 생성, 팀 목록, 팀 상세, 공개/비밀번호/초대코드 가입, 팀 대시보드 API
- 팀 목록 화면과 팀 생성/가입/초대코드 가입 UI
- 팀장 변경, 팀원 제거, 팀 설정 API/UI
- 팀장 전용 초대코드 재발급 API/UI
- Task Entity/API
- task 목록, 생성, 완료 변경 UI
- task 상세 수정/삭제 UI
- task 댓글 작성/수정/삭제 API/UI
- 회고록 작성/목록/상세/수정/삭제 API/UI
- 회고록 공동 작업자 지정과 작성자/공동 작업자 권한 검증
- 회고록 공동 작업자 목록 작성자 전용 변경 제한
- 팀 대시보드 회고록 집계
- 회의록 작성/목록/상세/수정/삭제 API/UI
- 회의록 다중 선택 기반 스펙 문서 초안 생성 API/UI
- 스펙 문서 저장/목록 조회 API/UI
- 스펙 문서 기반 task 추천/수락 API
- 팀 리더보드/명성 API
- task dependency API
- dependency 기반 mock notification event API
- 로컬 `bootRun` 기본 실행값

다음 구현 대상:

- 새 백엔드 API의 프론트 client/type 연결
- MySQL 기반 전체 사용자 흐름 수동 테스트
- 제출용 산출물 최종 동기화
- KCloud 배포 준비
