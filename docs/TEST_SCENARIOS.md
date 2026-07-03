# Scrum Helper Test Scenarios

## 1. 문서 목적

이 문서는 Scrum Helper MVP가 구현된 모든 기능을 브라우저에서 직접 재현하며 확인하기 위한 수동 테스트 시나리오다.

목표는 아래 흐름을 실제 사용자 관점에서 끝까지 검증하는 것이다.

- 회원가입/로그인
- 팀 생성/가입/초대코드/설정
- 팀장 변경/팀원 제거
- task 생성/수정/완료/삭제
- task 댓글 작성/수정/삭제
- 회의록 작성/수정/삭제
- 회고록 작성/수정/삭제
- 회고록 공동 작업자 권한
- 팀 대시보드 집계

## 2. 테스트 전 준비

### 2.1 실행 전제

로컬 실행 문서는 `docs/RUNBOOK.md`를 따른다.

필수 실행 상태:

| 항목 | 값 |
|---|---|
| Backend | `http://localhost:8080` |
| Frontend | `http://localhost:5173` |
| API Base | `http://localhost:8080/api` |
| DB | MySQL `scrum_helper` |

기본 확인:

```text
GET http://localhost:8080/api/health
```

브라우저 확인:

```text
http://localhost:5173
```

### 2.2 권장 테스트 계정

테스트는 최소 3명으로 진행한다.

| 구분 | 이름 | 이메일 | 비밀번호 | 용도 |
|---|---|---|---|---|
| User A | Owner A | owner-a@test.com | password | 팀 생성자, 최초 팀장 |
| User B | Member B | member-b@test.com | password | 팀원, task 담당자, 회고록 공동 작업자 |
| User C | Member C | member-c@test.com | password | 권한 없는 팀원 또는 새 팀장 |
| User X | Outsider X | outsider-x@test.com | password | 팀 외부 사용자 검증 |

이미 같은 이메일로 가입되어 있다면 이메일 뒤에 날짜나 숫자를 붙여 새 계정을 만든다.

### 2.3 권장 테스트 팀

| 팀명 | 비밀번호 | 용도 |
|---|---|---|
| Scrum Test Public | 없음 | 공개 팀 가입 테스트 |
| Scrum Test Private | team1234 | 비밀번호 팀 가입 테스트 |

팀 이름은 unique 정책이 있으므로, 중복 오류가 나면 팀명 뒤에 숫자를 붙인다.

## 3. 테스트 결과 기록표

각 시나리오를 수행하며 아래 형식으로 기록한다.

| ID | 시나리오 | 결과 | 메모 |
|---|---|---|---|
| AUTH-01 | 회원가입 | PASS / FAIL |  |
| AUTH-02 | 로그인/토큰 복구 | PASS / FAIL |  |
| TEAM-01 | 공개 팀 생성 | PASS / FAIL |  |
| TEAM-02 | 비밀번호 팀 생성/가입 | PASS / FAIL |  |
| TEAM-03 | 초대코드 가입/재발급 | PASS / FAIL |  |
| TEAM-04 | 팀 설정 변경 | PASS / FAIL |  |
| MEMBER-01 | 팀원 목록/역할 | PASS / FAIL |  |
| MEMBER-02 | 팀장 변경 | PASS / FAIL |  |
| MEMBER-03 | 팀원 제거 제약 | PASS / FAIL |  |
| TASK-01 | task 생성 | PASS / FAIL |  |
| TASK-02 | task 완료/미완료 | PASS / FAIL |  |
| TASK-03 | task 수정/삭제 | PASS / FAIL |  |
| COMMENT-01 | 댓글 작성/수정/삭제 | PASS / FAIL |  |
| MEETING-01 | 회의록 작성/조회 | PASS / FAIL |  |
| MEETING-02 | 회의록 수정/삭제 권한 | PASS / FAIL |  |
| RETRO-01 | 회고록 생성 | PASS / FAIL |  |
| RETRO-02 | 회고록 본문/공동 작업자 권한 | PASS / FAIL |  |
| RETRO-03 | 회고록 권한 제한 | PASS / FAIL |  |
| DASH-01 | 대시보드 집계 | PASS / FAIL |  |

