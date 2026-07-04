package com.scrumhelper.team.dto;

import jakarta.validation.constraints.NotNull;

public record ReassignAndRemoveMemberRequest(
		@NotNull(message = "대체 담당자를 선택하세요.")
		Long newAssigneeUserId
) {
}
