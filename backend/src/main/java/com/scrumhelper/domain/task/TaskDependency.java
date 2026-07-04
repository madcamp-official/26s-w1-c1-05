package com.scrumhelper.domain.task;

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
		name = "task_dependencies",
		uniqueConstraints = {
				@UniqueConstraint(
						name = "uk_task_dependencies_predecessor_successor",
						columnNames = {"predecessor_task_id", "successor_task_id"}
				)
		}
)
public class TaskDependency {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "predecessor_task_id", nullable = false)
	private Task predecessor;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "successor_task_id", nullable = false)
	private Task successor;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected TaskDependency() {
	}

	private TaskDependency(Task predecessor, Task successor) {
		this.predecessor = predecessor;
		this.successor = successor;
	}

	public static TaskDependency create(Task predecessor, Task successor) {
		return new TaskDependency(predecessor, successor);
	}

	@PrePersist
	void prePersist() {
		createdAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Task getPredecessor() {
		return predecessor;
	}

	public Task getSuccessor() {
		return successor;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
