package com.scrumhelper.domain.meeting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
	List<Meeting> findByTeamIdOrderByMeetingAtDescCreatedAtDesc(Long teamId);
}
