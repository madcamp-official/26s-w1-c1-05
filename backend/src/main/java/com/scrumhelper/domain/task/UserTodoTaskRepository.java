package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserTodoTaskRepository extends JpaRepository<UserTodoTask, Long> {
	List<UserTodoTask> findByTeamIdAndUserIdOrderBySortOrderAscCreatedAtAsc(Long teamId, Long userId);

	void deleteByTeamIdAndUserId(Long teamId, Long userId);

	void deleteByTaskId(Long taskId);

	void deleteByTeamIdAndUserIdAndTaskId(Long teamId, Long userId, Long taskId);
}
