package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
	List<TaskAssignee> findByTaskId(Long taskId);

	List<TaskAssignee> findByTeamIdAndUserId(Long teamId, Long userId);

	boolean existsByTaskIdAndUserId(Long taskId, Long userId);

	void deleteByTaskId(Long taskId);

	void deleteByTeamIdAndUserId(Long teamId, Long userId);

	@Query("""
			select count(distinct ta.task.id) > 0
			from TaskAssignee ta
			where ta.team.id = :teamId
			  and ta.user.id = :userId
			  and (
			    select count(other.id)
			    from TaskAssignee other
			    where other.task.id = ta.task.id
			  ) = 1
			""")
	boolean existsSoleAssigneeTask(@Param("teamId") Long teamId, @Param("userId") Long userId);

	@Query("""
			select ta.user.id as userId,
			       count(distinct ta.task.id) as completedTaskCount,
			       coalesce(sum(
			         case
			           when ta.task.priority = com.scrumhelper.domain.task.TaskPriority.HIGH then 5
			           when ta.task.priority = com.scrumhelper.domain.task.TaskPriority.MEDIUM then 3
			           else 1
			         end
			       ), 0) as points
			from TaskAssignee ta
			where ta.team.id = :teamId
			  and ta.task.completed = true
			group by ta.user.id
			""")
	List<CompletedTaskScoreView> scoreCompletedTasksByUserId(@Param("teamId") Long teamId);

	interface CompletedTaskScoreView {
		Long getUserId();

		long getCompletedTaskCount();

		long getPoints();
	}
}
