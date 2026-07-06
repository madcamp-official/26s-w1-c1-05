package com.scrumhelper.domain.task;

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
		name = "user_todo_tasks",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_user_todo_tasks_team_user_task", columnNames = {"team_id", "user_id", "task_id"})
		}
)
public class UserTodoTask {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "task_id", nullable = false)
	private Task task;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected UserTodoTask() {
	}

	private UserTodoTask(Team team, User user, Task task, int sortOrder) {
		this.team = team;
		this.user = user;
		this.task = task;
		this.sortOrder = sortOrder;
	}

	public static UserTodoTask create(Team team, User user, Task task, int sortOrder) {
		return new UserTodoTask(team, user, task, sortOrder);
	}

	@PrePersist
	void prePersist() {
		createdAt = LocalDateTime.now();
	}

	public Task getTask() {
		return task;
	}

	public int getSortOrder() {
		return sortOrder;
	}
}
