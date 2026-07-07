package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
	List<Task> findByTeamIdOrderByCreatedAtAsc(Long teamId);

	List<Task> findByTeamIdAndStatusOrderBySortOrderAscCreatedAtAsc(Long teamId, TaskStatus status);

	long countByTeamId(Long teamId);

	long countByTeamIdAndCompleted(Long teamId, boolean completed);

	long countByTeamIdAndStatus(Long teamId, TaskStatus status);

	long countByTeamIdAndStatusIsNullAndCompletedFalse(Long teamId);

	boolean existsByTeamIdAndTitleIgnoreCase(Long teamId, String title);

	boolean existsByTeamIdAndTitleIgnoreCaseAndIdNot(Long teamId, String title, Long id);
}
