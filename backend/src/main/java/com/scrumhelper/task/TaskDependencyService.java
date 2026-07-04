package com.scrumhelper.task;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.task.Task;
import com.scrumhelper.domain.task.TaskDependency;
import com.scrumhelper.domain.task.TaskDependencyRepository;
import com.scrumhelper.domain.task.TaskRepository;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.task.dto.AddTaskDependencyRequest;
import com.scrumhelper.task.dto.TaskDependencyResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class TaskDependencyService {
	private final TaskDependencyRepository taskDependencyRepository;
	private final TaskRepository taskRepository;
	private final TeamMemberRepository teamMemberRepository;

	public TaskDependencyService(
			TaskDependencyRepository taskDependencyRepository,
			TaskRepository taskRepository,
			TeamMemberRepository teamMemberRepository
	) {
		this.taskDependencyRepository = taskDependencyRepository;
		this.taskRepository = taskRepository;
		this.teamMemberRepository = teamMemberRepository;
	}

	@Transactional(readOnly = true)
	public List<TaskDependencyResponse> getDependencies(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return taskDependencyRepository.findByPredecessorTeamIdOrderByCreatedAtAsc(teamId).stream()
				.map(TaskDependencyResponse::from)
				.toList();
	}

	@Transactional
	public TaskDependencyResponse addDependency(Long currentUserId, Long successorTaskId, AddTaskDependencyRequest request) {
		Task successor = findTask(successorTaskId);
		Task predecessor = findTask(request.predecessorTaskId());
		Long teamId = successor.getTeam().getId();
		requireMembership(teamId, currentUserId);
		validateDependency(predecessor, successor);

		TaskDependency dependency = taskDependencyRepository.save(TaskDependency.create(predecessor, successor));
		return TaskDependencyResponse.from(dependency);
	}

	@Transactional
	public void removeDependency(Long currentUserId, Long successorTaskId, Long predecessorTaskId) {
		Task successor = findTask(successorTaskId);
		requireMembership(successor.getTeam().getId(), currentUserId);
		TaskDependency dependency = taskDependencyRepository
				.findByPredecessorIdAndSuccessorId(predecessorTaskId, successorTaskId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_DEPENDENCY_NOT_FOUND));
		taskDependencyRepository.delete(dependency);
	}

	private void validateDependency(Task predecessor, Task successor) {
		if (predecessor.getId().equals(successor.getId())) {
			throw new BusinessException(ErrorCode.TASK_DEPENDENCY_SELF_REFERENCE);
		}
		if (!predecessor.getTeam().getId().equals(successor.getTeam().getId())) {
			throw new BusinessException(ErrorCode.TASK_NOT_SAME_TEAM);
		}
		if (taskDependencyRepository.existsByPredecessorIdAndSuccessorId(predecessor.getId(), successor.getId())) {
			throw new BusinessException(ErrorCode.TASK_DEPENDENCY_ALREADY_EXISTS);
		}
		if (hasPath(successor.getId(), predecessor.getId(), new HashSet<>())) {
			throw new BusinessException(ErrorCode.TASK_DEPENDENCY_CYCLE);
		}
	}

	private boolean hasPath(Long fromTaskId, Long targetTaskId, Set<Long> visitedTaskIds) {
		if (!visitedTaskIds.add(fromTaskId)) {
			return false;
		}
		List<TaskDependency> dependencies = taskDependencyRepository.findByPredecessorId(fromTaskId);
		for (TaskDependency dependency : dependencies) {
			Long successorTaskId = dependency.getSuccessor().getId();
			if (successorTaskId.equals(targetTaskId)) {
				return true;
			}
			if (hasPath(successorTaskId, targetTaskId, visitedTaskIds)) {
				return true;
			}
		}
		return false;
	}

	private Task findTask(Long taskId) {
		return taskRepository.findById(taskId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_FOUND));
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}
}
