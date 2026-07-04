import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamDetail, TeamMember } from '../../types/team';

export function TeamMembersPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLeader = team?.myRole === 'LEADER';

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('팀 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [teamData, memberData] = await Promise.all([
        teamApi.getTeam(numericTeamId),
        teamApi.getMembers(numericTeamId),
      ]);
      setTeam(teamData);
      setMembers(memberData);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : '팀원 목록을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleTransferLeader(member: TeamMember) {
    if (!window.confirm(`${member.user.name}님에게 팀장을 위임할까요?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.transferLeader(numericTeamId, member.user.id);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '팀장을 변경하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    if (!window.confirm(`${member.user.name}님을 팀에서 제거할까요?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.removeMember(numericTeamId, member.id);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '팀원을 제거하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="팀원 목록을 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Members</span>
          <h1>팀원 관리</h1>
          <p className="muted">
            Team #{teamId}에 가입한 사용자입니다. 팀장만 팀장 변경과 팀원 제거를 할 수 있습니다.
          </p>
        </div>
        <span className="soft-pill">{members.length}명</span>
      </div>
      <ErrorMessage message={errorMessage} />
      <div className="member-list">
        {members.map((member) => (
          <article className="member-row" key={member.id}>
            <div>
              <strong>{member.user.name}</strong>
              <p className="muted">{member.user.email}</p>
            </div>
            <div className="row-actions">
              <span className="badge">{member.role}</span>
              {isLeader && member.role !== 'LEADER' && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => void handleTransferLeader(member)}
                  >
                    팀장 변경
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isSubmitting}
                    onClick={() => void handleRemoveMember(member)}
                  >
                    제거
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
