package com.scrumhelper.team;

import com.scrumhelper.auth.AuthService;
import com.scrumhelper.auth.dto.SignupRequest;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.task.TaskService;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.TeamDetailResponse;
import com.scrumhelper.team.dto.TeamLeaderboardResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class TeamLeaderboardServiceTests {
	@Autowired
	private AuthService authService;

	@Autowired
	private TeamService teamService;

	@Autowired
	private TaskService taskService;

	@Test
	void leaderboardRanksMembersByCompletedTaskPoints() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("leaderboard-owner-" + stamp + "@test.com", "Owner " + stamp);
		Long memberAId = signup("leaderboard-a-" + stamp + "@test.com", "Alice " + stamp);
		Long memberBId = signup("leaderboard-b-" + stamp + "@test.com", "Bob " + stamp);
		Long outsiderId = signup("leaderboard-outsider-" + stamp + "@test.com", "Outsider " + stamp);
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Leaderboard Team " + stamp, "leaderboard test team", null)
		);
		teamService.joinTeam(memberAId, team.id(), null);
		teamService.joinTeam(memberBId, team.id(), null);

		createCompletedTask(ownerId, team.id(), List.of(memberAId), TaskPriority.LOW);
		createCompletedTask(ownerId, team.id(), List.of(memberAId), TaskPriority.LOW);
		createCompletedTask(ownerId, team.id(), List.of(ownerId, memberAId), TaskPriority.MEDIUM);
		createCompletedTask(ownerId, team.id(), List.of(memberBId), TaskPriority.HIGH);
		createIncompleteTask(ownerId, team.id(), List.of(memberBId));

		List<TeamLeaderboardResponse> leaderboard = teamService.getLeaderboard(ownerId, team.id());

		assertThat(leaderboard).hasSize(3);
		assertThat(leaderboard.get(0).user().id()).isEqualTo(memberAId);
		assertThat(leaderboard.get(0).completedTaskCount()).isEqualTo(3);
		assertThat(leaderboard.get(0).points()).isEqualTo(5);
		assertThat(leaderboard.get(0).rank()).isEqualTo(1);
		assertThat(leaderboard.get(0).reputationLevel()).isEqualTo("SPROUT");

		assertThat(countOf(leaderboard, ownerId)).isEqualTo(1);
		assertThat(pointsOf(leaderboard, ownerId)).isEqualTo(3);
		assertThat(rankOf(leaderboard, ownerId)).isEqualTo(3);
		assertThat(countOf(leaderboard, memberBId)).isEqualTo(1);
		assertThat(pointsOf(leaderboard, memberBId)).isEqualTo(5);
		assertThat(rankOf(leaderboard, memberBId)).isEqualTo(1);

		assertThatThrownBy(() -> teamService.getLeaderboard(outsiderId, team.id()))
				.isInstanceOf(BusinessException.class)
				.extracting("errorCode")
				.isEqualTo(ErrorCode.NOT_TEAM_MEMBER);
	}

	@Test
	void reputationLevelUsesCompletedTaskPointThresholds() {
		String stamp = UUID.randomUUID().toString().substring(0, 8);
		Long ownerId = signup("level-owner-" + stamp + "@test.com", "Level Owner " + stamp);
		Long saplingUserId = signup("level-sapling-" + stamp + "@test.com", "Level Sapling " + stamp);
		Long oakUserId = signup("level-oak-" + stamp + "@test.com", "Level Oak " + stamp);
		Long seedUserId = signup("level-seed-" + stamp + "@test.com", "Level Seed " + stamp);
		TeamDetailResponse team = teamService.createTeam(
				ownerId,
				new CreateTeamRequest("Level Team " + stamp, "level test team", null)
		);
		teamService.joinTeam(saplingUserId, team.id(), null);
		teamService.joinTeam(oakUserId, team.id(), null);
		teamService.joinTeam(seedUserId, team.id(), null);

		for (int i = 0; i < 3; i++) {
			createCompletedTask(ownerId, team.id(), List.of(saplingUserId), TaskPriority.HIGH);
		}
		for (int i = 0; i < 7; i++) {
			createCompletedTask(ownerId, team.id(), List.of(oakUserId), TaskPriority.HIGH);
		}

		List<TeamLeaderboardResponse> leaderboard = teamService.getLeaderboard(ownerId, team.id());

		assertThat(levelOf(leaderboard, oakUserId)).isEqualTo("OAK");
		assertThat(levelOf(leaderboard, saplingUserId)).isEqualTo("SAPLING");
		assertThat(levelOf(leaderboard, seedUserId)).isEqualTo("SEED");
	}

	private TaskResponse createCompletedTask(
			Long currentUserId,
			Long teamId,
			List<Long> assigneeUserIds,
			TaskPriority priority
	) {
		TaskResponse task = taskService.createTask(currentUserId, teamId, taskRequest(assigneeUserIds, priority));
		return taskService.updateStatus(currentUserId, task.id(), new TaskStatusRequest(TaskStatus.DONE, null));
	}

	private TaskResponse createIncompleteTask(Long currentUserId, Long teamId, List<Long> assigneeUserIds) {
		return taskService.createTask(currentUserId, teamId, taskRequest(assigneeUserIds, TaskPriority.MEDIUM));
	}

	private SaveTaskRequest taskRequest(List<Long> assigneeUserIds, TaskPriority priority) {
		return new SaveTaskRequest(
				"Leaderboard task",
				"Completed task ranking verification",
				priority,
				LocalDate.of(2026, 7, 6),
				assigneeUserIds
		);
	}

	private String levelOf(List<TeamLeaderboardResponse> leaderboard, Long userId) {
		return leaderboard.stream()
				.filter(row -> row.user().id().equals(userId))
				.findFirst()
				.orElseThrow()
				.reputationLevel();
	}

	private long countOf(List<TeamLeaderboardResponse> leaderboard, Long userId) {
		return leaderboard.stream()
				.filter(row -> row.user().id().equals(userId))
				.findFirst()
				.orElseThrow()
				.completedTaskCount();
	}

	private long pointsOf(List<TeamLeaderboardResponse> leaderboard, Long userId) {
		return leaderboard.stream()
				.filter(row -> row.user().id().equals(userId))
				.findFirst()
				.orElseThrow()
				.points();
	}

	private int rankOf(List<TeamLeaderboardResponse> leaderboard, Long userId) {
		return leaderboard.stream()
				.filter(row -> row.user().id().equals(userId))
				.findFirst()
				.orElseThrow()
				.rank();
	}

	private Long signup(String email, String name) {
		return authService.signup(new SignupRequest(name, email, "password")).user().id();
	}
}
