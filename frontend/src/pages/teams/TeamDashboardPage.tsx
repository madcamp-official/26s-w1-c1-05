import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, ListTodo, Plus, Sprout, Users } from 'lucide-react';
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

  const completionRate =
    dashboard && dashboard.task.totalCount > 0
      ? Math.round((dashboard.task.completedCount / dashboard.task.totalCount) * 100)
      : 0;
  const leafCount = dashboard ? Math.min(dashboard.task.completedCount, 18) : 0;
  const treeLeaves = Array.from({ length: leafCount }, (_, index) => index);
  const upcomingItems = getUpcomingLabels();

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

      {team && dashboard && (
        <>
          <div className="summary-grid dashboard-kpis">
            <section className="summary-tile kpi-blue">
              <ListTodo size={18} aria-hidden="true" />
              <span>Active Tasks</span>
              <strong>{dashboard.task.incompleteCount}</strong>
            </section>
            <section className="summary-tile kpi-green">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Completed</span>
              <strong>{dashboard.task.completedCount}</strong>
            </section>
            <section className="summary-tile kpi-yellow">
              <Clock3 size={18} aria-hidden="true" />
              <span>Upcoming Deadlines</span>
              <strong>{dashboard.task.dueSoonCount}</strong>
            </section>
            <section className="summary-tile">
              <Users size={18} aria-hidden="true" />
              <span>Members</span>
              <strong>{dashboard.memberCount}</strong>
            </section>
          </div>

          <div className="dashboard-grid">
            <section className="panel growth-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Growth Tree</span>
                  <h2>완료한 Task가 나무를 키웁니다</h2>
                </div>
                <Sprout size={20} aria-hidden="true" />
              </div>
              <div className="tree-widget" aria-label={`완료한 task ${dashboard.task.completedCount}개`}>
                <div className="tree-canopy">
                  {treeLeaves.length === 0 ? (
                    <span className="tree-leaf empty-leaf" />
                  ) : (
                    treeLeaves.map((leaf) => <span className="tree-leaf" key={leaf} />)
                  )}
                </div>
                <div
                  className="tree-trunk"
                  style={{ height: `${56 + Math.min(dashboard.task.totalCount, 12) * 5}px` }}
                />
              </div>
              <div className="progress-row">
                <span>Task completion</span>
                <strong>{completionRate}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${completionRate}%` }} />
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
                  {upcomingItems.map((item) => (
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

  function getUpcomingLabels() {
    if (!dashboard) {
      return ['예정된 마감 없음'];
    }
    if (dashboard.task.dueSoonCount === 0 && dashboard.task.overdueCount === 0) {
      return ['가까운 마감 없음'];
    }
    return [
      `2일 내 마감 ${dashboard.task.dueSoonCount}`,
      `지연 ${dashboard.task.overdueCount}`,
    ];
  }
}
