import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
<<<<<<< HEAD
import { CalendarDays, Plus } from 'lucide-react';
import * as teamApi from '../../api/teamApi';
import { GrowthTree } from '../../components/common/GrowthTree';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
=======
import { CalendarDays, Plus, Sprout } from 'lucide-react';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, LoadingState, StatTile } from '../../components/ui';
import { GrowthTree } from '../../components/growth/GrowthTree';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
import { ApiError } from '../../types/api';
import type { TeamDashboard, TeamDetail } from '../../types/team';
import { toDashboardView } from '../../viewModels/dashboardViewModel';

export function TeamDashboardPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!Number.isFinite(numericTeamId)) {
        setErrorMessage('Invalid team.');
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
        setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [numericTeamId]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

<<<<<<< HEAD
  const dashboardView = team && dashboard ? toDashboardView(team, dashboard) : null;
=======
  const completionRate =
    dashboard && dashboard.task.totalCount > 0
      ? Math.round((dashboard.task.completedCount / dashboard.task.totalCount) * 100)
      : 0;
  const greeting = timeOfDayGreeting();
  const upcomingItems = getUpcomingLabels(dashboard);
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92

  return (
    <div className="page-container">
      <Alert message={errorMessage} />

<<<<<<< HEAD
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
=======
      {team && dashboard && (
        <div className="fade-in">
          <div className="dashboard-hero">
            <div>
              <span className="eyebrow">Scrum workspace</span>
              <h1 className="dashboard-title">
                {greeting}, {user?.name ?? 'there'}
              </h1>
              <p className="dashboard-greeting">{team.description || team.name}</p>
            </div>
            <Link to={`/teams/${numericTeamId}/tasks/new`} className="ds-btn ds-btn-primary ds-btn-md">
              <Plus size={15} aria-hidden="true" />
              Add task
            </Link>
          </div>

          <div className="kpi-row">
            <StatTile label="Active tasks" value={dashboard.task.incompleteCount} caption="Not yet completed" />
            <StatTile label="Completed" value={dashboard.task.completedCount} caption="This sprint" />
            <StatTile
              label="Upcoming deadlines"
              value={dashboard.task.dueSoonCount}
              caption={`${dashboard.task.overdueCount} overdue`}
              valueColor={dashboard.task.overdueCount > 0 ? 'var(--danger)' : undefined}
            />
            <StatTile label="Members" value={dashboard.memberCount} caption="On this team" />
          </div>

          <div className="dashboard-grid">
            <div className="growth-panel">
              <div className="growth-panel-head">
                <span className="eyebrow">Growth tree</span>
                <Sprout size={20} color="var(--gray-500)" aria-hidden="true" />
              </div>
              <div className="growth-tree-wrap">
                <GrowthTree completedCount={dashboard.task.completedCount} totalCount={dashboard.task.totalCount} />
              </div>
              <div className="growth-footer">
                <span className="growth-caption">
                  {dashboard.task.totalCount === 0
                    ? 'Create a task to plant the first branch.'
                    : `${dashboard.task.completedCount} of ${dashboard.task.totalCount} tasks completed`}
                </span>
                <div className="growth-legend">
                  <span className="growth-legend-item">
                    <span style={{ width: 9, height: 9, borderRadius: 999, border: '1.5px solid var(--gray-500)', boxSizing: 'border-box' }} />
                    open
                  </span>
                  <span className="growth-legend-item">
                    <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--ink)' }} />
                    completed
                  </span>
                </div>
              </div>
            </div>
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92

            <div className="dashboard-side">
              <div className="progress-card">
                <div className="progress-card-head">
                  <span className="eyebrow">Sprint progress</span>
                  <span className="progress-value">{completionRate}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="progress-footer">
                  <span>{dashboard.task.completedCount} done</span>
                  <span>{dashboard.task.incompleteCount} to go</span>
                </div>
              </div>

              <div className="side-card">
                <span className="side-card-title">Calendar</span>
                <div className="calendar-grid-mini" aria-label="Mini calendar">
                  {Array.from({ length: 14 }, (_, index) => (
                    <span className={index === 6 ? 'calendar-day active' : 'calendar-day'} key={index}>
                      {index + 1}
                    </span>
                  ))}
                </div>
<<<<<<< HEAD
                <div className="mini-list">
                  {dashboardView.upcomingItems.map((item) => (
=======
                <div className="calendar-mini-list">
                  {upcomingItems.map((item) => (
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="side-card">
                <span className="side-card-title">Quick actions</span>
                <div className="quick-action-list">
                  <Link to={`/teams/${numericTeamId}/tasks/new`} className="quick-action-btn">
                    <Plus size={15} aria-hidden="true" />
                    Add a task
                  </Link>
                  <Link to={`/teams/${numericTeamId}/meetings`} className="quick-action-btn">
                    <CalendarDays size={15} aria-hidden="true" />
                    Log a meeting
                  </Link>
                  <Link to={`/teams/${numericTeamId}/retrospectives`} className="quick-action-btn">
                    <Sprout size={15} aria-hidden="true" />
                    Write a retro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
=======
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function getUpcomingLabels(dashboard: TeamDashboard | null) {
  if (!dashboard) {
    return ['No upcoming deadlines'];
  }
  if (dashboard.task.dueSoonCount === 0 && dashboard.task.overdueCount === 0) {
    return ['No upcoming deadlines'];
  }
  return [`Due within 2 days: ${dashboard.task.dueSoonCount}`, `Overdue: ${dashboard.task.overdueCount}`];
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
}
