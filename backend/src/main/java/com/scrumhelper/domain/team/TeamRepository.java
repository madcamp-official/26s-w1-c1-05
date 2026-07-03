package com.scrumhelper.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
	boolean existsByNameIgnoreCase(String name);

	boolean existsByInviteCode(String inviteCode);

	Optional<Team> findByInviteCode(String inviteCode);

	List<Team> findAllByOrderByCreatedAtDesc();

	List<Team> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
}
