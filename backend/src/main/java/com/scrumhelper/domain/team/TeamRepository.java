package com.scrumhelper.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
	boolean existsByNameIgnoreCase(String name);

	List<Team> findAllByOrderByCreatedAtDesc();

	List<Team> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
}
