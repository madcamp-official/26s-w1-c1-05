package com.scrumhelper.domain.team;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
		name = "team_members",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_team_members_team_user", columnNames = {"team_id", "user_id"})
		}
)
public class TeamMember {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TeamRole role;

	@Column(name = "joined_at", nullable = false, updatable = false)
	private LocalDateTime joinedAt;

	protected TeamMember() {
	}

	private TeamMember(Team team, User user, TeamRole role) {
		this.team = team;
		this.user = user;
		this.role = role;
	}

	public static TeamMember create(Team team, User user, TeamRole role) {
		return new TeamMember(team, user, role);
	}

	@PrePersist
	void prePersist() {
		joinedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Team getTeam() {
		return team;
	}

	public User getUser() {
		return user;
	}

	public TeamRole getRole() {
		return role;
	}

	public LocalDateTime getJoinedAt() {
		return joinedAt;
	}

	public void changeRole(TeamRole role) {
		this.role = role;
	}
}
