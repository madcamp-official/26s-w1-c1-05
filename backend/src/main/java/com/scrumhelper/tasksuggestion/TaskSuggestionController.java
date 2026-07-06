package com.scrumhelper.tasksuggestion;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.tasksuggestion.dto.AcceptTaskSuggestionRequest;
import com.scrumhelper.tasksuggestion.dto.TaskSuggestionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskSuggestionController {
	private final TaskSuggestionService taskSuggestionService;

	public TaskSuggestionController(TaskSuggestionService taskSuggestionService) {
		this.taskSuggestionService = taskSuggestionService;
	}

	@GetMapping("/teams/{teamId}/task-suggestions")
	public ApiResponse<List<TaskSuggestionResponse>> getQueuedSuggestions(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(taskSuggestionService.getQueuedSuggestions(currentUserId(authentication), teamId));
	}

	@PostMapping("/task-suggestions/{suggestionId}/accept")
	public ResponseEntity<ApiResponse<TaskResponse>> acceptSuggestion(
			@PathVariable Long suggestionId,
			@Valid @RequestBody AcceptTaskSuggestionRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(taskSuggestionService.acceptSuggestion(
						currentUserId(authentication),
						suggestionId,
						request
				)));
	}

	@PostMapping("/task-suggestions/{suggestionId}/dismiss")
	public ApiResponse<Void> dismissSuggestion(
			@PathVariable Long suggestionId,
			Authentication authentication
	) {
		taskSuggestionService.dismissSuggestion(currentUserId(authentication), suggestionId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
