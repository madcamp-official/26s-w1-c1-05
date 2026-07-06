package com.scrumhelper.domain.tasksuggestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskSuggestionRepository extends JpaRepository<TaskSuggestion, Long> {
	List<TaskSuggestion> findByTeamIdAndStatusOrderByCreatedAtAsc(Long teamId, TaskSuggestionStatus status);
}
