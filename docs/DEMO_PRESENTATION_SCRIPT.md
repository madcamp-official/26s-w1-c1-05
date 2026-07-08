# Scrum Helper Demo Presentation Script

## 1. Demo Goal

Scrum Helper is a web-based scrum management service that connects a small team's collaboration flow:

Meeting -> Meeting notes -> Spec document -> Task -> Personal Todo -> Completion -> Dashboard -> Retrospective

The demo should not list features one by one. It should show how a team starts a project, manages active collaboration, and reviews a completed project.

## 2. Pre-Demo Baseline

Reset DB to the fixed baseline before the official demo.

Baseline accounts use password `password`.

| Person | Email | Demo Role |
|---|---|---|
| 김희서 | `heeseo.team5.20260708113041@example.com` | Team A/B leader |
| 안종화 | `anjonghwa.team5.20260708113041@example.com` | Backend/API/infra |
| 클로드 | `claude.team5.20260708113041@example.com` | Team A frontend/UI |
| 코덱스 | `codex.team5.20260708113041@example.com` | Team A AI/test, joins Team B during demo |
| 제미나이 | `gemini.team5.20260708113041@example.com` | Team B AI/docs |
| 이광형 | `kwanghyung.team5.20260708113041@example.com` | Team B overloaded worker, joins Team A during demo |

Baseline teams:

| Team | Access | Purpose |
|---|---|---|
| Team A — Scrum Helper Release | invite code `5QZ2B4T6` | completed project, Phase 3 |
| Team B — Scrum Helper Sprint 2 | password `team1234` | in-progress project, Phase 2 |

## 3. Validation Results

I verified the flow on `https://anjonghwa.madcamp-kaist.org`.

Baseline API state before demo mutations:

| Check | Result |
|---|---|
| Team A tasks | 34 total, 34 DONE, 0 active |
| Team A dashboard | completed 34, incomplete 0 |
| Team B tasks | 30 total, 15 DONE, 8 IN_PROGRESS, 7 BACKLOG |
| Team B Todo for 이광형 | exactly 3 tasks |
| Team B Todo titles | API 오류 응답 정리 / 팀 상세 화면 상태 정리 / Meeting 요약 결과 검증 |

Direct demo-flow checks:

| Phase | Verified |
|---|---|
| Phase 1 | signup, new team, audio transcription endpoint, Meeting, Spec, Main Spec, Task, Todo, prompt, DONE, Todo auto-removal |
| Phase 2 | Team B password join, dashboard, Todo, leaderboard, new Meeting, new Spec, new Task, comment, assignee change, status move |
| Phase 3 | Team A invite join, completed dashboard, Wrap-up, retrospectives, leaderboard |

Browser checks:

| Page | Result |
|---|---|
| Login | loaded and login succeeded |
| Team list | Team A and Team B visible |
| Team B Todo | Todo list and Generate prompt visible |
| Team B Generate prompt | generated prompt area appeared |
| Team A Wrap-up | completed project report appeared |

Note: During the test, I intentionally mutated DB state. Run the DB reset before an actual presentation to return to the baseline.

## 4. Presentation Script

### Opening

안녕하세요. 저희 Team 5는 소규모 팀 프로젝트를 위한 스크럼 관리 서비스, Scrum Helper를 만들었습니다.

Scrum Helper의 핵심 목표는 회의에서 나온 내용을 흩어지지 않게 관리하는 것입니다.

보통 팀 프로젝트에서는 회의록은 따로 있고, 스펙 문서는 따로 있고, 실제 할 일은 메신저나 개인 메모에 흩어지는 경우가 많습니다. Scrum Helper는 이 흐름을 하나로 연결합니다.

회의를 기록하고, 그 회의 내용을 바탕으로 Spec을 만들고, Spec에서 Task를 구체화한 뒤, 개인 Todo와 회고까지 이어지게 하는 서비스입니다.

오늘 시연은 세 단계로 보여드리겠습니다.

첫 번째는 아무것도 없는 팀에서 프로젝트를 시작하는 흐름입니다.

두 번째는 실제 작업이 진행 중인 팀에서 업무가 쌓이고 분배되는 흐름입니다.

세 번째는 프로젝트가 끝난 팀에서 성과와 회고를 확인하는 흐름입니다.

### Phase 1. Cold Start

먼저 새 계정을 만들어보겠습니다.

Scrum Helper는 이메일과 비밀번호만으로 간단히 가입할 수 있고, 로그인 후에는 JWT 기반으로 인증 상태가 유지됩니다.

