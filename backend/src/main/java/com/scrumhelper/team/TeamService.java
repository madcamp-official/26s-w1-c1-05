package com.scrumhelper.team;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.retrospective.RetrospectiveCollaboratorRepository;
import com.scrumhelper.domain.retrospective.RetrospectiveRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.team.TeamRole;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.domain.task.UserTodoTaskRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.JoinTeamByInviteCodeRequest;
import com.scrumhelper.team.dto.JoinTeamRequest;
import com.scrumhelper.team.dto.TeamDashboardResponse;
import com.scrumhelper.team.dto.TeamDetailResponse;
import com.scrumhelper.team.dto.TeamInviteCodeResponse;
import com.scrumhelper.team.dto.TeamLeaderboardResponse;
import com.scrumhelper.team.dto.TeamMemberProfileResponse;
import com.scrumhelper.team.dto.TeamMemberResponse;
import com.scrumhelper.team.dto.TeamPasswordResponse;
import com.scrumhelper.team.dto.TeamSummaryResponse;
import com.scrumhelper.team.dto.TransferLeaderRequest;
import com.scrumhelper.team.dto.TransferLeaderResponse;
import com.scrumhelper.team.dto.UpdateTeamPasswordRequest;
import com.scrumhelper.team.dto.UpdateTeamRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TeamService {
	private static final String INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final int INVITE_CODE_LENGTH = 8;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final RetrospectiveRepository retrospectiveRepository;
	private final RetrospectiveCollaboratorRepository retrospectiveCollaboratorRepository;
	private final TaskRepository taskRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final UserTodoTaskRepository userTodoTaskRepository;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public TeamService(
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			RetrospectiveRepository retrospectiveRepository,
			RetrospectiveCollaboratorRepository retrospectiveCollaboratorRepository,
			TaskRepository taskRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			UserTodoTaskRepository userTodoTaskRepository,
			UserRepository userRepository,
			PasswordEncoder passwordEncoder
	) {
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.retrospectiveRepository = retrospectiveRepository;
		this.retrospectiveCollaboratorRepository = retrospectiveCollaboratorRepository;
		this.taskRepository = taskRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.userTodoTaskRepository = userTodoTaskRepository;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public List<TeamSummaryResponse> getTeams(Long currentUserId, String keyword) {
		List<Team> teams = keyword == null || keyword.isBlank()
				? teamRepository.findAllByOrderByCreatedAtDesc()
				: teamRepository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(keyword.trim());

		return teams.stream()
				.map(team -> toSummaryResponse(team, currentUserId))
				.toList();
	}

	@Transactional
	public TeamDetailResponse createTeam(Long currentUserId, CreateTeamRequest request) {
		String name = request.name().trim();
		if (teamRepository.existsByNameIgnoreCase(name)) {
			throw new BusinessException(ErrorCode.TEAM_NAME_ALREADY_EXISTS);
		}

		User leader = findUser(currentUserId);
		String passwordHash = request.password() == null || request.password().isBlank()
				? null
				: passwordEncoder.encode(request.password());

		Team team = teamRepository.save(Team.create(
				name,
				normalizeOptionalText(request.description()),
				passwordHash,
				generateUniqueInviteCode(),
				leader
		));
		teamMemberRepository.save(TeamMember.create(team, leader, TeamRole.LEADER));

		return toDetailResponse(team, TeamRole.LEADER);
	}

	@Transactional(readOnly = true)
	public TeamDetailResponse getTeam(Long currentUserId, Long teamId) {
		Team team = findTeam(teamId);
		TeamMember membership = requireMembership(teamId, currentUserId);
		return toDetailResponse(team, membership.getRole());
	}

	@Transactional(readOnly = true)
	public TeamDashboardResponse getDashboard(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return new TeamDashboardResponse(
				teamId,
				teamMemberRepository.countByTeamId(teamId),
				new TeamDashboardResponse.TaskSummary(
						taskRepository.countByTeamId(teamId),
						taskRepository.countByTeamIdAndCompleted(teamId, true),
						taskRepository.countByTeamIdAndCompleted(teamId, false),
						taskRepository.countByTeamIdAndStatus(teamId, TaskStatus.BACKLOG)
								+ taskRepository.countByTeamIdAndStatusIsNullAndCompletedFalse(teamId),
						taskRepository.countByTeamIdAndStatus(teamId, TaskStatus.IN_PROGRESS)
				),
				new TeamDashboardResponse.RetrospectiveSummary(
						retrospectiveRepository.countByTeamId(teamId),
						retrospectiveRepository.countByTeamIdAndAuthorId(teamId, currentUserId),
						retrospectiveCollaboratorRepository.countDistinctByTeamIdAndUserId(teamId, currentUserId)
				)
		);
	}

	@Transactional
	public TeamMemberResponse joinTeam(Long currentUserId, Long teamId, JoinTeamRequest request) {
		Team team = findTeam(teamId);
		if (teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
			throw new BusinessException(ErrorCode.ALREADY_TEAM_MEMBER);
		}

		if (team.hasPassword()) {
			String password = request == null ? null : request.password();
			if (password == null || password.isBlank()) {
				throw new BusinessException(ErrorCode.TEAM_PASSWORD_REQUIRED);
			}
			if (!passwordEncoder.matches(password, team.getPasswordHash())) {
				throw new BusinessException(ErrorCode.INVALID_TEAM_PASSWORD);
			}
		}

		User user = findUser(currentUserId);
		TeamMember member = teamMemberRepository.save(TeamMember.create(team, user, TeamRole.MEMBER));
		return TeamMemberResponse.from(member);
	}

	@Transactional
	public TeamMemberResponse joinTeamByInviteCode(Long currentUserId, JoinTeamByInviteCodeRequest request) {
		String inviteCode = normalizeInviteCode(request.inviteCode());
		Team team = teamRepository.findByInviteCode(inviteCode)
				.orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INVITE_CODE));
		if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), currentUserId)) {
			throw new BusinessException(ErrorCode.ALREADY_TEAM_MEMBER);
		}

		User user = findUser(currentUserId);
		TeamMember member = teamMemberRepository.save(TeamMember.create(team, user, TeamRole.MEMBER));
		return TeamMemberResponse.from(member);
	}

	@Transactional(readOnly = true)
	public List<TeamMemberResponse> getMembers(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return teamMemberRepository.findByTeamIdOrderByRoleAscJoinedAtAsc(teamId).stream()
				.map(TeamMemberResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<TeamLeaderboardResponse> getLeaderboard(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return buildLeaderboard(teamId);
	}

	@Transactional(readOnly = true)
	public TeamMemberProfileResponse getMemberProfile(Long currentUserId, Long teamId, Long userId) {
		requireMembership(teamId, currentUserId);
		TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TARGET_NOT_TEAM_MEMBER));
		TeamLeaderboardResponse leaderboardRow = buildLeaderboard(teamId).stream()
				.filter(row -> row.user().id().equals(userId))
				.findFirst()
				.orElseThrow(() -> new BusinessException(ErrorCode.TARGET_NOT_TEAM_MEMBER));

		return new TeamMemberProfileResponse(
				UserSummaryResponse.from(member.getUser()),
				member.getRole(),
				member.getJoinedAt(),
				leaderboardRow.completedTaskCount(),
				leaderboardRow.points(),
				leaderboardRow.rank(),
				leaderboardRow.reputationLevel()
		);
	}

	private List<TeamLeaderboardResponse> buildLeaderboard(Long teamId) {
		Map<Long, TaskScore> taskScores = taskAssigneeRepository.scoreCompletedTasksByUserId(teamId).stream()
				.collect(Collectors.toMap(
						TaskAssigneeRepository.CompletedTaskScoreView::getUserId,
						score -> new TaskScore(score.getCompletedTaskCount(), score.getPoints())
				));
		List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByRoleAscJoinedAtAsc(teamId);
		List<LeaderboardRow> rows = members.stream()
				.map(member -> new LeaderboardRow(
						member.getUser(),
						taskScores.getOrDefault(member.getUser().getId(), TaskScore.EMPTY).completedTaskCount(),
						taskScores.getOrDefault(member.getUser().getId(), TaskScore.EMPTY).points()
				))
				.sorted(Comparator
						.comparingLong(LeaderboardRow::points).reversed()
						.thenComparing(Comparator.comparingLong(LeaderboardRow::completedTaskCount).reversed())
						.thenComparing(row -> row.user().getName(), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(row -> row.user().getId()))
				.toList();

		return assignRanks(rows).stream()
				.map(row -> new TeamLeaderboardResponse(
						UserSummaryResponse.from(row.user()),
						row.completedTaskCount(),
						row.points(),
						row.rank(),
						reputationLevel(row.points())
				))
				.toList();
	}

	@Transactional
	public TeamDetailResponse updateTeam(Long currentUserId, Long teamId, UpdateTeamRequest request) {
		Team team = findTeam(teamId);
		requireLeader(teamId, currentUserId);

		String name = request.name().trim();
		if (!team.getName().equalsIgnoreCase(name) && teamRepository.existsByNameIgnoreCase(name)) {
			throw new BusinessException(ErrorCode.TEAM_NAME_ALREADY_EXISTS);
		}

		team.updateInfo(name, normalizeOptionalText(request.description()));
		return toDetailResponse(team, TeamRole.LEADER);
	}

	@Transactional
	public TeamPasswordResponse updatePassword(Long currentUserId, Long teamId, UpdateTeamPasswordRequest request) {
		Team team = findTeam(teamId);
		requireLeader(teamId, currentUserId);

		String passwordHash = request.password() == null || request.password().isBlank()
				? null
				: passwordEncoder.encode(request.password());
		team.updatePasswordHash(passwordHash);
		return new TeamPasswordResponse(team.getId(), team.hasPassword());
	}

	@Transactional
	public TeamInviteCodeResponse rotateInviteCode(Long currentUserId, Long teamId) {
		Team team = findTeam(teamId);
		requireLeader(teamId, currentUserId);
		team.updateInviteCode(generateUniqueInviteCode());
		return new TeamInviteCodeResponse(team.getId(), team.getInviteCode());
	}

	@Transactional
	public TransferLeaderResponse transferLeader(Long currentUserId, Long teamId, TransferLeaderRequest request) {
		Team team = findTeam(teamId);
		TeamMember currentLeader = requireLeader(teamId, currentUserId);
		if (currentUserId.equals(request.newLeaderUserId())) {
			throw new BusinessException(ErrorCode.ALREADY_LEADER);
		}

		TeamMember newLeader = teamMemberRepository.findByTeamIdAndUserId(teamId, request.newLeaderUserId())
				.orElseThrow(() -> new BusinessException(ErrorCode.TARGET_NOT_TEAM_MEMBER));

		User previousLeaderUser = currentLeader.getUser();
		User newLeaderUser = newLeader.getUser();
		currentLeader.changeRole(TeamRole.MEMBER);
		newLeader.changeRole(TeamRole.LEADER);
		team.changeLeader(newLeaderUser);

		return new TransferLeaderResponse(
				teamId,
				UserSummaryResponse.from(previousLeaderUser),
				UserSummaryResponse.from(newLeaderUser)
		);
	}

	@Transactional
	public void removeMember(Long currentUserId, Long teamId, Long memberId) {
		requireLeader(teamId, currentUserId);
		TeamMember target = teamMemberRepository.findById(memberId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TARGET_NOT_TEAM_MEMBER));

		if (!target.getTeam().getId().equals(teamId)) {
			throw new BusinessException(ErrorCode.TARGET_NOT_TEAM_MEMBER);
		}
		if (target.getUser().getId().equals(currentUserId)) {
			throw new BusinessException(ErrorCode.CANNOT_REMOVE_SELF);
		}
		if (target.getRole() == TeamRole.LEADER) {
			throw new BusinessException(ErrorCode.CANNOT_REMOVE_LEADER);
		}
		if (taskAssigneeRepository.existsSoleAssigneeTask(teamId, target.getUser().getId())) {
			throw new BusinessException(ErrorCode.REASSIGN_TASK_REQUIRED);
		}

		taskAssigneeRepository.deleteByTeamIdAndUserId(teamId, target.getUser().getId());
		userTodoTaskRepository.deleteByTeamIdAndUserId(teamId, target.getUser().getId());
		retrospectiveCollaboratorRepository.deleteByTeamIdAndUserId(teamId, target.getUser().getId());
		teamMemberRepository.delete(target);
	}

	private TeamSummaryResponse toSummaryResponse(Team team, Long currentUserId) {
		TeamMember membership = teamMemberRepository.findByTeamIdAndUserId(team.getId(), currentUserId)
				.orElse(null);
		return new TeamSummaryResponse(
				team.getId(),
				team.getName(),
				team.getDescription(),
				team.hasPassword(),
				teamMemberRepository.countByTeamId(team.getId()),
				UserSummaryResponse.from(team.getLeader()),
				membership != null,
				membership == null ? null : membership.getRole()
		);
	}

	private TeamDetailResponse toDetailResponse(Team team, TeamRole myRole) {
		return new TeamDetailResponse(
				team.getId(),
				team.getName(),
				team.getDescription(),
				team.hasPassword(),
				team.getInviteCode(),
				UserSummaryResponse.from(team.getLeader()),
				myRole,
				team.getCreatedAt(),
				team.getUpdatedAt()
		);
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private TeamMember requireMembership(Long teamId, Long userId) {
		return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_TEAM_MEMBER));
	}

	private TeamMember requireLeader(Long teamId, Long userId) {
		TeamMember membership = requireMembership(teamId, userId);
		if (membership.getRole() != TeamRole.LEADER) {
			throw new BusinessException(ErrorCode.LEADER_ONLY);
		}
		return membership;
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private String normalizeInviteCode(String value) {
		return value.trim()
				.replace("-", "")
				.replace(" ", "")
				.toUpperCase(Locale.ROOT);
	}

	private String generateUniqueInviteCode() {
		String inviteCode;
		do {
			inviteCode = generateInviteCode();
		} while (teamRepository.existsByInviteCode(inviteCode));
		return inviteCode;
	}

	private String generateInviteCode() {
		StringBuilder builder = new StringBuilder(INVITE_CODE_LENGTH);
		for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
			builder.append(INVITE_CODE_ALPHABET.charAt(SECURE_RANDOM.nextInt(INVITE_CODE_ALPHABET.length())));
		}
		return builder.toString();
	}

	private List<RankedLeaderboardRow> assignRanks(List<LeaderboardRow> rows) {
		java.util.ArrayList<RankedLeaderboardRow> rankedRows = new java.util.ArrayList<>();
		long previousPoints = Long.MIN_VALUE;
		int previousRank = 0;
		for (int index = 0; index < rows.size(); index++) {
			LeaderboardRow row = rows.get(index);
			int rank = row.points() == previousPoints ? previousRank : index + 1;
			rankedRows.add(new RankedLeaderboardRow(row.user(), row.completedTaskCount(), row.points(), rank));
			previousPoints = row.points();
			previousRank = rank;
		}
		return rankedRows;
	}

	private String reputationLevel(long points) {
		if (points >= 35) {
			return "OAK";
		}
		if (points >= 15) {
			return "SAPLING";
		}
		if (points >= 1) {
			return "SPROUT";
		}
		return "SEED";
	}

	private record TaskScore(long completedTaskCount, long points) {
		private static final TaskScore EMPTY = new TaskScore(0, 0);
	}

	private record LeaderboardRow(User user, long completedTaskCount, long points) {
	}

	private record RankedLeaderboardRow(User user, long completedTaskCount, long points, int rank) {
	}
}
