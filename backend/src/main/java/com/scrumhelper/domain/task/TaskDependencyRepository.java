package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskDependencyRepository extends JpaRepository<TaskDependency, Long> {
	boolean existsByPredecessorIdAndSuccessorId(Long predecessorTaskId, Long successorTaskId);

	Optional<TaskDependency> findByPredecessorIdAndSuccessorId(Long predecessorTaskId, Long successorTaskId);

	List<TaskDependency> findByPredecessorTeamIdOrderByCreatedAtAsc(Long teamId);

	List<TaskDependency> findByPredecessorId(Long predecessorTaskId);

	List<TaskDependency> findBySuccessorId(Long successorTaskId);

	void deleteByPredecessorIdOrSuccessorId(Long predecessorTaskId, Long successorTaskId);
}