## 4. 인증 시나리오

### AUTH-01. 회원가입

목적:

- `name`, `email`, `password` 기반 회원가입이 동작하는지 확인한다.

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | `/signup` 접속 | 회원가입 화면 표시 |
| 2 | User A 정보 입력 후 회원가입 | 회원가입 성공, 로그인 상태로 전환 |
| 3 | 로그아웃 | 로그인 화면 또는 비로그인 상태로 전환 |
| 4 | User B, User C, User X도 같은 방식으로 가입 | 각 계정 가입 성공 |

확인 포인트:

- 이메일 중복 가입 시 오류 메시지가 표시되어야 한다.
- 비밀번호 원문이 화면이나 API 응답에 노출되지 않아야 한다.

### AUTH-02. 로그인과 새로고침 복구

목적:

- JWT 저장과 인증 상태 복구가 동작하는지 확인한다.

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | `/login` 접속 | 로그인 화면 표시 |
| 2 | User A로 로그인 | `/teams`로 이동 |
| 3 | 브라우저 새로고침 | 로그인 상태 유지 |
| 4 | `/teams` 직접 접속 | 팀 목록 접근 가능 |
| 5 | 로그아웃 후 `/teams` 직접 접속 | `/login`으로 이동 |

확인 포인트:

- 로그인 실패 시 적절한 오류 메시지가 표시되어야 한다.
- 비로그인 상태에서 보호 라우트에 접근할 수 없어야 한다.

## 5. 팀 시나리오

### TEAM-01. 공개 팀 생성과 즉시 가입

목적:

- 비밀번호 없는 팀 생성과 공개 팀 즉시 가입을 확인한다.

사전 조건:

- User A 로그인 상태

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | `/teams` 접속 | 전체 팀 목록 표시 |
| 2 | 팀 생성 버튼 클릭 | 팀 생성 폼 표시 |
| 3 | 팀명 `Scrum Test Public`, 설명 입력, 비밀번호 공백으로 생성 | 팀 생성 성공 |
| 4 | 생성된 팀 대시보드로 이동 | User A가 LEADER로 표시 |
| 5 | 로그아웃 후 User B 로그인 | 팀 목록 접근 |
| 6 | `Scrum Test Public` 가입 클릭 | 비밀번호 없이 즉시 가입 |
| 7 | 팀 대시보드 진입 | User B가 MEMBER로 가입됨 |

확인 포인트:

- 팀 생성자는 반드시 팀장이 되어야 한다.
- 공개 팀은 비밀번호 입력 없이 가입되어야 한다.
- 이미 가입한 팀은 중복 가입할 수 없어야 한다.

### TEAM-02. 비밀번호 팀 생성과 가입 검증

목적:

- 비밀번호 팀 가입 정책을 확인한다.

사전 조건:

- User A 로그인 상태

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | `/teams`에서 팀 생성 | 생성 폼 표시 |
| 2 | 팀명 `Scrum Test Private`, 비밀번호 `team1234`로 생성 | 비밀번호 팀 생성 |
| 3 | 로그아웃 후 User C 로그인 | 팀 목록 표시 |
| 4 | `Scrum Test Private` 가입 시도 | 비밀번호 입력 UI 표시 |
| 5 | 빈 값 또는 틀린 비밀번호 입력 | 가입 실패 메시지 표시 |
| 6 | `team1234` 입력 | 가입 성공, 대시보드 이동 |

확인 포인트:

- 팀 목록에는 비밀번호 원문이 보이면 안 된다.
- `hasPassword` 성격의 표시만 보여야 한다.

### TEAM-03. 초대코드 가입과 재발급

목적:

- 팀 초대코드 가입과 팀장 전용 재발급 정책을 확인한다.

사전 조건:

