package com.scrumhelper.domain.specdocument;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecDocumentRepository extends JpaRepository<SpecDocument, Long> {
	List<SpecDocument> findByTeamIdOrderByUpdatedAtDescCreatedAtDesc(Long teamId);
}
