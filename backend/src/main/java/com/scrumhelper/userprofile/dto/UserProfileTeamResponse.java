package com.scrumhelper.userprofile.dto;

import com.scrumhelper.task.dto.TaskResponse;

import java.util.List;

public record UserProfileTeamResponse(
		Long teamId,
		String teamName,
		String role,
		long completedTaskCount,
		List<TaskResponse> tasks
) {
}