- User A가 `Scrum Test Private` 팀장
- User B는 아직 `Scrum Test Private` 팀원이 아님
- User C가 `Scrum Test Private` 팀원

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User A로 `Scrum Test Private` 팀 설정 화면 접속 | 초대코드가 표시됨 |
| 2 | 표시된 초대코드를 복사 | 코드 원문 확인 가능 |
| 3 | User B로 로그인 후 팀 목록 화면에서 초대코드 입력 | 비밀번호 입력 없이 가입 성공 |
| 4 | User C로 로그인 후 팀 설정 화면 접속 | 초대코드 재발급 버튼이 없거나 비활성화 |
| 5 | User C가 API로 `PATCH /api/teams/{teamId}/invite-code` 직접 호출 | `LEADER_ONLY` 오류 |
| 6 | User A가 초대코드 재발급 | 새 초대코드 표시 |
| 7 | User X가 이전 초대코드로 가입 시도 | `INVALID_INVITE_CODE` 오류 |
| 8 | User X가 새 초대코드로 가입 시도 | 가입 성공 |

확인 포인트:

- 초대코드 가입은 공개 팀과 비밀번호 팀 모두에서 동작해야 한다.
- 초대코드 입력값의 대소문자, 공백, 하이픈은 허용되어야 한다.
- 초대코드 재발급은 팀장만 가능해야 한다.
- 기존 초대코드는 재발급 직후 사용할 수 없어야 한다.

### TEAM-04. 팀 설정 변경

목적:

- 팀장만 팀명/설명/비밀번호를 수정할 수 있는지 확인한다.

사전 조건:

- User A가 `Scrum Test Public` 팀장
- User B가 같은 팀 팀원

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User B로 팀 설정 화면 접근 | 설정 수정 버튼이 없거나 저장 실패 |
| 2 | User A로 로그인 | 팀 설정 화면 접근 |
| 3 | 팀 설명 수정 후 저장 | 저장 성공, 상세/대시보드에 반영 |
| 4 | 팀 비밀번호 설정 | 공개 팀이 비밀번호 팀으로 변경 |
| 5 | 팀 비밀번호 제거 | 다시 공개 팀으로 변경 |

확인 포인트:

- 팀 이름 중복 수정은 실패해야 한다.
- 팀장 외 사용자가 설정을 바꿀 수 없어야 한다.

## 6. 팀원 관리 시나리오

### MEMBER-01. 팀원 목록과 역할 표시

목적:

- 팀원 목록에서 LEADER/MEMBER가 올바르게 표시되는지 확인한다.

사전 조건:

- `Scrum Test Public`에 User A, User B, User C가 가입되어 있음

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User A로 팀원 관리 화면 접속 | 팀원 목록 표시 |
| 2 | User A 행 확인 | role이 LEADER |
| 3 | User B, User C 행 확인 | role이 MEMBER |

확인 포인트:

- 팀원 목록은 같은 팀의 팀원만 볼 수 있어야 한다.
- 팀장이 아닌 사용자는 팀장 변경/팀원 제거 액션이 제한되어야 한다.

### MEMBER-02. 팀장 변경

목적:

- 팀장이 정확히 1명만 유지되는지 확인한다.

사전 조건:

- User A가 팀장
- User B가 팀원

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User A로 팀원 관리 접속 | 팀장 변경 버튼 표시 |
| 2 | User B에게 팀장 위임 | User B가 LEADER가 됨 |
| 3 | 목록 새로고침 | User A는 MEMBER, User B는 LEADER |
| 4 | User A로 팀 설정 수정 시도 | 팀장 권한 없음 |
| 5 | User B로 팀 설정 수정 시도 | 수정 가능 |

확인 포인트:

- 동시에 두 명의 LEADER가 있으면 실패다.
- 기존 팀장은 반드시 MEMBER로 내려가야 한다.

### MEMBER-03. 팀원 제거 제약

목적:

- 팀원 제거 정책과 task 담당자 무결성을 확인한다.

사전 조건:

