package com.scrumhelper.domain.specdocument;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpecDocumentRepository extends JpaRepository<SpecDocument, Long> {
	List<SpecDocument> findByTeamIdOrderByUpdatedAtDescCreatedAtDesc(Long teamId);

	Optional<SpecDocument> findByTeamIdAndIsMainTrue(Long teamId);
}
