package com.scrumhelper.task;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.task.dto.SaveTodoListRequest;
import com.scrumhelper.task.dto.TodoListResponse;
import com.scrumhelper.task.dto.TodoPromptResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams/{teamId}/todos")
public class UserTodoController {
	private final UserTodoService userTodoService;

	public UserTodoController(UserTodoService userTodoService) {
		this.userTodoService = userTodoService;
	}

	@GetMapping
	public ApiResponse<TodoListResponse> getTodoList(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(userTodoService.getTodoList(currentUserId(authentication), teamId));
	}

	@PutMapping
	public ApiResponse<TodoListResponse> updateTodoList(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveTodoListRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(userTodoService.updateTodoList(currentUserId(authentication), teamId, request));
	}

	@PatchMapping
	public ApiResponse<TodoListResponse> patchTodoList(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveTodoListRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(userTodoService.updateTodoList(currentUserId(authentication), teamId, request));
	}

	@PostMapping("/prompt")
	public ApiResponse<TodoPromptResponse> generateCompletionPrompt(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(userTodoService.generateCompletionPrompt(currentUserId(authentication), teamId));
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
