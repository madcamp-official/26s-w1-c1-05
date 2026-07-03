package com.scrumhelper.team.dto;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.domain.team.TeamMember;
import com.scrumhelper.domain.team.TeamRole;

import java.time.LocalDateTime;

public record TeamMemberResponse(
		Long id,
		Long teamId,
		UserSummaryResponse user,
		TeamRole role,
		LocalDateTime joinedAt
) {
	public static TeamMemberResponse from(TeamMember member) {
		return new TeamMemberResponse(
				member.getId(),
				member.getTeam().getId(),
				UserSummaryResponse.from(member.getUser()),
				member.getRole(),
				member.getJoinedAt()
		);
	}
}
