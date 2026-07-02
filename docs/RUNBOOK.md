# Scrum Helper Local Runbook

## 1. 전제 조건

- Java 17
- Node.js 20 이상
- MySQL 8.x

현재 프로젝트는 Docker 없이 로컬 MySQL에 연결하는 방식으로 실행한다.

## 2. MySQL 준비

MySQL에서 데이터베이스를 먼저 만든다.

```sql
CREATE DATABASE scrum_helper
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

기본 연결값:

| 항목 | 기본값 |
|---|---|
| host | `localhost` |
| port | `3306` |
| database | `scrum_helper` |
| username | `root` |
| password | empty |

다른 값을 쓰는 경우 환경 변수로 덮어쓴다.

## 3. 백엔드 실행

경로:

```text
backend
```

PowerShell 예시:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET = "local-development-secret-change-me"
.\gradlew.bat bootRun
```

환경 변수:

| 이름 | 기본값 | 설명 |
|---|---|---|
| `SERVER_PORT` | `8080` | 백엔드 포트 |
| `DB_URL` | `jdbc:mysql://localhost:3306/scrum_helper?...` | MySQL JDBC URL |
| `DB_USERNAME` | `root` | DB 사용자 |
| `DB_PASSWORD` | empty | DB 비밀번호 |
| `JPA_DDL_AUTO` | `update` | JPA schema 반영 방식 |
| `JWT_SECRET` | local default | JWT 서명 secret |
| `JWT_EXPIRATION_MILLIS` | `86400000` | access token 만료 시간 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | 프론트엔드 origin |

헬스 체크:

```text
GET http://localhost:8080/api/health
```

## 4. 프론트엔드 실행

경로:

```text
frontend
```

최초 1회:

```powershell
npm install
```

실행:

```powershell
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173
```

API 서버 주소를 바꾸려면 `frontend/.env.local`을 만든다.

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

## 5. 현재 동작 범위

현재 구현된 기능:

- 백엔드 프로젝트 실행 구조
- 프론트엔드 프로젝트 실행 구조
- 공통 API 응답 포맷
- 전역 예외 처리
- JWT access token 생성/검증
- 회원가입
- 로그인
- 로그아웃
- 내 정보 조회
- 프론트 인증 상태 복구
- 보호 라우트
- 로그인/회원가입 화면
- 팀 관련 화면 placeholder

다음 구현 대상:

- Team Entity/API
- 전체 팀 목록
- 팀 생성
- 공개 팀 가입
- 비밀번호 팀 가입
- 팀 대시보드

## 6. 검증 명령

백엔드:

```powershell
cd backend
.\gradlew.bat test
```

프론트엔드:

```powershell
cd frontend
npm run build
```
