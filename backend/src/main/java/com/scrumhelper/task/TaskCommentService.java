package com.scrumhelper.task;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskComment;
import com.scrumhelper.domain.task.TaskCommentRepository;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.task.dto.SaveCommentRequest;
import com.scrumhelper.task.dto.TaskCommentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskCommentService {
	private final TaskCommentRepository taskCommentRepository;
	private final TaskRepository taskRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public TaskCommentService(
			TaskCommentRepository taskCommentRepository,
			TaskRepository taskRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository
	) {
		this.taskCommentRepository = taskCommentRepository;
		this.taskRepository = taskRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<TaskCommentResponse> getComments(Long currentUserId, Long taskId) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
				.map(TaskCommentResponse::from)
				.toList();
	}

	@Transactional
	public TaskCommentResponse createComment(Long currentUserId, Long taskId, SaveCommentRequest request) {
		Task task = findTask(taskId);
		requireMembership(task.getTeam().getId(), currentUserId);
		User author = userRepository.findById(currentUserId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
		TaskComment comment = taskCommentRepository.save(TaskComment.create(
				task,
				author,
				request.content().trim()
		));
		return TaskCommentResponse.from(comment);
	}

	@Transactional
	public TaskCommentResponse updateComment(Long currentUserId, Long commentId, SaveCommentRequest request) {
		TaskComment comment = findComment(commentId);
		requireMembership(comment.getTask().getTeam().getId(), currentUserId);
		requireAuthor(comment, currentUserId);
		comment.updateContent(request.content().trim());
		return TaskCommentResponse.from(comment);
	}

	@Transactional
	public void deleteComment(Long currentUserId, Long commentId) {
		TaskComment comment = findComment(commentId);
		requireMembership(comment.getTask().getTeam().getId(), currentUserId);
		requireAuthor(comment, currentUserId);
		taskCommentRepository.delete(comment);
	}

	private Task findTask(Long taskId) {
		return taskRepository.findById(taskId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_FOUND));
	}

	private TaskComment findComment(Long commentId) {
		return taskCommentRepository.findById(commentId)
				.orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}

	private void requireAuthor(TaskComment comment, Long userId) {
		if (!comment.getAuthor().getId().equals(userId)) {
			throw new BusinessException(ErrorCode.COMMENT_AUTHOR_ONLY);
		}
	}
}
