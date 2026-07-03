package com.scrumhelper.domain.retrospective;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "retrospectives")
public class Retrospective {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "author_user_id", nullable = false)
	private User author;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(name = "yesterday_work", columnDefinition = "TEXT")
	private String yesterdayWork;

	@Column(name = "today_plan", columnDefinition = "TEXT")
	private String todayPlan;

	@Column(columnDefinition = "TEXT")
	private String note;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Retrospective() {
	}

	private Retrospective(Team team, User author, String title, String yesterdayWork, String todayPlan, String note) {
		this.team = team;
		this.author = author;
		this.title = title;
		this.yesterdayWork = yesterdayWork;
		this.todayPlan = todayPlan;
		this.note = note;
	}

	public static Retrospective create(Team team, User author, String title, String yesterdayWork, String todayPlan, String note) {
		return new Retrospective(team, author, title, yesterdayWork, todayPlan, note);
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

	public User getAuthor() {
		return author;
	}

	public String getTitle() {
		return title;
	}

	public String getYesterdayWork() {
		return yesterdayWork;
	}

	public String getTodayPlan() {
		return todayPlan;
	}

	public String getNote() {
		return note;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void update(String title, String yesterdayWork, String todayPlan, String note) {
		this.title = title;
		this.yesterdayWork = yesterdayWork;
		this.todayPlan = todayPlan;
		this.note = note;
	}
}
