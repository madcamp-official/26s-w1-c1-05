package com.scrumhelper.domain.task;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {
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

	@Column(columnDefinition = "TEXT")
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TaskPriority priority;

	@Column(name = "due_date", nullable = false)
	private LocalDate dueDate;

	@Column(nullable = false)
	private boolean completed;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private TaskStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Task() {
	}

	private Task(Team team, User createdBy, String title, String description, TaskPriority priority, LocalDate dueDate) {
		this.team = team;
		this.createdBy = createdBy;
		this.title = title;
		this.description = description;
		this.priority = priority;
		this.dueDate = dueDate;
		this.completed = false;
		this.status = TaskStatus.BACKLOG;
	}

	public static Task create(Team team, User createdBy, String title, String description, TaskPriority priority, LocalDate dueDate) {
		return new Task(team, createdBy, title, description, priority, dueDate);
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

	public String getDescription() {
		return description;
	}

	public TaskPriority getPriority() {
		return priority;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	public boolean isCompleted() {
		return getStatus() == TaskStatus.DONE;
	}

	public TaskStatus getStatus() {
		return status == null ? (completed ? TaskStatus.DONE : TaskStatus.BACKLOG) : status;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void update(String title, String description, TaskPriority priority, LocalDate dueDate) {
		this.title = title;
		this.description = description;
		this.priority = priority;
		this.dueDate = dueDate;
	}

	public void updateStatus(TaskStatus status) {
		this.status = status;
		this.completed = status == TaskStatus.DONE;
	}
}