- User B가 팀장
- User A, User C가 팀원

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User B가 본인 제거 시도 | 제거 불가 |
| 2 | User B가 User A를 담당자로 하는 task 생성 | task 생성 성공 |
| 3 | 해당 task 담당자가 User A 1명인지 확인 | 유일 담당자 상태 |
| 4 | User B가 User A 제거 시도 | `task 재배정 필요` 성격의 오류 표시 |
| 5 | task 담당자에 User C 추가 또는 User A 제거 | task 수정 성공 |
| 6 | 다시 User A 제거 시도 | 제거 성공 |

확인 포인트:

- 유일 담당자인 팀원은 제거되면 안 된다.
- 제거된 사용자가 공동 작업자였던 회고록에서는 공동 작업자 권한이 제거되어야 한다.
- 제거된 사용자가 작성한 task/comment/retrospective 자체는 유지되어야 한다.

## 7. Task 시나리오

### TASK-01. task 생성

목적:

- task 필수값과 담당자 1명 이상 정책을 확인한다.

사전 조건:

- 팀에 User B, User C가 가입되어 있음

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | task 목록 화면 접속 | 미완료/완료 보드 표시 |
| 2 | task 생성 버튼 클릭 | 생성 폼 표시 |
| 3 | 제목 없이 저장 | 오류 메시지 표시 |
| 4 | 담당자 없이 저장 | 오류 메시지 표시 |
| 5 | 제목 `로그인 화면 구현`, 중요도 HIGH, 마감일, 담당자 User B 선택 후 저장 | task 생성 성공 |
| 6 | 목록 확인 | 미완료 컬럼에 task 표시 |

확인 포인트:

- priority는 LOW/MEDIUM/HIGH 중 하나여야 한다.
- dueDate가 비어 있으면 저장되면 안 된다.
- 담당자 목록에는 팀원만 보여야 한다.

### TASK-02. task 완료/미완료 변경

목적:

- task 상태가 완료/미완료 두 값으로만 변경되는지 확인한다.

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | 미완료 task의 완료 버튼 클릭 | 완료 컬럼으로 이동 |
| 2 | 완료 task의 미완료 변경 버튼 클릭 | 미완료 컬럼으로 이동 |
| 3 | 대시보드 이동 | completed/incomplete 집계 반영 |

확인 포인트:

- 완료 상태 변경 후 새로고침해도 상태가 유지되어야 한다.
- 팀원 모두 완료 상태를 바꿀 수 있어야 한다.

### TASK-03. task 상세 수정과 삭제

목적:

- task 상세에서 필드와 담당자 목록을 수정하고 삭제할 수 있는지 확인한다.

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | task 상세 진입 | 제목, 설명, 중요도, 마감일, 담당자 표시 |
| 2 | 제목/설명/중요도/마감일 수정 | 저장 성공 |
| 3 | 담당자를 User B, User C로 변경 | 저장 성공 |
| 4 | 목록으로 돌아와 확인 | 수정 내용 반영 |
| 5 | 상세에서 삭제 클릭 | 삭제 확인 후 목록으로 이동 |
| 6 | 목록 확인 | 삭제된 task가 보이지 않음 |

확인 포인트:

- task 삭제 시 댓글과 담당자 연결도 함께 삭제되어야 한다.
- 삭제 후 상세 URL에 직접 접근하면 찾을 수 없어야 한다.

## 8. 댓글 시나리오

### COMMENT-01. 댓글 작성/수정/삭제

목적:

- task 댓글 기능과 작성자 권한을 확인한다.

사전 조건:

- User B가 task 상세에 접근 가능

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User B로 task 상세 접속 | 댓글 영역 표시 |
| 2 | 빈 댓글 작성 시도 | 오류 메시지 표시 |
| 3 | 댓글 `API 연결 확인했습니다.` 작성 | 댓글 목록에 표시 |
| 4 | 댓글 수정 | 수정 내용 반영 |
| 5 | 로그아웃 후 User C로 같은 task 상세 접속 | User B 댓글은 보이나 수정/삭제 버튼 없음 |
| 6 | User B로 다시 로그인 후 댓글 삭제 | 댓글 목록에서 제거 |

확인 포인트:

