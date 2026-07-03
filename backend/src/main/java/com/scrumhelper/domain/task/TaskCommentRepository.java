package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
	List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

	long countByTaskId(Long taskId);

	void deleteByTaskId(Long taskId);
}
