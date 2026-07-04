package com.scrumhelper.domain.specdocument;

import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "spec_documents")
public class SpecDocument {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "created_by_user_id", nullable = false)
	private User createdBy;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(name = "source_meeting_ids", columnDefinition = "TEXT")
	private String sourceMeetingIds;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SpecDocumentStatus status;

	@Column(name = "is_main", nullable = false)
	private boolean isMain;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected SpecDocument() {
	}

	private SpecDocument(Team team, User createdBy, String title, String content, String sourceMeetingIds) {
		this.team = team;
		this.createdBy = createdBy;
		this.title = title;
		this.content = content;
		this.sourceMeetingIds = sourceMeetingIds;
		this.status = SpecDocumentStatus.CONFIRMED;
		this.isMain = false;
	}

	public static SpecDocument create(Team team, User createdBy, String title, String content, String sourceMeetingIds) {
		return new SpecDocument(team, createdBy, title, content, sourceMeetingIds);
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Team getTeam() {
		return team;
	}

	public User getCreatedBy() {
		return createdBy;
	}

	public String getTitle() {
		return title;
	}

	public String getContent() {
		return content;
	}

	public String getSourceMeetingIds() {
		return sourceMeetingIds;
	}

	public SpecDocumentStatus getStatus() {
		return status;
	}

	public boolean isMain() {
		return isMain;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void update(String title, String content, String sourceMeetingIds) {
		this.title = title;
		this.content = content;
		this.sourceMeetingIds = sourceMeetingIds;
	}

	public void markAsMain() {
		this.isMain = true;
	}

	public void unmarkMain() {
		this.isMain = false;
	}
}
