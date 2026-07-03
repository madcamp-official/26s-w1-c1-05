package com.scrumhelper.domain.meeting;

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
@Table(name = "meetings")
public class Meeting {
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

	@Column(name = "meeting_at", nullable = false)
	private LocalDateTime meetingAt;

	@Column(name = "raw_content", columnDefinition = "TEXT")
	private String rawContent;

	@Column(columnDefinition = "TEXT")
	private String summary;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Meeting() {
	}

	private Meeting(Team team, User author, String title, LocalDateTime meetingAt, String rawContent, String summary) {
		this.team = team;
		this.author = author;
		this.title = title;
		this.meetingAt = meetingAt;
		this.rawContent = rawContent;
		this.summary = summary;
	}

	public static Meeting create(Team team, User author, String title, LocalDateTime meetingAt, String rawContent, String summary) {
		return new Meeting(team, author, title, meetingAt, rawContent, summary);
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

	public LocalDateTime getMeetingAt() {
		return meetingAt;
	}

	public String getRawContent() {
		return rawContent;
	}

	public String getSummary() {
		return summary;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void update(String title, LocalDateTime meetingAt, String rawContent, String summary) {
		this.title = title;
		this.meetingAt = meetingAt;
		this.rawContent = rawContent;
		this.summary = summary;
	}
}