- 댓글 수정/삭제는 작성자만 가능해야 한다.
- 팀장도 다른 사용자의 댓글을 수정/삭제할 수 없어야 한다.
- 댓글 작성 후 task의 commentCount가 증가해야 한다.

## 9. 회의록 시나리오

### MEETING-01. 회의록 작성과 조회

목적:

- 회의 탭에서 회의록을 여러 개 작성하고 조회할 수 있는지 확인한다.

사전 조건:

- 팀에 User A, User B가 가입되어 있음
- User A 로그인 상태

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | 회의 화면 접속 | 회의록 목록 또는 빈 상태 표시 |
| 2 | 회의록 작성 버튼 클릭 | 작성 폼 표시 |
| 3 | 제목 없이 저장 | 오류 메시지 표시 |
| 4 | 제목, 회의 일시, 회의 원문, 요약 입력 후 저장 | 회의록 생성 성공 |
| 5 | 목록 확인 | 회의록 카드 표시 |
| 6 | User B로 로그인 후 같은 회의록 상세 접속 | 회의록 내용 조회 가능 |

확인 포인트:

- 팀원은 회의록 목록과 상세를 조회할 수 있어야 한다.
- 팀 외부 사용자는 회의록 목록과 상세를 조회할 수 없어야 한다.

### MEETING-02. 회의록 수정/삭제 권한

목적:

- 회의록 작성자 또는 팀장만 회의록을 수정/삭제할 수 있는지 확인한다.

사전 조건:

- User A가 팀장 및 회의록 작성자
- User B가 같은 팀 팀원

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User B로 회의록 상세 접속 | 내용 조회 가능, 수정 입력 비활성화 |
| 2 | User B가 API로 회의록 수정 시도 | `MEETING_AUTHOR_OR_LEADER_ONLY` 오류 |
| 3 | User A로 회의록 상세 접속 | 수정/삭제 가능 |
| 4 | 회의 원문과 요약 수정 후 저장 | 저장 성공 |
| 5 | 삭제 버튼 클릭 후 확인 | 회의록 삭제 성공, 목록으로 이동 |

확인 포인트:

- 작성자가 아니어도 팀장이면 수정/삭제할 수 있다.
- 삭제 후 상세 URL 직접 접근 시 `MEETING_NOT_FOUND`가 반환되어야 한다.

## 10. 회고록 시나리오

### RETRO-01. 회고록 생성

목적:

- 회고록 일지 항목과 공동 작업자 선택이 동작하는지 확인한다.

사전 조건:

- 팀에 User B, User C가 가입되어 있음
- User B 로그인 상태

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | 회고록 목록 화면 접속 | 회고록 목록 또는 빈 상태 표시 |
| 2 | 회고록 작성 버튼 클릭 | 작성 폼 표시 |
| 3 | 제목 없이 저장 | 오류 메시지 표시 |
| 4 | 제목 `Day 1 회고` 입력 | 저장 가능 |
| 5 | 어제 한 일, 오늘 할 일, 궁금한/필요한/알아낸 것 입력 | 입력 가능 |
| 6 | 공동 작업자로 User C 선택 후 저장 | 회고록 생성 성공 |
| 7 | 목록 확인 | 회고록 카드 표시, 작성자 User B, 공동 작업자 1명 표시 |

확인 포인트:

- 작성자는 공동 작업자 선택 목록에서 제외되어야 한다.
- 공동 작업자는 0명이어도 생성 가능해야 한다.

### RETRO-02. 작성자와 공동 작업자 수정 권한

목적:

- 작성자와 공동 작업자의 회고록 본문 수정 권한과 공동 작업자 목록 변경 제한을 확인한다.

사전 조건:

- User B가 회고록 작성자
- User C가 공동 작업자

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User B로 회고록 상세 접속 | 수정 가능 |
| 2 | `오늘 할 일` 내용 수정 후 저장 | 저장 성공 |
| 3 | User B가 공동 작업자 목록에서 User C를 제외 후 저장 | 저장 성공 |
| 4 | User B가 다시 User C를 공동 작업자로 추가 후 저장 | 저장 성공 |
| 5 | 로그아웃 후 User C로 로그인 | 같은 회고록 상세 접속 |
| 6 | `궁금한/필요한/알아낸 것` 수정 후 저장 | 저장 성공 |
| 7 | User C가 공동 작업자 목록 변경 후 저장 시도 | 저장 실패, 작성자만 가능 오류 표시 |

