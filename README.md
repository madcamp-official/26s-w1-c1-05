# Scrum Helper

Scrum Helper는 2인 팀의 웹 기반 공통 과제를 위한 스크럼 관리 서비스입니다.

팀 생성, 팀 가입, 팀장 변경, task 담당자 지정, task 댓글, 일지형 회고록 작성을 MVP 범위로 구현합니다.

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

## Current Status

구현 완료:

- 프로젝트 루트 정리
- Spring Boot backend 스캐폴딩
- React frontend 스캐폴딩
- JWT 기반 회원가입/로그인/내 정보 조회
- 프론트 인증 상태 복구와 보호 라우트
- Team / TeamMember Entity
- 팀 생성, 팀 목록, 팀 상세, 팀 가입, 팀 대시보드 API
- 팀 목록 화면과 팀 생성/가입 UI
- 팀장 변경, 팀원 제거, 팀 설정 API/UI
- Task Entity/API
- task 목록, 생성, 완료 변경 UI
- task 상세 수정/삭제 UI
- task 댓글 작성/수정/삭제 API/UI
- 회고록 작성/목록/상세/수정/삭제 API/UI
- 회고록 공동 작업자 지정과 작성자/공동 작업자 권한 검증
- 팀 대시보드 회고록 집계

다음 구현 대상:

- 전체 사용자 흐름 수동 테스트
- 제출용 산출물 최종 동기화
- KCloud 배포 준비
