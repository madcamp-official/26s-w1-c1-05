package com.scrumhelper.meeting;

import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.meeting.Meeting;
import com.scrumhelper.domain.meeting.MeetingRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.team.TeamRole;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.meeting.dto.MeetingResponse;
import com.scrumhelper.meeting.dto.SaveMeetingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MeetingService {
	private final MeetingRepository meetingRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public MeetingService(
			MeetingRepository meetingRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository
	) {
		this.meetingRepository = meetingRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<MeetingResponse> getMeetings(Long currentUserId, Long teamId) {
		requireMembership(teamId, currentUserId);
		return meetingRepository.findByTeamIdOrderByMeetingAtDescCreatedAtDesc(teamId).stream()
				.map(MeetingResponse::from)
				.toList();
	}

	@Transactional
	public MeetingResponse createMeeting(Long currentUserId, Long teamId, SaveMeetingRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		User author = findUser(currentUserId);
		Meeting meeting = meetingRepository.save(Meeting.create(
				team,
				author,
				request.title().trim(),
				request.meetingAt(),
				normalizeOptionalText(request.rawContent()),
				normalizeOptionalText(request.summary())
		));
		return MeetingResponse.from(meeting);
	}

	@Transactional(readOnly = true)
	public MeetingResponse getMeeting(Long currentUserId, Long meetingId) {
		Meeting meeting = findMeeting(meetingId);
		requireMembership(meeting.getTeam().getId(), currentUserId);
		return MeetingResponse.from(meeting);
	}

	@Transactional
	public MeetingResponse updateMeeting(Long currentUserId, Long meetingId, SaveMeetingRequest request) {
		Meeting meeting = findMeeting(meetingId);
		requireAuthorOrLeader(meeting, currentUserId);
		meeting.update(
				request.title().trim(),
				request.meetingAt(),
				normalizeOptionalText(request.rawContent()),
				normalizeOptionalText(request.summary())
		);
		return MeetingResponse.from(meeting);
	}

	@Transactional
	public void deleteMeeting(Long currentUserId, Long meetingId) {
		Meeting meeting = findMeeting(meetingId);
		requireAuthorOrLeader(meeting, currentUserId);
		meetingRepository.delete(meeting);
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private Meeting findMeeting(Long meetingId) {
		return meetingRepository.findById(meetingId)
				.orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
	}

	private TeamMember requireMembership(Long teamId, Long userId) {
		return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.NOT_TEAM_MEMBER));
	}

	private void requireAuthorOrLeader(Meeting meeting, Long userId) {
		TeamMember membership = requireMembership(meeting.getTeam().getId(), userId);
		if (!meeting.getAuthor().getId().equals(userId) && membership.getRole() != TeamRole.LEADER) {
			throw new BusinessException(ErrorCode.MEETING_AUTHOR_OR_LEADER_ONLY);
		}
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
