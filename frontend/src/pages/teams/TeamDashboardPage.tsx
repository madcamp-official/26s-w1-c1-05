import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import * as teamApi from '../../api/teamApi';
import { GrowthTree } from '../../components/common/GrowthTree';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { TeamDashboard, TeamDetail } from '../../types/team';
import { toDashboardView } from '../../viewModels/dashboardViewModel';

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

  const dashboardView = team && dashboard ? toDashboardView(team, dashboard) : null;

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Scrum workspace</span>
          <h1>{team?.name ?? '팀 대시보드'}</h1>
          <p className="muted">{team?.description ?? '팀 설명이 없습니다.'}</p>
        </div>
        {team && <span className="soft-pill">팀장 {team.leader.name}</span>}
      </div>

      <ErrorMessage message={errorMessage} />

      {dashboardView && (
        <>
          <div className="summary-grid dashboard-kpis">
            {dashboardView.metrics.map((metric) => (
              <section className="summary-tile" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.helper}</small>
              </section>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="panel growth-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Growth tree</span>
                  <h2>완료한 Task가 나무를 키웁니다</h2>
                </div>
                <span className="soft-pill">{dashboardView.growthFruitCount} fruit</span>
              </div>
              <div className="tree-widget">
                <GrowthTree
                  taskCount={dashboardView.growthTaskCount}
                  fruitCount={dashboardView.growthFruitCount}
                />
              </div>
              <div className="progress-row">
                <span>Task completion</span>
                <strong>{dashboardView.completionRate}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${dashboardView.completionRate}%` }} />
              </div>
            </section>

            <aside className="dashboard-sidebar">
              <section className="panel mini-calendar">
                <div className="section-heading">
                  <h2>Calendar</h2>
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                <div className="calendar-grid-mini" aria-label="미니 캘린더">
                  {Array.from({ length: 14 }, (_, index) => (
                    <span
                      className={index === 6 ? 'calendar-day active' : 'calendar-day'}
                      key={index}
                    >
                      {index + 1}
                    </span>
                  ))}
                </div>
                <div className="mini-list">
                  {dashboardView.upcomingItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>

              <section className="panel quick-actions">
                <div className="section-heading">
                  <h2>Quick Actions</h2>
                  <Plus size={18} aria-hidden="true" />
                </div>
                <Link to={`/teams/${numericTeamId}/tasks`}>Task 관리</Link>
                <Link to={`/teams/${numericTeamId}/meetings`}>회의록 작성</Link>
                <Link to={`/teams/${numericTeamId}/retrospectives`}>회고록 작성</Link>
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
