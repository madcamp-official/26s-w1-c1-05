package com.scrumhelper.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
	List<TaskAssignee> findByTaskId(Long taskId);

	List<TaskAssignee> findByTeamIdAndUserId(Long teamId, Long userId);

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
			select ta.user.id as userId, count(distinct ta.task.id) as completedTaskCount
			from TaskAssignee ta
			where ta.team.id = :teamId
			  and ta.task.completed = true
			group by ta.user.id
			""")
	List<CompletedTaskCountView> countCompletedTasksByUserId(@Param("teamId") Long teamId);

	interface CompletedTaskCountView {
		Long getUserId();

		long getCompletedTaskCount();
	}
}
