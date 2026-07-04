package com.scrumhelper.domain.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {
	boolean existsByRecipientIdAndTypeAndSourceTaskIdAndTargetTaskId(
			Long recipientUserId,
			String type,
			Long sourceTaskId,
			Long targetTaskId
	);

	List<NotificationEvent> findByTeamIdAndRecipientIdOrderByCreatedAtDesc(Long teamId, Long recipientUserId);
}
