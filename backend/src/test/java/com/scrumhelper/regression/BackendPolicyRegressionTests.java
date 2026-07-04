package com.scrumhelper.regression;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.meeting.MeetingService;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import com.scrumhelper.retrospective.RetrospectiveService;
import com.scrumhelper.retrospective.dto.RetrospectiveResponse;
import com.scrumhelper.retrospective.dto.SaveRetrospectiveRequest;
import com.scrumhelper.task.TaskCommentService;
import com.scrumhelper.task.TaskService;
import com.scrumhelper.task.dto.SaveCommentRequest;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskCommentResponse;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.team.TeamService;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.JoinTeamByInviteCodeRequest;
import com.scrumhelper.team.dto.JoinTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import com.scrumhelper.team.dto.TeamMemberResponse;
import com.scrumhelper.team.dto.TransferLeaderRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class BackendPolicyRegressionTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private TaskService taskService;

	@Autowired
	private TaskCommentService taskCommentService;

	@Autowired
	private MeetingService meetingService;

	@Autowired
	private RetrospectiveService retrospectiveService;

	@Test
	void teamJoinAndLeaderPoliciesAreEnforced() {
		TestUsers users = createUsers();
		TeamDetailResponse passwordTeam = teamService.createTeam(
				users.ownerId(),
				new CreateTeamRequest(uniqueName("Password Team"), "private team", "secret")
		);

		assertBusinessError(
				() -> teamService.joinTeam(users.memberId(), passwordTeam.id(), new JoinTeamRequest(null)),
				ErrorCode.TEAM_PASSWORD_REQUIRED
		);
		assertBusinessError(
				() -> teamService.joinTeam(users.memberId(), passwordTeam.id(), new JoinTeamRequest("wrong")),
				ErrorCode.INVALID_TEAM_PASSWORD
		);

		TeamMemberResponse joinedMember = teamService.joinTeam(
				users.memberId(),
				passwordTeam.id(),
				new JoinTeamRequest("secret")
		);
		assertThat(joinedMember.role().name()).isEqualTo("MEMBER");

		assertBusinessError(
				() -> teamService.joinTeam(users.memberId(), passwordTeam.id(), new JoinTeamRequest("secret")),
				ErrorCode.ALREADY_TEAM_MEMBER
		);
		assertBusinessError(
				() -> teamService.removeMember(users.ownerId(), passwordTeam.id(), memberId(passwordTeam.id(), users.ownerId())),
				ErrorCode.CANNOT_REMOVE_SELF
		);

		teamService.transferLeader(
				users.ownerId(),
				passwordTeam.id(),
				new TransferLeaderRequest(users.memberId())
		);

		assertBusinessError(
				() -> teamService.transferLeader(
						users.ownerId(),
						passwordTeam.id(),
						new TransferLeaderRequest(users.outsiderId())
				),
				ErrorCode.LEADER_ONLY
		);
	}

	@Test
	void inviteCodeJoinBypassesTeamPasswordButPreventsDuplicateMembership() {
		TestUsers users = createUsers();
		TeamDetailResponse team = teamService.createTeam(
				users.ownerId(),
				new CreateTeamRequest(uniqueName("Invite Team"), "invite team", "secret")
		);

		TeamMemberResponse joinedMember = teamService.joinTeamByInviteCode(
				users.memberId(),
				new JoinTeamByInviteCodeRequest(team.inviteCode().substring(0, 4) + "-" + team.inviteCode().substring(4))
		);

		assertThat(joinedMember.teamId()).isEqualTo(team.id());
		assertBusinessError(
				() -> teamService.joinTeamByInviteCode(users.memberId(), new JoinTeamByInviteCodeRequest(team.inviteCode())),
				ErrorCode.ALREADY_TEAM_MEMBER
		);
	}

	@Test
	void taskAssigneeAndMemberRemovalPoliciesAreEnforced() {
		TestUsers users = createUsers();
		TeamDetailResponse team = createPublicTeamWithMember(users);

		assertBusinessError(
				() -> taskService.createTask(users.ownerId(), team.id(), taskRequest(List.of())),
				ErrorCode.ASSIGNEE_REQUIRED
		);
		assertBusinessError(
				() -> taskService.createTask(users.ownerId(), team.id(), taskRequest(List.of(users.outsiderId()))),
				ErrorCode.ASSIGNEE_NOT_TEAM_MEMBER
		);

		TaskResponse task = taskService.createTask(users.ownerId(), team.id(), taskRequest(List.of(users.memberId())));
		assertThat(task.assignees().stream().map(assignee -> assignee.id()).toList()).containsExactly(users.memberId());

		Long memberMembershipId = memberId(team.id(), users.memberId());
		assertBusinessError(
				() -> teamService.removeMember(users.ownerId(), team.id(), memberMembershipId),
				ErrorCode.REASSIGN_TASK_REQUIRED
		);
	}

	@Test
	void taskCommentCanOnlyBeChangedByAuthor() {
		TestUsers users = createUsers();
		TeamDetailResponse team = createPublicTeamWithMember(users);
		TaskResponse task = taskService.createTask(users.ownerId(), team.id(), taskRequest(List.of(users.memberId())));
		TaskCommentResponse comment = taskCommentService.createComment(
				users.memberId(),
				task.id(),
				new SaveCommentRequest("초기 의견")
		);

		assertBusinessError(
				() -> taskCommentService.updateComment(users.ownerId(), comment.id(), new SaveCommentRequest("수정 시도")),
				ErrorCode.COMMENT_AUTHOR_ONLY
		);
		assertBusinessError(
				() -> taskCommentService.deleteComment(users.outsiderId(), comment.id()),
				ErrorCode.NOT_TEAM_MEMBER
		);

		TaskCommentResponse updated = taskCommentService.updateComment(
				users.memberId(),
				comment.id(),
				new SaveCommentRequest("작성자 수정")
		);
		assertThat(updated.content()).isEqualTo("작성자 수정");
	}

	@Test
	void meetingCanOnlyBeChangedByAuthorOrLeader() {
		TestUsers users = createUsers();
		TeamDetailResponse team = createPublicTeamWithMember(users);
		teamService.joinTeam(users.outsiderId(), team.id(), null);
		MeetingResponse meeting = meetingService.createMeeting(
				users.memberId(),
				team.id(),
				meetingRequest("작성자 회의")
		);

		assertBusinessError(
				() -> meetingService.updateMeeting(users.outsiderId(), meeting.id(), meetingRequest("권한 없는 수정")),
				ErrorCode.MEETING_AUTHOR_OR_LEADER_ONLY
		);

		MeetingResponse updatedByLeader = meetingService.updateMeeting(
				users.ownerId(),
				meeting.id(),
				meetingRequest("팀장 수정")
		);
		assertThat(updatedByLeader.title()).isEqualTo("팀장 수정");
	}

	@Test
	void retrospectiveCollaboratorCanEditBodyButOnlyAuthorCanChangeCollaborators() {
		TestUsers users = createUsers();
		TeamDetailResponse team = createPublicTeamWithMember(users);
		teamService.joinTeam(users.outsiderId(), team.id(), null);
		RetrospectiveResponse retrospective = retrospectiveService.createRetrospective(
				users.ownerId(),
				team.id(),
				retrospectiveRequest("Day 1", "오늘 계획", List.of(users.memberId()))
		);

		RetrospectiveResponse editedByCollaborator = retrospectiveService.updateRetrospective(
				users.memberId(),
				retrospective.id(),
				retrospectiveRequest("Day 1 수정", "공동 작업자 본문 수정", List.of(users.memberId()))
		);
		assertThat(editedByCollaborator.todayPlan()).isEqualTo("공동 작업자 본문 수정");

		assertBusinessError(
				() -> retrospectiveService.updateRetrospective(
						users.memberId(),
						retrospective.id(),
						retrospectiveRequest("Day 1 수정", "공동 작업자 목록 변경 시도", List.of(users.outsiderId()))
				),
				ErrorCode.RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS
		);
		assertBusinessError(
				() -> retrospectiveService.updateRetrospective(
						users.outsiderId(),
						retrospective.id(),
						retrospectiveRequest("Day 1 수정", "제3자 수정 시도", List.of(users.memberId()))
				),
				ErrorCode.RETROSPECTIVE_EDITOR_ONLY
		);
	}

	private TeamDetailResponse createPublicTeamWithMember(TestUsers users) {
		TeamDetailResponse team = teamService.createTeam(
				users.ownerId(),
				new CreateTeamRequest(uniqueName("Regression Team"), "regression team", null)
		);
		teamService.joinTeam(users.memberId(), team.id(), null);
		return team;
	}

	private SaveTaskRequest taskRequest(List<Long> assigneeUserIds) {
		return new SaveTaskRequest(
				"정책 검증 task",
				"권한과 담당자 정책을 검증한다.",
				TaskPriority.MEDIUM,
				LocalDate.of(2026, 7, 6),
				assigneeUserIds
		);
	}

	private SaveMeetingRequest meetingRequest(String title) {
		return new SaveMeetingRequest(
				title,
				LocalDateTime.of(2026, 7, 4, 10, 0),
				"회의 원문",
				"회의 요약"
		);
	}

	private SaveRetrospectiveRequest retrospectiveRequest(String title, String todayPlan, List<Long> collaboratorUserIds) {
		return new SaveRetrospectiveRequest(
				title,
				"어제 한 일",
				todayPlan,
				"궁금한 것",
				collaboratorUserIds
		);
	}

	private void assertBusinessError(ThrowingAction action, ErrorCode expectedErrorCode) {
		assertThatThrownBy(action::run)
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(expectedErrorCode);
	}

	private TestUsers createUsers() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		return new TestUsers(
				signup("owner-" + stamp + "@test.com"),
				signup("member-" + stamp + "@test.com"),
				signup("outsider-" + stamp + "@test.com")
		);
	}

	private Long signup(String email) {
		return authService.signup(new SignupRequest(
				email.substring(0, email.indexOf('@')),
				email,
				"password"
		)).user().id();
	}

	private Long memberId(Long teamId, Long userId) {
		return teamService.getMembers(userId, teamId).stream()
				.filter(member -> member.user().id().equals(userId))
				.findFirst()
				.orElseThrow()
				.id();
	}

	private String uniqueName(String prefix) {
		return prefix + " " + UUID.randomUUID().toString().substring(0, 8);
	}

	@FunctionalInterface
	private interface ThrowingAction {
		void run();
	}

	private record TestUsers(Long ownerId, Long memberId, Long outsiderId) {
	}
}