이제 새 팀을 만들겠습니다. 이 팀은 아직 회의록도 없고, Task도 없고, 회고도 없는 완전히 빈 팀입니다.

여기서 Scrum Helper의 첫 번째 흐름을 보여드리겠습니다.

팀 프로젝트가 시작되면 보통 첫 회의에서 서비스 목표와 구현 범위를 이야기합니다. Scrum Helper에서는 이 회의 내용을 Meeting으로 기록합니다.

회의 내용을 직접 입력할 수도 있고, 음성 파일을 업로드해서 Transcript로 변환할 수도 있습니다.

이제 회의록을 저장하고, 이 회의록을 바탕으로 Spec 초안을 생성하겠습니다.

회의록은 결정 사항을 남기는 데 좋지만, 실제 구현 기준으로 쓰려면 조금 더 구조화된 문서가 필요합니다.

Scrum Helper에서는 선택한 Meeting을 기반으로 Spec 초안을 만들고, 팀이 구현해야 할 범위를 정리할 수 있습니다.

이 Spec을 Main Spec으로 지정하면, 팀의 현재 기준 문서가 됩니다.

다음으로 이 Spec을 바탕으로 실제 Task를 만듭니다.

Task는 팀 전체의 작업 단위이고, 담당자와 중요도를 함께 가집니다.

이제 이 Task를 개인 Todo에 추가하겠습니다.

팀 전체 Task와 개인이 오늘 집중할 Todo는 다릅니다. Scrum Helper는 담당 Task 중 오늘 집중할 항목만 Todo로 가져올 수 있게 합니다.

Todo에 들어간 Task는 자동으로 In Progress 상태가 됩니다.

그리고 Generate prompt를 누르면, 선택한 Todo를 바로 실행할 수 있도록 작업 목적, 완료 기준, 실행 단계, 확인 질문을 정리해줍니다.

현재 환경에서 Gemini 응답이 가능하면 Gemini 결과를 보여주고, 실패하거나 설정이 없으면 local fallback으로 흐름이 끊기지 않게 처리합니다.

마지막으로 Task를 완료 처리하겠습니다.

Task가 DONE 상태가 되면 개인 Todo에서도 자동으로 제거됩니다.

이렇게 회의에서 나온 내용이 Meeting, Spec, Task, Todo, 완료 처리까지 이어지는 전체 흐름을 확인할 수 있습니다.

### Phase 2. Active Collaboration

이제 실제로 작업이 진행 중인 팀을 보겠습니다.

Team B는 Scrum Helper Sprint 2를 진행 중인 팀입니다. 이 팀은 비밀번호가 있는 팀입니다.

먼저 코덱스 계정으로 로그인해서 Team B에 비밀번호로 입장해보겠습니다.

프로젝트 성격상 모든 팀을 공개할 수는 없기 때문에, Scrum Helper는 공개 팀뿐 아니라 비밀번호 기반 팀 참여도 지원합니다.

입장이 확인되면, 실제 작업을 많이 맡고 있는 이광형 계정으로 전환하겠습니다.

이광형 계정으로 Team B 대시보드를 보면, 전체 30개 Task 중 15개가 완료되어 약 절반 정도 진행된 상태입니다.

특히 이광형 팀원에게 아직 처리되지 않은 Task가 많이 몰려 있습니다.

이런 상황에서 Scrum Helper는 Todo, 리더보드, 댓글, 담당자 변경을 통해 팀이 업무 분포를 빠르게 파악하고 조정할 수 있게 도와줍니다.

먼저 개인 Todo를 보겠습니다.

이광형 계정에는 지금 3개의 Todo가 들어 있습니다.

API 오류 응답 정리, 팀 상세 화면 상태 정리, Meeting 요약 결과 검증입니다.

여기서 Generate prompt를 누르면 오늘 처리할 Todo를 실행 가능한 작업 브리프로 정리해줍니다.

작업이 많을수록 무엇부터 해야 할지 정리하는 비용이 커지는데, 이 기능은 그 비용을 줄여줍니다.

다음으로 새 요구사항이 생긴 상황을 보여드리겠습니다.

진행 중인 프로젝트에서는 새로운 요구사항이 계속 추가됩니다.

새 Meeting을 작성합니다. 주제는 칸반 보드 상태 이동 UX 개선입니다.

회의 내용은 Task 상태를 더 직관적으로 옮길 수 있게 하고, 상태 변경 이후 Todo와 대시보드가 일관되게 반영되어야 한다는 내용입니다.

이 Meeting을 바탕으로 새 Spec을 만들고, 새 Task를 생성합니다.

