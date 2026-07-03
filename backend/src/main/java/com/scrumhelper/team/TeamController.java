package com.scrumhelper.team;

import com.scrumhelper.common.ApiResponse;
import com.scrumhelper.team.dto.CreateTeamRequest;
import com.scrumhelper.team.dto.JoinTeamRequest;
import com.scrumhelper.team.dto.TeamDashboardResponse;
import com.scrumhelper.team.dto.TeamDetailResponse;
import com.scrumhelper.team.dto.TeamMemberResponse;
import com.scrumhelper.team.dto.TeamPasswordResponse;
import com.scrumhelper.team.dto.TeamSummaryResponse;
import com.scrumhelper.team.dto.TransferLeaderRequest;
import com.scrumhelper.team.dto.TransferLeaderResponse;
import com.scrumhelper.team.dto.UpdateTeamPasswordRequest;
import com.scrumhelper.team.dto.UpdateTeamRequest;
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
@RequestMapping("/api/teams")
public class TeamController {
	private final TeamService teamService;

	public TeamController(TeamService teamService) {
		this.teamService = teamService;
	}

	@GetMapping
	public ApiResponse<List<TeamSummaryResponse>> getTeams(
			@RequestParam(required = false) String keyword,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.getTeams(currentUserId(authentication), keyword));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<TeamDetailResponse>> createTeam(
			@Valid @RequestBody CreateTeamRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(teamService.createTeam(currentUserId(authentication), request)));
	}

	@GetMapping("/{teamId}")
	public ApiResponse<TeamDetailResponse> getTeam(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.getTeam(currentUserId(authentication), teamId));
	}

	@GetMapping("/{teamId}/dashboard")
	public ApiResponse<TeamDashboardResponse> getDashboard(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.getDashboard(currentUserId(authentication), teamId));
	}

	@PostMapping("/{teamId}/join")
	public ResponseEntity<ApiResponse<TeamMemberResponse>> joinTeam(
			@PathVariable Long teamId,
			@RequestBody(required = false) JoinTeamRequest request,
			Authentication authentication
	) {
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.created(teamService.joinTeam(currentUserId(authentication), teamId, request)));
	}

	@GetMapping("/{teamId}/members")
	public ApiResponse<List<TeamMemberResponse>> getMembers(
			@PathVariable Long teamId,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.getMembers(currentUserId(authentication), teamId));
	}

	@PatchMapping("/{teamId}")
	public ApiResponse<TeamDetailResponse> updateTeam(
			@PathVariable Long teamId,
			@Valid @RequestBody UpdateTeamRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.updateTeam(currentUserId(authentication), teamId, request));
	}

	@PatchMapping("/{teamId}/password")
	public ApiResponse<TeamPasswordResponse> updatePassword(
			@PathVariable Long teamId,
			@RequestBody UpdateTeamPasswordRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.updatePassword(currentUserId(authentication), teamId, request));
	}

	@PatchMapping("/{teamId}/leader")
	public ApiResponse<TransferLeaderResponse> transferLeader(
			@PathVariable Long teamId,
			@Valid @RequestBody TransferLeaderRequest request,
			Authentication authentication
	) {
		return ApiResponse.ok(teamService.transferLeader(currentUserId(authentication), teamId, request));
	}

	@DeleteMapping("/{teamId}/members/{memberId}")
	public ApiResponse<Void> removeMember(
			@PathVariable Long teamId,
			@PathVariable Long memberId,
			Authentication authentication
	) {
		teamService.removeMember(currentUserId(authentication), teamId, memberId);
		return ApiResponse.deleted();
	}

	private Long currentUserId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
