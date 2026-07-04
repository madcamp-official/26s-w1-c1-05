# Scrum Helper Current Work Plan

## 1. 기준 시점

- 기준일: 2026-07-04
- 기준 코드: 현재 workspace 최신 코드
- 개발 우선순위: 백엔드는 현재 구현 유지, 프론트는 팀원 구현 우선
- 실행 기준: 로컬 MySQL + Spring Boot + Vite
- 배포 기준: 지금은 로컬 실행 우선, KCloud는 제출 전 준비 단계에서 연결

## 2. 현재 완료 상태

### 2.1 MVP 기능

| 영역 | 상태 | 메모 |
|---|---|---|
| 회원가입/로그인 | 완료 | JWT, BCrypt, `/api/me` |
| 팀 | 완료 | 팀 생성, 목록, 상세, 공개/비밀번호/초대코드 가입 |
| 팀장/팀원 | 완료 | 팀장 변경, 팀원 제거, 팀장 권한 |
| Task | 완료 | 생성, 목록, 상세, 수정, 삭제, 완료 변경, 담당자 1명 이상 |
| 댓글 | 완료 | 작성, 수정, 삭제, 작성자 권한 |
| 회고록 | 완료 | 생성, 목록, 상세, 수정, 삭제, 공동 작업자 권한 |
| 회의록 | 완료 | 생성, 목록, 상세, 수정, 삭제 |
| 스펙 문서 | 완료 | 회의록 기반 초안 생성, 저장, 목록, 상세, 수정, 삭제, 메인 문서 지정 |

### 2.2 백엔드 확장 기능

| 영역 | 백엔드 상태 | 프론트 연결 상태 |
|---|---|---|
| 스펙 문서 기반 task 추천 | API 구현 완료 | 미연결 |
| task 추천 수락 | API 구현 완료 | 미연결 |
| 리더보드/명성 | API 구현 완료 | 미연결 |
| task dependency | API 구현 완료 | 미연결 |
| notification mock event | API 구현 완료 | 미연결 |

### 2.3 머지 안정화

완료:

- 프론트 merge conflict marker 제거
- 백엔드 `ErrorCode` 충돌 정리
- 팀원 프론트 구현 우선으로 중복/잔여 코드 제거
- `TaskNewPage` date input 제출 보강
- `bootRun` 로컬 기본 DB 계정 설정

검증:

- `./gradlew test` 통과
- `npm run build` 통과
- `npm run lint` 통과, 기존 경고만 존재
- `./gradlew bootRun` 환경변수 없이 실행 성공
- `GET /api/health` 성공
- 브라우저 smoke: 회원가입, 팀 생성, task 생성 성공

## 3. 현재 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 프론트 디자인/구조와 API 연결 충돌 | 팀원 작업과 충돌 가능 | API client와 타입 추가를 먼저 작게 만들고, 화면 변경은 최소화 |
| 문서 상태 불일치 | 제출 산출물 신뢰도 하락 | README, ROADMAP, TEST_RESULTS, API/DB 문서 동기화 |
| MySQL 로컬 데이터 누적 | 테스트 결과 혼동 | smoke 데이터는 데모 전 정리 또는 명확히 구분 |
| lint warning 누적 | 실제 오류와 경고 구분 어려움 | 제출 전 hook dependency warning만 선별 처리 |
| KCloud 설정 미검증 | 배포 직전 지연 | 로컬 안정화 후 환경변수 목록과 실행 절차 먼저 고정 |

## 4. 다음 작업 계획

### Phase 1. 상태 동기화와 제출 기준 재정의

목표:

- 현재 구현 상태를 문서와 맞춘다.
- 팀원이 이어서 보기 쉬운 기준 문서를 만든다.

작업:

1. `README.md`의 현재 구현 상태 갱신
2. `docs/ROADMAP.md`의 구현/미구현 상태 갱신
3. `docs/TEST_RESULTS.md`에 2026-07-04 머지 후 검증 결과 추가
4. `docs/RUNBOOK.md`의 `bootRun` 실행 방식 유지

완료 기준:

- 문서에서 이미 구현된 기능을 “미구현”으로 표시하지 않는다.
- 로컬 실행 방법이 `bootRun`, `npm run dev` 기준으로 명확하다.

### Phase 2. 새 백엔드 API의 프론트 연결 지점 추가

목표:

- 팀원 디자인 화면을 크게 바꾸지 않고 새 API를 사용할 수 있는 최소 연결층을 만든다.

작업:

1. 타입 추가
   - `TaskSuggestion`
   - `TeamLeaderboard`
   - `TaskDependency`
   - `NotificationEvent`