확인 포인트:

- 공동 작업자는 본문을 수정할 수 있다.
- 공동 작업자는 공동 작업자 목록을 변경할 수 없다.
- 공동 작업자 목록 변경은 작성자만 가능해야 한다.

### RETRO-03. 권한 없는 팀원의 회고록 제한

목적:

- 같은 팀원이지만 작성자/공동 작업자가 아닌 사용자의 수정/삭제 제한을 확인한다.

사전 조건:

- User B가 회고록 작성자
- User C는 공동 작업자가 아님

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | User C로 회고록 목록 접속 | 회고록 목록 조회 가능 |
| 2 | 회고록 상세 접속 | 내용 조회 가능 |
| 3 | 수정 버튼 또는 저장 버튼 확인 | 보이지 않거나 비활성화 |
| 4 | 삭제 버튼 확인 | 보이지 않음 |

확인 포인트:

- 팀원은 회고록을 조회할 수 있다.
- 작성자/공동 작업자가 아니면 수정/삭제할 수 없다.

### RETRO-04. 회고록 삭제

목적:

- 작성자 또는 공동 작업자가 회고록을 삭제할 수 있는지 확인한다.

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | 삭제 테스트용 회고록 생성 | 생성 성공 |
| 2 | 작성자 또는 공동 작업자로 상세 접속 | 삭제 버튼 표시 |
| 3 | 삭제 클릭 후 확인 | 목록으로 이동 |
| 4 | 목록 확인 | 삭제된 회고록이 보이지 않음 |

확인 포인트:

- 삭제 시 공동 작업자 연결도 함께 삭제되어야 한다.
- 삭제된 상세 URL 직접 접근 시 찾을 수 없어야 한다.

## 11. 대시보드 시나리오

### DASH-01. 팀 대시보드 집계

목적:

- 팀 대시보드의 member/task/retrospective 집계가 실제 데이터와 일치하는지 확인한다.

사전 조건:

- 팀원 2명 이상
- task 여러 개
- 회고록 여러 개

절차:

| 단계 | 행동 | 기대 결과 |
|---:|---|---|
| 1 | task 3개 생성 | totalCount 3 증가 |
| 2 | task 1개 완료 처리 | completedCount 1, incompleteCount 2 |
| 3 | 과거 마감일 미완료 task 생성 | overdueCount 증가 |
| 4 | 2일 이내 마감 미완료 task 생성 | dueSoonCount 증가 |
| 5 | 회고록 2개 생성 | retrospective totalCount 2 증가 |
| 6 | 내가 작성한 회고록 확인 | myCount 반영 |
| 7 | 내가 공동 작업자인 회고록 확인 | collaboratingCount 반영 |

확인 포인트:

- 새로고침 후에도 집계가 유지되어야 한다.
- 사용자별 `myCount`, `collaboratingCount`는 로그인 계정에 따라 달라져야 한다.

## 12. API 보조 검증

브라우저 UI에서 만들기 어려운 오류 케이스는 API로 보조 검증한다.

권장 방식:

- 브라우저 개발자 도구 Network 탭에서 JWT를 확인한다.
- 아래 예시는 PowerShell에서 실행한다.
- 실제 `TEAM_ID`, `TASK_ID`, `RETROSPECTIVE_ID`, `USER_ID`, `TOKEN`은 테스트 환경 값으로 바꾼다.

### API-01. 팀원이 아닌 사용자를 task 담당자로 지정

