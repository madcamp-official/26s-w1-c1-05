package com.scrumhelper.task;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.domain.task.TaskPriority;
import com.scrumhelper.task.dto.AcceptAiTaskRecommendationRequest;
import com.scrumhelper.task.dto.AiTaskRecommendationResponse;
import com.scrumhelper.task.dto.SaveTaskRequest;
import com.scrumhelper.task.dto.TaskResponse;
import com.scrumhelper.task.dto.TaskStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {
	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@GetMapping("/teams/{teamId}/tasks")
	public ApiResponse<List<TaskResponse>> getTasks(
			@PathVariable Long teamId,
			@RequestParam(required = false) Boolean completed,
			@RequestParam(required = false) TaskPriority priority,
			@RequestParam(required = false) Long assigneeId,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.getTasks(
				currentUserId(authentication),
				teamId,
				completed,
				priority,
				assigneeId
		));
	}

	@PostMapping("/teams/{teamId}/tasks")
	public ResponseEntity<ApiResponse<TaskResponse>> createTask(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveTaskRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(taskService.createTask(currentUserId(authentication), teamId, request)));
	}

	@PostMapping("/teams/{teamId}/tasks/ai-recommendation")
	public ApiResponse<AiTaskRecommendationResponse> generateAiTaskRecommendation(
			@PathVariable Long teamId,
			@RequestParam(required = false) List<Long> excludeTaskIds,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.generateAiTaskRecommendation(
				currentUserId(authentication),
				teamId,
				excludeTaskIds
		));
	}

	@PostMapping("/teams/{teamId}/tasks/ai-recommendation/accept")
	public ApiResponse<TaskResponse> acceptAiTaskRecommendation(
			@PathVariable Long teamId,
			@Valid @RequestBody AcceptAiTaskRecommendationRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.acceptAiTaskRecommendation(
				currentUserId(authentication),
				teamId,
				request
		));
	}

	@GetMapping("/teams/{teamId}/tasks/my")
	public ApiResponse<List<TaskResponse>> getMyTasks(
			@PathVariable Long teamId,
			@RequestParam(required = false) Boolean completed,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.getMyTasks(currentUserId(authentication), teamId, completed));
	}

	@GetMapping("/tasks/{taskId}")
	public ApiResponse<TaskResponse> getTask(
			@PathVariable Long taskId,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.getTask(currentUserId(authentication), taskId));
	}

	@PatchMapping("/tasks/{taskId}")
	public ApiResponse<TaskResponse> updateTask(
			@PathVariable Long taskId,
			@Valid @RequestBody SaveTaskRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.updateTask(currentUserId(authentication), taskId, request));
	}

	@PatchMapping("/tasks/{taskId}/status")
	public ApiResponse<TaskResponse> updateStatus(
			@PathVariable Long taskId,
			@Valid @RequestBody TaskStatusRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(taskService.updateStatus(currentUserId(authentication), taskId, request));
	}

	@DeleteMapping("/tasks/{taskId}")
	public ApiResponse<Void> deleteTask(
			@PathVariable Long taskId,
			Authentication authentication
	) {
		taskService.deleteTask(currentUserId(authentication), taskId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