2. API client 추가
   - `specDocumentApi.generateTaskSuggestions`
   - `specDocumentApi.getTaskSuggestions`
   - `specDocumentApi.acceptTaskSuggestion`
   - `teamApi.getLeaderboard`
   - `taskApi.getTaskDependencies`
   - `taskApi.addTaskDependency`
   - `taskApi.deleteTaskDependency`
   - `notificationApi.getNotifications`
3. 화면 반영은 최소화
   - 스펙 문서 상세: task 추천 생성/조회/수락 버튼 또는 임시 섹션
   - 팀 대시보드: 리더보드 데이터 표시 영역 연결
   - task 상세: dependency 조회/추가/삭제 연결 후보
   - 팀 레이아웃 또는 대시보드: notification 조회 후보

완료 기준:

- `npm run build` 통과
- 기존 팀원 화면 구조를 크게 바꾸지 않는다.
- 미연결 API가 어디에 붙을지 명확히 남긴다.

### Phase 3. 통합 회귀 테스트

목표:

- 머지 후 전체 기능이 로컬 MySQL 기준으로 실제 동작하는지 확인한다.

작업:

1. 백엔드 자동 테스트 실행: `./gradlew test`
2. 프론트 정적 검증: `npm run build`, `npm run lint`
3. 브라우저 smoke test
   - 회원가입
   - 팀 생성
   - 팀 가입
   - task 생성/완료
   - 댓글 작성
   - 회의록 생성
   - 스펙 문서 생성
   - 회고록 생성
4. 새 API smoke test
   - task suggestion 생성/수락
   - leaderboard 조회
   - dependency 생성/순환 차단
   - 선행 task 완료 후 notification 생성

완료 기준:

- 실패 항목은 `docs/TEST_RESULTS.md`에 원인과 상태를 남긴다.
- 제출 데모에 필요한 흐름은 최소 1회 완주한다.

### Phase 4. 산출물 최종 정리

목표:

- 공통과제 제출 산출물을 빠짐없이 맞춘다.

작업:

1. 기획안: `SPEC.md` 최종 점검
2. 기능 명세서: MVP와 추가 기능 구분
3. IA 및 화면 설계서: `IA.md`, 팀원 디자인 문서와 충돌 여부 확인
4. DB 스키마: `DB_SCHEMA.md`와 Entity 비교
5. API 문서: `API_SPEC.md`와 Controller 비교
6. 배포/실행 문서: `README.md`, `docs/RUNBOOK.md`
7. 테스트 문서: `docs/TEST_SCENARIOS.md`, `docs/TEST_RESULTS.md`
8. 회고 문서: 역할 분담, 어려움, 해결, 개선점 작성

완료 기준:

- README만 보고 로컬 실행 가능
- API/DB 문서가 현재 코드와 맞음
- 발표 데모 순서가 문서화됨

### Phase 5. KCloud 준비

목표:

- 로컬 완성 후 KCloud로 옮길 때 필요한 설정을 미리 정리한다.

작업:

1. KCloud 환경변수 목록 작성
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `CORS_ALLOWED_ORIGINS`
2. MySQL 생성 SQL 정리
3. Spring Boot 실행 명령 정리
4. Vite build 결과를 어디서 서빙할지 결정
5. DNS 연결 절차 확인

완료 기준:

- 코드 변경 없이 환경변수만 바꿔 KCloud 실행 가능
- 민감정보를 Git에 넣지 않는다.

## 5. 우선순위 재정렬

| 우선순위 | 작업 | 이유 |
|---:|---|---|
| 1 | 문서 상태 동기화 | 현재 계획 문서 일부가 실제 구현보다 뒤처져 있음 |
| 2 | 새 API client/type 추가 | 백엔드 구현을 프론트에서 쓸 수 있게 하는 최소 연결 |
| 3 | MySQL 기반 통합 smoke test | 제출 데모 안정성 확보 |
| 4 | 산출물 최종 정리 | 공통과제 제출 요구사항 충족 |
| 5 | KCloud 준비 | 로컬 완성 후 배포 전환 비용 감소 |

## 6. 이번 단계에서 하지 않을 것

- 디자인 시스템 대규모 재구성
- 칸반 drag and drop
- 캘린더 UI
- 다크 모드
- 실제 이메일 발송
- 음성 파일 업로드/STT
- 실시간 공동 편집

위 항목은 제출 안정화 이후 별도 작업으로 분리한다.

## 7. 바로 다음 액션

1. `README.md`, `docs/ROADMAP.md`, `docs/TEST_RESULTS.md`를 현재 상태로 갱신한다.
2. 새 API 연결을 위한 타입/API client를 추가한다.
3. 팀원 프론트 화면과 충돌하지 않는 최소 위치에 데이터 표시를 연결한다.
4. 전체 빌드/테스트/smoke test를 다시 수행한다.
