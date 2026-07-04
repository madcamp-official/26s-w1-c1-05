package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
	long countByTeamId(Long teamId);

	long countByTeamIdAndCompleted(Long teamId, boolean completed);

	long countByTeamIdAndCompletedFalseAndDueDateBefore(Long teamId, LocalDate dueDate);

	long countByTeamIdAndCompletedFalseAndDueDateBetween(Long teamId, LocalDate from, LocalDate to);

	long countByTeamIdAndStatus(Long teamId, TaskStatus status);

	long countByTeamIdAndStatusIsNullAndCompletedFalse(Long teamId);
}
