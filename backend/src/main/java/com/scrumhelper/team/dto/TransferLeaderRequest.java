package com.scrumhelper.team.dto;

import jakarta.validation.constraints.NotNull;

public record TransferLeaderRequest(
		@NotNull(message = "새 팀장을 선택하세요.")
		Long newLeaderUserId
) {
}
