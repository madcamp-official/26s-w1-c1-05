package com.scrumhelper.task;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.task.dto.AddTaskDependencyRequest;
import com.scrumhelper.task.dto.TaskDependencyResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskDependencyController {
	private final TaskDependencyService taskDependencyService;

	public TaskDependencyController(TaskDependencyService taskDependencyService) {
		this.taskDependencyService = taskDependencyService;
	}

	@GetMapping("/teams/{teamId}/task-dependencies")
	public ApiResponse<List<TaskDependencyResponse>> getDependencies(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(taskDependencyService.getDependencies(currentUserId(authentication), teamId));
	}

	@PostMapping("/tasks/{taskId}/dependencies")
	public ResponseEntity<ApiResponse<TaskDependencyResponse>> addDependency(
			@PathVariable Long taskId,
			@Valid @RequestBody AddTaskDependencyRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(taskDependencyService.addDependency(
						currentUserId(authentication),
						taskId,
						request
				)));
	}

	@DeleteMapping("/tasks/{taskId}/dependencies/{predecessorTaskId}")
	public ApiResponse<Void> removeDependency(
			@PathVariable Long taskId,
			@PathVariable Long predecessorTaskId,
			Authentication authentication
	) {
		taskDependencyService.removeDependency(currentUserId(authentication), taskId, predecessorTaskId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
