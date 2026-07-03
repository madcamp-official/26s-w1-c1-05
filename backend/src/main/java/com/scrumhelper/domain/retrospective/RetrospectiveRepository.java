package com.scrumhelper.domain.retrospective;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RetrospectiveRepository extends JpaRepository<Retrospective, Long>, JpaSpecificationExecutor<Retrospective> {
	long countByTeamId(Long teamId);

	long countByTeamIdAndAuthorId(Long teamId, Long authorId);
}
