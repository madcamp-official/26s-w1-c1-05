# Notion Page Draft

이 문서는 `2026S 산출물` Notion 페이지에 붙여넣기 위한 초안이다. 실제 Notion 데이터베이스의 속성명에 맞춰 값을 입력한다.

## 1. Notion 속성 입력 초안

| 속성 | 값 |
|---|---|
| 프로젝트명 | Scrum Helper |
| 팀명 | Team 5 |
| 팀원 | 안종화, 김희서 |
| 주차 | 1주차 |
| 과제 | 공통과제 I: 웹 기반 프로젝트 |
| GitHub | https://github.com/madcamp-official/26s-w1-c1-05 |
| 배포 링크 | https://anjonghwa.madcamp-kaist.org |
| 기술 스택 | React, TypeScript, Vite, Java 17, Spring Boot, Spring Data JPA, MySQL, JWT, Gemini API, KCloud |
| 한 줄 소개 | 회의에서 나온 내용을 Spec, Task, Todo, 회고까지 연결하는 웹 기반 스크럼 관리 서비스 |
| 추가 링크 | README, 발표 스크립트, 테스트 결과 문서 |

`추가 링크`를 제외한 모든 필수 속성을 Notion에서 반드시 채운다.

## 2. 본문 초안

## Scrum Helper

Scrum Helper는 소규모 팀 프로젝트를 위한 웹 기반 스크럼 관리 서비스입니다.

회의에서 나온 아이디어를 회의록으로 남기고, 그 회의록을 바탕으로 Spec 문서를 만들고, Spec에서 Task를 구체화한 뒤, 개인 Todo와 회고까지 이어지도록 설계했습니다.

## 개발 동기

팀 프로젝트를 하다 보면 회의록, 스펙 문서, 실제 할 일, 개인 Todo, 회고가 서로 다른 공간에 흩어지는 경우가 많습니다.

Scrum Helper는 이 흐름을 하나로 묶어, 회의에서 나온 내용이 실제 구현 Task와 회고까지 이어지도록 돕는 것을 목표로 했습니다.

## 핵심 흐름

```text
Meeting -> Spec Document -> Task -> Personal Todo -> Completion -> Dashboard -> Retrospective
```

## 주요 기능

- 이메일/비밀번호 기반 회원가입 및 JWT 로그인
- 공개 팀, 비밀번호 팀, 초대코드 기반 팀 가입
- 팀장 변경, 팀원 관리, 팀 설정
- 회의록 작성, 녹음 파일 script 변환, 회의 요약 생성
- 회의록 기반 Spec 문서 초안 생성
- Spec 기반 Task 추천 및 담당자 지정
- Task Kanban 보드, 댓글, 상태 변경
- 개인 Todo와 Todo 실행 프롬프트 생성
- 완료 Task 기반 리더보드와 명성 레벨
- 성장 나무와 프로젝트 Wrap-up
- KPT형 회고록과 공동 작업자 권한 관리

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA |
| Database | MySQL |
| Auth | JWT, BCrypt |
| AI | Gemini API, local fallback |
| Deploy | KCloud VM, madcamp-kaist.org subdomain |

## 시연 흐름

### 1. 새 팀 시작

회원가입 후 새 팀을 생성하고, 회의록을 작성합니다. 회의록에서 Spec 초안을 만들고, Spec 기반 Task를 생성한 뒤 개인 Todo에 추가합니다.

### 2. 진행 중인 팀 협업

Team B에서 Todo, Task 보드, 댓글, 담당자 변경, 리더보드를 보여줍니다. 진행 중인 프로젝트에서 업무가 어떻게 분배되고 조정되는지 확인합니다.

### 3. 완료된 팀 마무리

Team A에서 100% 완료된 대시보드, Wrap-up, 회고록을 보여줍니다. 프로젝트가 끝난 뒤 성과와 배움을 어떻게 정리하는지 확인합니다.

## 구현하면서 고민한 점

- AI API가 실패해도 서비스 흐름이 끊기지 않도록 local fallback을 구현했습니다.
- 회고록 공동 작업자는 본문 수정은 가능하지만, 공동 작업자 목록 변경은 작성자만 가능하도록 권한을 분리했습니다.
- 팀장은 항상 한 명만 존재하도록 DB 제약과 service transaction을 함께 고려했습니다.
- 발표 시 항상 동일한 상태로 시작할 수 있도록 baseline demo data를 구성했습니다.

## 역할 분담

| 팀원 | 역할 |
|---|---|
| 안종화 | Backend API, DB, 인증/권한, Gemini API, 배포, 테스트 데이터 |
| 김희서 | Frontend UI/UX, 화면 구현, 사용자 흐름, 디자인 정리 |

## 링크

- 서비스: https://anjonghwa.madcamp-kaist.org
- GitHub: https://github.com/madcamp-official/26s-w1-c1-05
- 발표 스크립트: `docs/DEMO_PRESENTATION_SCRIPT.md`
- 테스트 결과: `docs/TEST_RESULTS.md`