Task 제목은 칸반 보드에서 드래그 앤 드롭으로 Task 상태 변경 구현입니다.

처음에는 이광형에게 할당합니다.

Task 상세로 들어가서 댓글을 남기겠습니다.

현재 이광형 팀원에게 작업이 많이 몰려 있으니, UI 구조 확인은 이광형이 먼저 하고 상태 동기화 검증은 안종화와 함께 나누면 좋겠다는 의견을 남깁니다.

이후 담당자를 이광형 단독에서 이광형과 안종화 공동 담당으로 변경합니다.

이렇게 Task 안에서 논의 맥락을 댓글로 남기고, 담당자 변경까지 바로 이어갈 수 있습니다.

마지막으로 이 Task를 In Progress로 이동해 실제 작업이 시작된 상태로 바꿉니다.

이 Phase에서 보여주고 싶은 핵심은 Scrum Helper가 단순한 할 일 목록이 아니라, 진행 중인 팀의 업무 분배와 협업 맥락을 정리하는 도구라는 점입니다.

### Phase 3. Completed Project And Retrospective

마지막으로 완료된 프로젝트인 Team A를 보겠습니다.

Team A는 Scrum Helper Release 팀이고, 모든 Task가 완료된 상태입니다.

먼저 이광형 계정으로 Team A 초대 코드를 입력해 입장합니다.

초대 코드 방식은 필요한 사람에게만 팀 접근 권한을 전달할 수 있는 방식입니다.

이제 Team A 대시보드 또는 Wrap-up 화면으로 이동하겠습니다.

Team A는 34개의 Task가 모두 완료되어 진행률이 100%입니다.

대시보드에서는 완료된 작업 수, 팀원 수, 회고 수를 한눈에 확인할 수 있습니다.

Wrap-up 화면에서는 프로젝트 전체 결과를 더 스토리 형태로 확인할 수 있습니다.

총 34개의 Task, 10개의 Meeting, 16개의 Retro가 기록되어 있고, 팀원별 완료 Task 수와 기여도가 표시됩니다.

이 화면은 프로젝트가 끝난 뒤 팀의 성과를 정리해서 보여주는 역할을 합니다.

하지만 프로젝트가 끝났다고 해서 협업이 끝나는 것은 아닙니다.

Scrum Helper는 팀이 무엇을 만들었는지뿐 아니라, 어떤 어려움이 있었고 무엇을 배웠는지도 회고로 남길 수 있게 합니다.

Retro 화면으로 이동하면 각 팀원이 작성한 회고를 볼 수 있습니다.

회고는 어제 한 일, 오늘 할 일, 궁금한 것, 필요한 것, 알아낸 것으로 나뉘어 있습니다.

또한 공동 작업자를 지정할 수 있어서, 함께 작업한 내용은 공동으로 수정할 수 있습니다.

공동 작업자는 본문은 수정할 수 있지만, 공동 작업자 목록은 작성자만 바꿀 수 있도록 권한을 나누었습니다.

이렇게 Team A에서는 완료된 프로젝트의 진행도, 성과, 회고까지 확인할 수 있습니다.

### Closing

정리하겠습니다.

Scrum Helper는 회의에서 나온 내용을 Spec과 Task로 구체화하고, 개인 Todo로 연결하며, 마지막에는 팀의 경험과 배움을 회고로 남길 수 있게 하는 서비스입니다.

즉, Scrum Helper는 팀 프로젝트의 시작부터 진행, 완료, 회고까지 이어지는 전체 협업 흐름을 관리하는 도구입니다.

저희는 이 서비스를 통해 소규모 팀이 회의와 작업, 회고를 따로 관리하지 않고 하나의 흐름 안에서 프로젝트를 진행할 수 있도록 만들었습니다.

감사합니다.

## 5. Demo Operation Notes

Before official demo:

1. Restore baseline DB.
2. Confirm Team A invite code is `5QZ2B4T6`.
3. Confirm Team B password is `team1234`.
4. Login check:
   - 김희서 account
   - 코덱스 account
   - 이광형 account
5. Keep a short audio file ready for Phase 1.

During demo:

1. If Gemini output is slow or unavailable, explicitly say fallback keeps the workflow uninterrupted.
2. In Team B, do not add too many Todo items during live demo. One recommendation/action is enough.
3. If Team A Retro Overall or Wrap-up is shown after inviting 이광형, mention that invite-based access is being demonstrated.

After demo:

1. Reset DB to baseline before another run.
2. Do not manually delete demo data one by one unless necessary.
