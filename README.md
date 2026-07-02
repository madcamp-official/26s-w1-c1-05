# 26s-w1-c1-05

## 공통과제 I : 웹 기반 프로젝트 (2인 1팀)

**목적:** 공통 과제를 함께 수행하며 웹 개발의 전체 흐름을 빠르게 익히고 협업에 적응하기

**결과물:** 기획부터 배포까지 완료된 웹 서비스와 관련 문서 일체

---

## 산출물 문서

- [ScrumMate 스펙 문서](docs/SPEC.md)
- [DB 스키마 문서](docs/DB_SCHEMA.md)
- [API 문서](docs/API.md)

---

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
|  |  |  |
|  |  |  |

---

## 기획안

- **주제:** 소규모 팀을 위한 웹 기반 스크럼 진행 도구 ScrumMate
- **목적:** 팀 생성, 할 일 관리, 담당자 지정, 진행 상태 변경, 마감일 관리, KPT 회고를 하나의 로컬 웹앱에서 수행한다.
- **핵심 기능:** 회원가입/로그인, 팀 생성, 초대 코드 가입, 팀원 역할/직책/파트 관리, 태스크 CRUD, 담당자 지정, 상태 변경, 마감 표시, 댓글, KPT 회고
- **예상 사용자:** 2인 공통과제 팀, 소규모 개발 스터디, 단기 해커톤 팀

---

## 기능 명세서

> 구현할 기능을 사용자 관점에서 정리하고, 필수 기능과 선택 기능을 구분

### 필수 기능

- [x] 이메일/비밀번호 기반 회원가입 및 로그인
- [x] 팀 생성과 초대 코드 기반 팀 가입
- [x] 팀장/팀원 권한 관리와 팀별 직책/파트 관리
- [x] 태스크 생성, 조회, 수정, 삭제
- [x] 태스크 담당자 복수 지정
- [x] TODO, IN_PROGRESS, BLOCKED, DONE 상태 변경
- [x] 마감 임박/초과 표시
- [x] 태스크 댓글
- [x] KPT 회고 작성, 수정, 삭제

### 선택 기능

- [x] 대시보드 요약
- [x] 팀장 권한 위임
- [ ] 드래그 앤 드롭 상태 변경
- [ ] KCloud VM 배포

---

## IA 및 화면 설계서

자세한 화면 구조와 사용자 흐름은 [ScrumMate 스펙 문서](docs/SPEC.md)의 IA 및 화면 설계 섹션을 따른다.

- 인증 화면: 회원가입/로그인
- 팀 사이드바: 내 팀 목록, 팀 생성, 초대 코드 가입
- 대시보드: 전체 작업 수, 완료율, Blocked, 마감 임박 요약
- 스크럼 보드: 상태 컬럼, 태스크 생성, 상태 변경, 상세 수정, 댓글
- 팀원 화면: 팀원 목록, 역할/직책/파트 변경, 초대 코드 재발급
- KPT 회고: 회고 생성, Keep/Problem/Try 항목 관리

---

## DB 스키마

상세 테이블, PK/FK/NN, Prisma 스키마, ERD는 [DB 스키마 문서](docs/DB_SCHEMA.md)를 따른다.

---

## API 문서

상세 엔드포인트, 요청값, 응답값, 에러 코드는 [API 문서](docs/API.md)를 따른다.

---

## 배포 결과물

- **로컬 URL:** http://127.0.0.1:5173
- **API URL:** http://localhost:3001/api
- **GitHub 저장소:** https://github.com/madcamp-official/26s-w1-c1-05
- **주요 구현 내용:** React/Vite 프론트엔드, Express/TypeScript API 서버, Prisma/SQLite 로컬 DB, JWT 인증

```powershell
npm install
Copy-Item server\.env.example server\.env
npm run db:migrate
npm run dev
```

빌드 확인:

```powershell
npm run build
```

---

## 회고 문서

> 개발 과정에서의 어려움, 해결 방법, 역할 분담, 다음에 개선할 점 (KPT 방법론 참고)

### Keep

### Problem

### Try

---

## 참고 자료

- [SDD(스펙 주도 개발) 이해하기](https://news.hada.io/topic?id=21338)
- [Software Design Document Best Practices](https://www.atlassian.com/work-management/project-management/design-document)
- [IA 정보구조도 작성 방법](https://brunch.co.kr/@nyonyo/7)
- [기획자 화면설계서 작성법](https://brunch.co.kr/@soup/10)
- [Figma 와이어프레임 가이드](https://www.figma.com/ko-kr/resource-library/what-is-wireframing/)
- [무료 Figma 와이어프레임 키트](https://www.figma.com/ko-kr/templates/wireframe-kits/)
- [ERD/DB 설계 총정리](https://inpa.tistory.com/entry/DB-%F0%9F%93%9A-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%AA%A8%EB%8D%B8%EB%A7%81-%EA%B0%9C%EB%85%90-ERD-%EB%8B%A4%EC%9D%B4%EC%96%B4%EA%B7%B8%EB%9E%A8)
- [API 명세서 작성 가이드라인](https://velog.io/@sebinChu/BackEnd-API-%EB%AA%85%EC%84%B8%EC%84%9C-%EC%9E%91%EC%84%B1-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%9D%BC%EC%9D%B8)
- [좋은 README 작성하는 방법](https://velog.io/@sabo/good-readme)
- [단기 프로젝트 회고 KPT 방법론](https://velog.io/@habwa/%EB%8B%A8%EA%B8%B0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-KPT-%EB%B0%A9%EB%B2%95%EB%A1%A0)
