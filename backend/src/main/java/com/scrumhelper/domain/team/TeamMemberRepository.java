package com.scrumhelper.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
	boolean existsByTeamIdAndUserId(Long teamId, Long userId);

	long countByTeamId(Long teamId);

	Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

	List<TeamMember> findByTeamIdOrderByRoleAscJoinedAtAsc(Long teamId);

	void deleteByTeamIdAndUserId(Long teamId, Long userId);
}
