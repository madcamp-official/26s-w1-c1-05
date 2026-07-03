package com.scrumhelper.domain.retrospective;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RetrospectiveCollaboratorRepository extends JpaRepository<RetrospectiveCollaborator, Long> {
	List<RetrospectiveCollaborator> findByRetrospectiveId(Long retrospectiveId);

	boolean existsByRetrospectiveIdAndUserId(Long retrospectiveId, Long userId);

	void deleteByRetrospectiveId(Long retrospectiveId);

	void deleteByTeamIdAndUserId(Long teamId, Long userId);

	@Query("""
			select count(distinct collaborator.retrospective.id)
			from RetrospectiveCollaborator collaborator
			where collaborator.team.id = :teamId
			  and collaborator.user.id = :userId
			""")
	long countDistinctByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);
}
