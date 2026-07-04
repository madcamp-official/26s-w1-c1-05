package com.scrumhelper.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
	VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값을 확인해주세요."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
	EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
	TEAM_NOT_FOUND(HttpStatus.NOT_FOUND, "팀을 찾을 수 없습니다."),
	TEAM_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 팀 이름입니다."),
	NOT_TEAM_MEMBER(HttpStatus.FORBIDDEN, "팀원이 아닙니다."),
	ALREADY_TEAM_MEMBER(HttpStatus.CONFLICT, "이미 가입한 팀입니다."),
	TEAM_PASSWORD_REQUIRED(HttpStatus.BAD_REQUEST, "팀 비밀번호를 입력하세요."),
	INVALID_TEAM_PASSWORD(HttpStatus.UNAUTHORIZED, "팀 비밀번호가 올바르지 않습니다."),
	INVALID_INVITE_CODE(HttpStatus.NOT_FOUND, "초대코드가 올바르지 않습니다."),
	LEADER_ONLY(HttpStatus.FORBIDDEN, "팀장 권한이 필요합니다."),
	CANNOT_REMOVE_SELF(HttpStatus.BAD_REQUEST, "본인은 제거할 수 없습니다."),
	CANNOT_REMOVE_LEADER(HttpStatus.BAD_REQUEST, "팀장은 제거할 수 없습니다."),
	TARGET_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "대상 사용자가 팀원이 아닙니다."),
	ALREADY_LEADER(HttpStatus.CONFLICT, "이미 팀장인 사용자입니다."),
	REASSIGN_TASK_REQUIRED(HttpStatus.CONFLICT, "제거 전에 해당 팀원이 유일 담당자인 task를 재배정해야 합니다."),
	TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "task를 찾을 수 없습니다."),
	ASSIGNEE_REQUIRED(HttpStatus.BAD_REQUEST, "담당자를 1명 이상 선택하세요."),
	ASSIGNEE_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "담당자는 같은 팀의 팀원이어야 합니다."),
	COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
	COMMENT_AUTHOR_ONLY(HttpStatus.FORBIDDEN, "댓글 작성자만 수정하거나 삭제할 수 있습니다."),
	RETROSPECTIVE_NOT_FOUND(HttpStatus.NOT_FOUND, "회고록을 찾을 수 없습니다."),
	RETROSPECTIVE_EDITOR_ONLY(HttpStatus.FORBIDDEN, "회고록 작성자 또는 공동 작업자만 수정하거나 삭제할 수 있습니다."),
	RETROSPECTIVE_AUTHOR_ONLY_FOR_COLLABORATORS(HttpStatus.FORBIDDEN, "회고록 작성자만 공동 작업자를 변경할 수 있습니다."),
	COLLABORATOR_NOT_TEAM_MEMBER(HttpStatus.BAD_REQUEST, "공동 작업자는 같은 팀의 팀원이어야 합니다."),
	AUTHOR_CANNOT_BE_COLLABORATOR(HttpStatus.BAD_REQUEST, "작성자는 공동 작업자로 중복 선택할 수 없습니다."),
	MEETING_NOT_FOUND(HttpStatus.NOT_FOUND, "회의록을 찾을 수 없습니다."),
	MEETING_AUTHOR_OR_LEADER_ONLY(HttpStatus.FORBIDDEN, "회의록 작성자 또는 팀장만 수정하거나 삭제할 수 있습니다."),
	SPEC_DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "스펙 문서를 찾을 수 없습니다."),
	TASK_SUGGESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "task 추천을 찾을 수 없습니다."),
	TASK_SUGGESTION_ALREADY_ACCEPTED(HttpStatus.CONFLICT, "이미 수락한 task 추천입니다."),
	TASK_DEPENDENCY_NOT_FOUND(HttpStatus.NOT_FOUND, "task 관계를 찾을 수 없습니다."),
	TASK_DEPENDENCY_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 존재하는 task 관계입니다."),
	TASK_DEPENDENCY_SELF_REFERENCE(HttpStatus.BAD_REQUEST, "자기 자신을 선행 task로 지정할 수 없습니다."),
	TASK_DEPENDENCY_CYCLE(HttpStatus.CONFLICT, "순환 task 관계는 만들 수 없습니다."),
	TASK_NOT_SAME_TEAM(HttpStatus.BAD_REQUEST, "같은 팀의 task만 관계를 만들 수 있습니다."),
	SPEC_DOCUMENT_AUTHOR_OR_LEADER_ONLY(HttpStatus.FORBIDDEN, "스펙 문서 작성자 또는 팀장만 수정하거나 삭제할 수 있습니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

	private final HttpStatus status;
	private final String defaultMessage;

	ErrorCode(HttpStatus status, String defaultMessage) {
		this.status = status;
		this.defaultMessage = defaultMessage;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getDefaultMessage() {
		return defaultMessage;
	}
}
