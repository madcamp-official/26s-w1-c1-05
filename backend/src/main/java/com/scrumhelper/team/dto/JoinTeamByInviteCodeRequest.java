package com.scrumhelper.team.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinTeamByInviteCodeRequest(
		@NotBlank(message = "초대코드를 입력하세요.")
		String inviteCode
) {
}
