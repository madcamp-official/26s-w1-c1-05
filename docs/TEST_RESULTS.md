# Scrum Helper Test Results

## 1. 실행 일시

- 일시: 2026-07-03 16:21 KST
- 대상 코드: 현재 workspace 최신 코드
- 백엔드 검증 방식: `.\gradlew.bat test` + H2 in-memory DB
- 프론트엔드 검증 방식: `npm run build`

기존 `8080` 서버와 MySQL 데이터는 건드리지 않기 위해 H2 테스트 런타임으로 서비스 시나리오를 검증했다.

## 2. 사전 검증

| 항목 | 결과 | 메모 |
|---|---|---|
| 백엔드 테스트 | PASS | `.\gradlew.bat test` 성공 |
| 스펙 문서 서비스 통합 테스트 | PASS | 회원가입, 팀 생성, 회의록 생성, 초안 생성, 저장, 외부 사용자 차단 |
| 프론트 빌드 | PASS | `npm run build` 성공 |
| 프론트 린트 | PASS | `npm run lint` 성공, 기존 Fast Refresh/useEffect 경고만 출력 |

## 3. 검증 중 발견해 수정한 이슈

| ID | 우선순위 | 문제 | 조치 | 최종 결과 |
|---|---|---|---|---|
| BUG-01 | P2 | 인증 없이 보호 API 호출 시 `401 UNAUTHORIZED` JSON 대신 `403` 빈 응답 반환 | Spring Security `authenticationEntryPoint`, `accessDeniedHandler`에서 공통 `ApiResponse` 오류 응답을 쓰도록 수정 | PASS |
| BUG-02 | P1 | task 수정 시 기존 담당자와 겹치는 담당자 목록으로 교체하면 unique 제약으로 `500 INTERNAL_SERVER_ERROR` 발생 | `TaskService.replaceAssignees()`에서 기존 담당자 삭제 후 `flush()` 실행 | PASS |

## 4. API 시나리오 결과

총 67개 API 검증 항목을 실행했고, 최종 결과는 전부 통과했다.

| 영역 | 대표 검증 | 결과 |
|---|---|---|
| PREP | 헬스 체크 | PASS |
| AUTH-01 | 회원가입, 이메일 중복 차단 | PASS |
| AUTH-02 | 로그인, 내 정보 조회, 비로그인 보호 API 차단 | PASS |
| TEAM-01 | 공개 팀 생성, 즉시 가입, 중복 가입 차단 | PASS |
| TEAM-02 | 비밀번호 팀 생성, 잘못된 비밀번호 차단, 올바른 비밀번호 가입 | PASS |
| TEAM-03 | 팀장만 팀 정보/비밀번호 수정, 중복 팀명 차단 | PASS |
| MEMBER-01 | 팀원 목록과 역할 표시 | PASS |
| MEMBER-02 | 팀장 변경, 단일 팀장 유지, 기존 팀장 권한 제거 | PASS |
| MEMBER-03 | 본인 제거 차단, 유일 담당자 제거 차단, 재배정 후 제거 | PASS |
| TASK-01 | 담당자 필수, 팀 외부 담당자 차단, task 생성 | PASS |
| TASK-02 | 완료/미완료 상태 변경 | PASS |
| TASK-03 | task 상세 수정, 담당자 교체, 삭제 후 조회 차단 | PASS |
| COMMENT-01 | 댓글 작성, 작성자만 수정/삭제 | PASS |
| RETRO-01 | 회고록 생성, 작성자 공동작업자 중복 차단, 팀 외부 공동작업자 차단 | PASS |
| RETRO-02 | 작성자/공동작업자 회고록 수정 | PASS |
| RETRO-03 | 공동작업자 해제 후 수정 권한 제거, 팀원 조회 가능 | PASS |
| RETRO-04 | 회고록 삭제, 삭제 후 조회 차단 | PASS |
| DASH-01 | task/회고록 대시보드 집계와 API 목록 데이터 일치 | PASS |

최종 API 검증 요약:

```text
resultCount: 67
failedCount: 0
```

### 4.1 추가 개선 API 검증

초대코드 가입, 초대코드 재발급, 회고록 공동 작업자 목록 권한, 직접 접근 보안 예외를 H2 테스트 서버에서 추가로 검증했다.

테스트 데이터:

| 항목 | 값 |
|---|---|
| 테스트 stamp | `20260703143040` |
| 팀 ID | `1` |
| 기존 초대코드 | `Q97H4JDT` |
| 재발급 초대코드 | `6C964S2S` |
| 회고록 ID | `1` |

| 검증 항목 | 결과 |
|---|---|
| 비밀번호 팀 생성 시 초대코드 발급 | PASS |
| 공백/하이픈/소문자가 섞인 초대코드 가입 | PASS |
| 잘못된 초대코드 가입 차단 | PASS |
| 팀원이 초대코드 재발급 시도 시 `LEADER_ONLY` | PASS |
| 팀장이 초대코드 재발급 | PASS |
| 재발급 전 초대코드 만료 처리 | PASS |
| 새 초대코드 가입 | PASS |
| 팀 외부 사용자의 teamId 직접 접근 시 `NOT_TEAM_MEMBER` | PASS |
| 비로그인 teamId 직접 접근 시 `UNAUTHORIZED` | PASS |
| 공동 작업자의 회고록 본문 수정 | PASS |
| 공동 작업자의 공동 작업자 목록 변경 시 `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` | PASS |
| 작성자의 공동 작업자 목록 변경 | PASS |

