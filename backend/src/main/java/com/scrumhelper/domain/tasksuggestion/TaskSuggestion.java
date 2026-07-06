package com.scrumhelper.domain.tasksuggestion;

import com.scrumhelper.domain.specdocument.SpecDocument;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.domain.team.Team;
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
@Table(name = "task_suggestions")
public class TaskSuggestion {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "spec_document_id", nullable = false)
	private SpecDocument specDocument;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TaskPriority priority;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TaskSuggestionStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected TaskSuggestion() {
	}

	private TaskSuggestion(
			Team team,
			SpecDocument specDocument,
			String title,
			String description,
			TaskPriority priority
	) {
		this.team = team;
		this.specDocument = specDocument;
		this.title = title;
		this.description = description;
		this.priority = priority;
		this.status = TaskSuggestionStatus.PENDING;
	}

	public static TaskSuggestion create(
			Team team,
			SpecDocument specDocument,
			String title,
			String description,
			TaskPriority priority
	) {
		return new TaskSuggestion(team, specDocument, title, description, priority);
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

	public void accept() {
		this.status = TaskSuggestionStatus.ACCEPTED;
	}

	public void dismiss() {
		this.status = TaskSuggestionStatus.DISMISSED;
	}

	public Long getId() {
		return id;
	}

	public Team getTeam() {
		return team;
	}

	public SpecDocument getSpecDocument() {
		return specDocument;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public TaskPriority getPriority() {
		return priority;
	}

	public TaskSuggestionStatus getStatus() {
		return status;
	}

	public boolean isPending() {
		return status == TaskSuggestionStatus.PENDING;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
