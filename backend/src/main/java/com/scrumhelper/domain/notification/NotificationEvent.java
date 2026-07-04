package com.scrumhelper.domain.notification;

import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
		name = "notification_events",
		uniqueConstraints = {
				@UniqueConstraint(
						name = "uk_notification_events_task_dependency",
						columnNames = {"recipient_user_id", "type", "source_task_id", "target_task_id"}
				)
		}
)
public class NotificationEvent {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "recipient_user_id", nullable = false)
	private User recipient;

	@Column(nullable = false, length = 50)
	private String type;

	@Column(name = "source_task_id")
	private Long sourceTaskId;

	@Column(name = "target_task_id")
	private Long targetTaskId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String payload;

	@Column(nullable = false)
	private boolean delivered;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected NotificationEvent() {
	}

	private NotificationEvent(
			Team team,
			User recipient,
			String type,
			Long sourceTaskId,
			Long targetTaskId,
			String payload
	) {
		this.team = team;
		this.recipient = recipient;
		this.type = type;
		this.sourceTaskId = sourceTaskId;
		this.targetTaskId = targetTaskId;
		this.payload = payload;
		this.delivered = false;
	}

	public static NotificationEvent create(
			Team team,
			User recipient,
			String type,
			Long sourceTaskId,
			Long targetTaskId,
			String payload
	) {
		return new NotificationEvent(team, recipient, type, sourceTaskId, targetTaskId, payload);
	}

	@PrePersist
	void prePersist() {
		createdAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Team getTeam() {
		return team;
	}

	public User getRecipient() {
		return recipient;
	}

	public String getType() {
		return type;
	}

	public Long getSourceTaskId() {
		return sourceTaskId;
	}

	public Long getTargetTaskId() {
		return targetTaskId;
	}

	public String getPayload() {
		return payload;
	}

	public boolean isDelivered() {
		return delivered;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