추가 개선 검증 요약:

```text
resultCount: 18
failedCount: 0
```

### 4.2 회의록 API 검증

회의 탭/회의록 CRUD 구현 후 H2 테스트 서버에서 API 흐름을 추가 검증했다.

테스트 데이터:

| 항목 | 값 |
|---|---|
| 테스트 stamp | `20260703144122` |
| 팀 ID | `2` |
| 회의록 ID | `1` |

| 검증 항목 | 결과 |
|---|---|
| 팀원 회원가입 및 팀 가입 | PASS |
| 회의록 생성 | PASS |
| 팀원의 회의록 목록 조회 | PASS |
| 팀원의 회의록 상세 조회 | PASS |
| 팀 외부 사용자의 회의록 목록 조회 차단 | PASS |
| 팀 외부 사용자의 회의록 상세 조회 차단 | PASS |
| 일반 팀원의 회의록 수정 차단 | PASS |
| 작성자의 회의록 수정 | PASS |
| 일반 팀원의 회의록 삭제 차단 | PASS |
| 작성자의 회의록 삭제 | PASS |
| 삭제된 회의록 조회 시 `MEETING_NOT_FOUND` | PASS |

회의록 검증 요약:

```text
resultCount: 16
failedCount: 0
```

### 4.3 스펙 문서 서비스 검증

회의록 기반 스펙 문서 초안 생성/저장 기능을 H2 테스트 런타임의 서비스 통합 테스트로 검증했다.

| 검증 항목 | 결과 |
|---|---|
| 회원가입 후 팀 생성 | PASS |
| 팀 회의록 생성 | PASS |
| 회의록 기반 스펙 초안 생성 | PASS |
| Gemini 키 미설정 시 `LOCAL_FALLBACK` 생성 | PASS |
| 생성 초안 저장 | PASS |
| 저장된 스펙 문서 목록 조회 | PASS |
| 팀 외부 사용자의 스펙 초안 생성 차단 | PASS |

스펙 문서 검증 요약:

```text
resultCount: 7
failedCount: 0
```

## 5. UI Smoke Test 결과

브라우저에서 실제 프론트 화면을 열어 주요 라우팅과 데이터 표시를 확인했다.

이 항목은 2026-07-03 13:17 KST에 수행한 기존 smoke test 결과다. 이번 14:30 KST 검증에서는 프론트엔드 정적 빌드만 다시 확인했다.

테스트 데이터:

| 항목 | 값 |
|---|---|
| 테스트 stamp | `20260703131719` |
| 사용자 | `ui-member-b-20260703131719@test.com` |
| 팀 | `UI Smoke Team 20260703131719` |
| task | `UI Smoke Task 20260703131719` |
| 회고록 | `UI Smoke Retro 20260703131719` |

| 화면 | 확인 내용 | 결과 |
|---|---|---|
| 로그인 | 이메일/비밀번호 입력 후 `/teams` 이동 | PASS |
| 팀 목록 | 테스트 팀 카드, 내 상태 MEMBER, 입장 버튼 표시 | PASS |
| 팀 대시보드 | 팀명, 팀원 수, 미완료 task 수, 회고록 수 표시 | PASS |
| task 목록 | task 보드와 `UI Smoke Task` 표시 | PASS |
| 회고록 목록 | `UI Smoke Retro`, 작성자 표시 | PASS |
| 회고록 상세 | 제목, 어제 한 일, 오늘 할 일, 궁금한/필요한/알아낸 것, 공동 작업자 체크박스 표시 | PASS |

## 6. 남은 확인 권장 사항

아래 항목은 API 검증으로는 통과했지만, 제출 전 실제 MySQL 기반 로컬 실행에서 한 번 더 수동 확인하는 것이 좋다.

| 항목 | 이유 |
|---|---|
| MySQL 기반 `bootRun` | 이번 최종 자동 검증은 H2 테스트 런타임으로 수행 |
| 기존 `8080` 서버 재시작 | 기존 서버는 수정 전 코드일 수 있으므로 새 코드로 재기동 필요 |
| 브라우저에서 task/댓글/회고록 입력 폼 직접 조작 | API와 주요 화면 렌더링은 통과했지만, 모든 폼 클릭 흐름을 전부 브라우저로 반복하지는 않음 |

## 7. 결론

현재 최신 코드 기준으로 핵심 MVP 기능의 API 정책, 권한, 데이터 무결성, 주요 화면 렌더링은 통과했다.

제출 전에는 MySQL 비밀번호 환경 변수를 설정한 뒤 `backend`를 새로 기동하고, `docs/TEST_SCENARIOS.md`의 최종 데모 시나리오를 브라우저에서 한 번 완주하면 된다.
