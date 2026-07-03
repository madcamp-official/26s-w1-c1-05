package com.scrumhelper.task;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.task.dto.SaveCommentRequest;
import com.scrumhelper.task.dto.TaskCommentResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskCommentController {
	private final TaskCommentService taskCommentService;

	public TaskCommentController(TaskCommentService taskCommentService) {
		this.taskCommentService = taskCommentService;
	}

	@GetMapping("/tasks/{taskId}/comments")
	public ApiResponse<List<TaskCommentResponse>> getComments(
			@PathVariable Long taskId,
			Authentication authentication
	) {
		return ApiResponse.ok(taskCommentService.getComments(currentUserId(authentication), taskId));
	}

	@PostMapping("/tasks/{taskId}/comments")
	public ResponseEntity<ApiResponse<TaskCommentResponse>> createComment(
			@PathVariable Long taskId,
			@Valid @RequestBody SaveCommentRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(taskCommentService.createComment(currentUserId(authentication), taskId, request)));
	}

	@PatchMapping("/comments/{commentId}")
	public ApiResponse<TaskCommentResponse> updateComment(
			@PathVariable Long commentId,
			@Valid @RequestBody SaveCommentRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(taskCommentService.updateComment(currentUserId(authentication), commentId, request));
	}

	@DeleteMapping("/comments/{commentId}")
	public ApiResponse<Void> deleteComment(
			@PathVariable Long commentId,
			Authentication authentication
	) {
		taskCommentService.deleteComment(currentUserId(authentication), commentId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
