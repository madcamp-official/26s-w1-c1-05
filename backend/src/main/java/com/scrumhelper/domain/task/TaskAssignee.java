package com.scrumhelper.domain.task;

import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "task_assignees",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_task_assignees_task_user", columnNames = {"task_id", "user_id"})
		}
)
public class TaskAssignee {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "task_id", nullable = false)
	private Task task;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	protected TaskAssignee() {
	}

	private TaskAssignee(Task task, Team team, User user) {
		this.task = task;
		this.team = team;
		this.user = user;
	}

	public static TaskAssignee create(Task task, Team team, User user) {
		return new TaskAssignee(task, team, user);
	}

	public Long getId() {
		return id;
	}

	public Task getTask() {
		return task;
	}

	public Team getTeam() {
		return team;
	}

	public User getUser() {
		return user;
	}
}
