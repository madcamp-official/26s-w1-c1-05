package com.scrumhelper.domain.team;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "teams")
public class Team {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 100)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(name = "password_hash", length = 255)
	private String passwordHash;

	@Column(name = "invite_code", unique = true, length = 16)
	private String inviteCode;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "leader_user_id", nullable = false)
	private User leader;

	@Column(name = "ended_at")
	private LocalDateTime endedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Team() {
	}

	private Team(String name, String description, String passwordHash, String inviteCode, User leader) {
		this.name = name;
		this.description = description;
		this.passwordHash = passwordHash;
		this.inviteCode = inviteCode;
		this.leader = leader;
	}

	public static Team create(String name, String description, String passwordHash, String inviteCode, User leader) {
		return new Team(name, description, passwordHash, inviteCode, leader);
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

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getInviteCode() {
		return inviteCode;
	}

	public User getLeader() {
		return leader;
	}

	public LocalDateTime getEndedAt() {
		return endedAt;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public boolean hasPassword() {
		return passwordHash != null && !passwordHash.isBlank();
	}

	public void updateInfo(String name, String description) {
		this.name = name;
		this.description = description;
	}

	public void updatePasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void updateInviteCode(String inviteCode) {
		this.inviteCode = inviteCode;
	}

	public void changeLeader(User leader) {
		this.leader = leader;
	}

	public void markEnded() {
		if (endedAt == null) {
			endedAt = LocalDateTime.now();
		}
	}
}