```powershell
$token = "TOKEN"
$body = @{
  title = "잘못된 담당자 테스트"
  description = "팀원이 아닌 사용자를 담당자로 지정"
  priority = "MEDIUM"
  dueDate = "2026-07-05"
  assigneeUserIds = @(9999)
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/teams/TEAM_ID/tasks" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

기대 결과:

- `ASSIGNEE_NOT_TEAM_MEMBER` 오류

### API-02. 작성자를 회고록 공동 작업자에 포함

```powershell
$token = "TOKEN"
$body = @{
  title = "작성자 공동 작업자 중복 테스트"
  yesterdayWork = "test"
  todayPlan = "test"
  note = "test"
  collaboratorUserIds = @(AUTHOR_USER_ID)
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/teams/TEAM_ID/retrospectives" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

기대 결과:

- `AUTHOR_CANNOT_BE_COLLABORATOR` 오류

### API-03. 권한 없는 사용자가 회고록 수정

```powershell
$token = "UNAUTHORIZED_MEMBER_TOKEN"
$body = @{
  title = "권한 없는 수정"
  yesterdayWork = "no"
  todayPlan = "no"
  note = "no"
  collaboratorUserIds = @()
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:8080/api/retrospectives/RETROSPECTIVE_ID" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

기대 결과:

- `RETROSPECTIVE_EDITOR_ONLY` 오류

### API-04. 공동 작업자가 공동 작업자 목록 변경 시도

```powershell
$token = "COLLABORATOR_TOKEN"
$body = @{
  title = "공동 작업자 목록 변경 시도"
  yesterdayWork = "본문 수정은 허용"
  todayPlan = "본문 수정은 허용"
  note = "공동 작업자 목록 변경은 차단"
  collaboratorUserIds = @()
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:8080/api/retrospectives/RETROSPECTIVE_ID" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

기대 결과:

- `RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS` 오류

### API-05. 팀 외부 사용자가 teamId 직접 접근

```powershell
$token = "OUTSIDER_TOKEN"

Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:8080/api/teams/TEAM_ID" `
  -Headers @{ Authorization = "Bearer $token" }
```

기대 결과:

- `NOT_TEAM_MEMBER` 오류

### API-06. 잘못된 초대코드 가입

```powershell
$token = "TOKEN"
$body = @{
  inviteCode = "WRONG-CODE"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/teams/join-by-invite" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

기대 결과:

- `INVALID_INVITE_CODE` 오류

## 13. 최종 데모 시나리오

발표 또는 제출 전에는 아래 흐름을 한 번에 완주한다.

| 순서 | 사용자 | 행동 | 기대 결과 |
|---:|---|---|---|
| 1 | User A | 회원가입/로그인 | 로그인 성공 |
| 2 | User A | 팀 생성 | User A가 팀장 |
| 3 | User B | 회원가입 후 팀 가입 | User B가 팀원 |
| 4 | User A | task 생성, User B 담당자 지정 | task 생성 |
| 5 | User B | task 완료 처리 | 완료 상태 반영 |
| 6 | User B | task 댓글 작성 | 댓글 표시 |
| 7 | User A | 회고록 생성, User B 공동 작업자 지정 | 회고록 생성 |
| 8 | User B | 회고록 수정 | 수정 성공 |
| 9 | User A | User B에게 팀장 위임 | 팀장 변경 |
| 10 | User B | 팀 설정 수정 | 새 팀장 권한 확인 |
| 11 | User B | 대시보드 확인 | 멤버/task/회고록 집계 표시 |

이 흐름이 막힘 없이 진행되면 MVP 핵심 기능은 통과로 본다.

## 14. 발견 이슈 기록 양식

테스트 중 문제가 생기면 아래 형식으로 기록한다.

```text
ID:
발견 일시:
테스트 계정:
화면/URL:
재현 절차:
기대 결과:
실제 결과:
브라우저 콘솔 오류:
Network 응답:
우선순위: P0 / P1 / P2 / P3
메모:
```

우선순위 기준:

| 우선순위 | 기준 |
|---|---|
| P0 | 앱 실행 불가, 로그인 불가, 데이터 손상 |
| P1 | 핵심 기능 사용 불가, 권한 우회 |
| P2 | 특정 조건에서 기능 실패, 우회 가능 |
| P3 | 문구, 스타일, 사용성 개선 |
