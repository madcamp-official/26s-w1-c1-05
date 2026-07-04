<<<<<<< HEAD
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
=======
import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
import * as teamApi from '../../api/teamApi';
import { Alert, Avatar, Badge, Button, LoadingState } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TeamDetail, TeamMember } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function TeamMembersPage() {
  const { teamId } = useParams();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const numericTeamId = Number(teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLeader = team?.myRole === 'LEADER';

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
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
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load members.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleTransferLeader(member: TeamMember) {
    if (!window.confirm(`Make ${member.user.name} the team leader?`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.transferLeader(numericTeamId, member.user.id);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not change the team leader.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveMember(member: TeamMember) {
    if (!window.confirm(`Remove ${member.user.name} from the team?`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.removeMember(numericTeamId, member.id);
      await loadPage();
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not remove the member.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading members…" />;
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Members</h1>
        <p className="page-subtitle">People with access to this team.</p>
      </div>

      {!isLeader && (
        <div className="readonly-note">Only the team leader can reassign leadership or remove members.</div>
      )}

      <Alert message={errorMessage} />

      <div className="members-list">
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
        {members.map((member) => (
          <div className="member-row" key={member.id}>
            <Avatar name={member.user.name} size="lg" />
            <div className="member-info">
              <div className="member-name">{member.user.name}</div>
              <div className="member-email">{member.user.email}</div>
            </div>
            <Badge variant="outline">{member.role}</Badge>
            <div className="member-actions">
              {isLeader && member.role !== 'LEADER' && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => void handleTransferLeader(member)}
                  >
                    Make leader
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => void handleRemoveMember(member)}
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
