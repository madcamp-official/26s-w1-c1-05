package com.scrumhelper.userprofile;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskAssignee;
import com.scrumhelper.domain.task.TaskAssigneeRepository;
import com.scrumhelper.domain.task.TaskCommentRepository;
import com.scrumhelper.domain.task.TaskStatus;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.userprofile.dto.UserProfileResponse;
import com.scrumhelper.userprofile.dto.UserProfileTeamResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class UserProfileService {
	private final UserRepository userRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final TaskAssigneeRepository taskAssigneeRepository;
	private final TaskCommentRepository taskCommentRepository;

	public UserProfileService(
			UserRepository userRepository,
			TeamMemberRepository teamMemberRepository,
			TaskAssigneeRepository taskAssigneeRepository,
			TaskCommentRepository taskCommentRepository
	) {
		this.userRepository = userRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.taskAssigneeRepository = taskAssigneeRepository;
		this.taskCommentRepository = taskCommentRepository;
	}

	@Transactional(readOnly = true)
	public UserProfileResponse getProfile(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

		List<UserProfileTeamResponse> teams = new ArrayList<>();
		long totalCompleted = 0;
		for (TeamMember membership : teamMemberRepository.findByUserIdOrderByJoinedAtAsc(userId)) {
			Long teamId = membership.getTeam().getId();
			List<TaskResponse> tasks = taskAssigneeRepository.findByTeamIdAndUserId(teamId, userId).stream()
					.map(TaskAssignee::getTask)
					.sorted(Comparator.comparing(Task::isCompleted).thenComparing(Task::getCreatedAt))
					.map(this::toResponse)
					.toList();
			long completed = tasks.stream().filter(task -> task.status() == TaskStatus.DONE).count();
			totalCompleted += completed;
			teams.add(new UserProfileTeamResponse(
					teamId,
					membership.getTeam().getName(),
					membership.getRole().name(),
					completed,
					tasks
			));
		}

		return new UserProfileResponse(UserSummaryResponse.from(user), totalCompleted, teams);
	}

	private TaskResponse toResponse(Task task) {
		List<UserSummaryResponse> assignees = taskAssigneeRepository.findByTaskId(task.getId()).stream()
				.map(assignee -> UserSummaryResponse.from(assignee.getUser()))
				.toList();
		return TaskResponse.from(task, assignees, taskCommentRepository.countByTaskId(task.getId()));
	}
}
