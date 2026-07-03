import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamDashboard, TeamDetail } from '../../types/team';

export function TeamDashboardPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!Number.isFinite(numericTeamId)) {
        setErrorMessage('팀 정보가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [teamData, dashboardData] = await Promise.all([
          teamApi.getTeam(numericTeamId),
          teamApi.getDashboard(numericTeamId),
        ]);
        setTeam(teamData);
        setDashboard(dashboardData);
      } catch (error) {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : '팀 대시보드를 불러오지 못했습니다.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [numericTeamId]);

  if (isLoading) {
    return <LoadingState label="팀 대시보드를 불러오고 있습니다." />;
  }

  return (
    <>
      <div>
        <h1>{team?.name ?? '팀 대시보드'}</h1>
        <p className="muted">{team?.description ?? '팀 설명이 없습니다.'}</p>
      </div>

      <ErrorMessage message={errorMessage} />

      {team && dashboard && (
        <div className="summary-grid">
          <section className="summary-tile">
            <span>팀장</span>
            <strong>{team.leader.name}</strong>
          </section>
          <section className="summary-tile">
            <span>팀원</span>
            <strong>{dashboard.memberCount}명</strong>
          </section>
          <section className="summary-tile">
            <span>미완료 Task</span>
            <strong>{dashboard.task.incompleteCount}</strong>
          </section>
          <section className="summary-tile">
            <span>회고록</span>
            <strong>{dashboard.retrospective.totalCount}</strong>
          </section>
        </div>
      )}
    </>
  );
}
