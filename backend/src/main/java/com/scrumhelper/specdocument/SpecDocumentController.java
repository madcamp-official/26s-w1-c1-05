package com.scrumhelper.specdocument;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.specdocument.dto.GenerateSpecDraftRequest;
import com.scrumhelper.specdocument.dto.SaveSpecDocumentRequest;
import com.scrumhelper.specdocument.dto.SpecDocumentResponse;
import com.scrumhelper.specdocument.dto.SpecDraftResponse;
import com.scrumhelper.specdocument.dto.UpdateSpecDocumentRequest;
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
public class SpecDocumentController {
	private final SpecDocumentService specDocumentService;

	public SpecDocumentController(SpecDocumentService specDocumentService) {
		this.specDocumentService = specDocumentService;
	}

	@GetMapping("/teams/{teamId}/spec-documents")
	public ApiResponse<List<SpecDocumentResponse>> getSpecDocuments(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(specDocumentService.getSpecDocuments(currentUserId(authentication), teamId));
	}

	@PostMapping("/teams/{teamId}/spec-documents/draft")
	public ApiResponse<SpecDraftResponse> generateDraft(
			@PathVariable Long teamId,
			@Valid @RequestBody GenerateSpecDraftRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(specDocumentService.generateDraft(currentUserId(authentication), teamId, request));
	}

	@PostMapping("/teams/{teamId}/spec-documents")
	public ResponseEntity<ApiResponse<SpecDocumentResponse>> createSpecDocument(
			@PathVariable Long teamId,
			@Valid @RequestBody SaveSpecDocumentRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(specDocumentService.createSpecDocument(currentUserId(authentication), teamId, request)));
	}

	@GetMapping("/spec-documents/{documentId}")
	public ApiResponse<SpecDocumentResponse> getSpecDocument(
			@PathVariable Long documentId,
			Authentication authentication
	) {
		return ApiResponse.ok(specDocumentService.getSpecDocument(currentUserId(authentication), documentId));
	}

	@PatchMapping("/spec-documents/{documentId}")
	public ApiResponse<SpecDocumentResponse> updateSpecDocument(
			@PathVariable Long documentId,
			@Valid @RequestBody UpdateSpecDocumentRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(specDocumentService.updateSpecDocument(currentUserId(authentication), documentId, request));
	}

	@DeleteMapping("/spec-documents/{documentId}")
	public ApiResponse<Void> deleteSpecDocument(
			@PathVariable Long documentId,
			Authentication authentication
	) {
		specDocumentService.deleteSpecDocument(currentUserId(authentication), documentId);
		return ApiResponse.deleted();
	}

	@PatchMapping("/spec-documents/{documentId}/main")
	public ApiResponse<SpecDocumentResponse> setMainSpecDocument(
			@PathVariable Long documentId,
			Authentication authentication
	) {
		return ApiResponse.ok(specDocumentService.setMainSpecDocument(currentUserId(authentication), documentId));
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
