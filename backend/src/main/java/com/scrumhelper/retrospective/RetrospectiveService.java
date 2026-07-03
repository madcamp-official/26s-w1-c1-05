package com.scrumhelper.retrospective;

import com.scrumhelper.auth.dto.UserSummaryResponse;
import com.scrumhelper.common.BusinessException;
import com.scrumhelper.common.ErrorCode;
import com.scrumhelper.domain.retrospective.Retrospective;
import com.scrumhelper.domain.retrospective.RetrospectiveCollaborator;
import com.scrumhelper.domain.retrospective.RetrospectiveCollaboratorRepository;
import com.scrumhelper.domain.retrospective.RetrospectiveRepository;
import com.scrumhelper.domain.team.Team;
import com.scrumhelper.domain.team.TeamMemberRepository;
import com.scrumhelper.domain.team.TeamRepository;
import com.scrumhelper.domain.user.User;
import com.scrumhelper.domain.user.UserRepository;
import com.scrumhelper.retrospective.dto.RetrospectiveResponse;
import com.scrumhelper.retrospective.dto.SaveRetrospectiveRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RetrospectiveService {
	private final RetrospectiveRepository retrospectiveRepository;
	private final RetrospectiveCollaboratorRepository retrospectiveCollaboratorRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public RetrospectiveService(
			RetrospectiveRepository retrospectiveRepository,
			RetrospectiveCollaboratorRepository retrospectiveCollaboratorRepository,
			TeamRepository teamRepository,
			TeamMemberRepository teamMemberRepository,
			UserRepository userRepository
	) {
		this.retrospectiveRepository = retrospectiveRepository;
		this.retrospectiveCollaboratorRepository = retrospectiveCollaboratorRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<RetrospectiveResponse> getRetrospectives(
			Long currentUserId,
			Long teamId,
			Long authorId,
			Long collaboratorId
	) {
		requireMembership(teamId, currentUserId);
		return retrospectiveRepository.findAll(buildSpecification(teamId, authorId, collaboratorId)).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public RetrospectiveResponse createRetrospective(Long currentUserId, Long teamId, SaveRetrospectiveRequest request) {
		Team team = findTeam(teamId);
		requireMembership(teamId, currentUserId);
		User author = findUser(currentUserId);
		validateCollaborators(teamId, currentUserId, request.collaboratorUserIds());

		Retrospective retrospective = retrospectiveRepository.save(Retrospective.create(
				team,
				author,
				request.title().trim(),
				normalizeOptionalText(request.yesterdayWork()),
				normalizeOptionalText(request.todayPlan()),
				normalizeOptionalText(request.note())
		));
		replaceCollaborators(retrospective, team, request.collaboratorUserIds());
		return toResponse(retrospective);
	}

	@Transactional(readOnly = true)
	public RetrospectiveResponse getRetrospective(Long currentUserId, Long retrospectiveId) {
		Retrospective retrospective = findRetrospective(retrospectiveId);
		requireMembership(retrospective.getTeam().getId(), currentUserId);
		return toResponse(retrospective);
	}

	@Transactional
	public RetrospectiveResponse updateRetrospective(Long currentUserId, Long retrospectiveId, SaveRetrospectiveRequest request) {
		Retrospective retrospective = findRetrospective(retrospectiveId);
		Team team = retrospective.getTeam();
		requireMembership(team.getId(), currentUserId);
		requireEditor(retrospective, currentUserId);
		validateCollaborators(team.getId(), retrospective.getAuthor().getId(), request.collaboratorUserIds());

		retrospective.update(
				request.title().trim(),
				normalizeOptionalText(request.yesterdayWork()),
				normalizeOptionalText(request.todayPlan()),
				normalizeOptionalText(request.note())
		);
		replaceCollaborators(retrospective, team, request.collaboratorUserIds());
		return toResponse(retrospective);
	}

	@Transactional
	public void deleteRetrospective(Long currentUserId, Long retrospectiveId) {
		Retrospective retrospective = findRetrospective(retrospectiveId);
		requireMembership(retrospective.getTeam().getId(), currentUserId);
		requireEditor(retrospective, currentUserId);
		retrospectiveCollaboratorRepository.deleteByRetrospectiveId(retrospectiveId);
		retrospectiveRepository.delete(retrospective);
	}

	private Specification<Retrospective> buildSpecification(Long teamId, Long authorId, Long collaboratorId) {
		return (root, query, criteriaBuilder) -> {
			query.distinct(true);
			var predicate = criteriaBuilder.equal(root.get("team").get("id"), teamId);
			if (authorId != null) {
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("author").get("id"), authorId));
			}
			if (collaboratorId != null) {
				var subquery = query.subquery(Long.class);
				var collaborator = subquery.from(RetrospectiveCollaborator.class);
				subquery.select(collaborator.get("retrospective").get("id"))
						.where(
								criteriaBuilder.equal(collaborator.get("retrospective").get("id"), root.get("id")),
								criteriaBuilder.equal(collaborator.get("user").get("id"), collaboratorId)
						);
				predicate = criteriaBuilder.and(predicate, criteriaBuilder.exists(subquery));
			}
			return predicate;
		};
	}

	private void replaceCollaborators(Retrospective retrospective, Team team, List<Long> collaboratorUserIds) {
		retrospectiveCollaboratorRepository.deleteByRetrospectiveId(retrospective.getId());
		retrospectiveCollaboratorRepository.flush();
		if (collaboratorUserIds == null || collaboratorUserIds.isEmpty()) {
			return;
		}
		collaboratorUserIds.stream()
				.distinct()
				.map(this::findUser)
				.map(user -> RetrospectiveCollaborator.create(retrospective, team, user))
				.forEach(retrospectiveCollaboratorRepository::save);
	}

	private void validateCollaborators(Long teamId, Long authorId, List<Long> collaboratorUserIds) {
		if (collaboratorUserIds == null || collaboratorUserIds.isEmpty()) {
			return;
		}
		boolean includesAuthor = collaboratorUserIds.stream()
				.distinct()
				.anyMatch(authorId::equals);
		if (includesAuthor) {
			throw new BusinessException(ErrorCode.AUTHOR_CANNOT_BE_COLLABORATOR);
		}
		boolean hasInvalidCollaborator = collaboratorUserIds.stream()
				.distinct()
				.anyMatch(userId -> !teamMemberRepository.existsByTeamIdAndUserId(teamId, userId));
		if (hasInvalidCollaborator) {
			throw new BusinessException(ErrorCode.COLLABORATOR_NOT_TEAM_MEMBER);
		}
	}

	private RetrospectiveResponse toResponse(Retrospective retrospective) {
		List<UserSummaryResponse> collaborators = retrospectiveCollaboratorRepository.findByRetrospectiveId(retrospective.getId()).stream()
				.map(collaborator -> UserSummaryResponse.from(collaborator.getUser()))
				.toList();
		return RetrospectiveResponse.from(retrospective, collaborators);
	}

	private Team findTeam(Long teamId) {
		return teamRepository.findById(teamId)
				.orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
	}

	private Retrospective findRetrospective(Long retrospectiveId) {
		return retrospectiveRepository.findById(retrospectiveId)
				.orElseThrow(() -> new BusinessException(ErrorCode.RETROSPECTIVE_NOT_FOUND));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
	}

	private void requireMembership(Long teamId, Long userId) {
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new BusinessException(ErrorCode.NOT_TEAM_MEMBER);
		}
	}

	private void requireEditor(Retrospective retrospective, Long userId) {
		if (retrospective.getAuthor().getId().equals(userId)) {
			return;
		}
		if (!retrospectiveCollaboratorRepository.existsByRetrospectiveIdAndUserId(retrospective.getId(), userId)) {
			throw new BusinessException(ErrorCode.RETROSPECTIVE_EDITOR_ONLY);
		}
	}

	private String normalizeOptionalText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
