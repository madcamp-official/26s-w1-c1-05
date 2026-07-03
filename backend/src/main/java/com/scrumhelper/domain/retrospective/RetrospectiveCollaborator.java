package com.scrumhelper.domain.retrospective;

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
		name = "retrospective_collaborators",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_retrospective_collaborators_retrospective_user", columnNames = {"retrospective_id", "user_id"})
		}
)
public class RetrospectiveCollaborator {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "retrospective_id", nullable = false)
	private Retrospective retrospective;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	protected RetrospectiveCollaborator() {
	}

	private RetrospectiveCollaborator(Retrospective retrospective, Team team, User user) {
		this.retrospective = retrospective;
		this.team = team;
		this.user = user;
	}

	public static RetrospectiveCollaborator create(Retrospective retrospective, Team team, User user) {
		return new RetrospectiveCollaborator(retrospective, team, user);
	}

	public Long getId() {
		return id;
	}

	public Retrospective getRetrospective() {
		return retrospective;
	}

	public Team getTeam() {
		return team;
	}

	public User getUser() {
		return user;
	}
}
