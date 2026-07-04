import type { TeamDashboard, TeamDetail } from '../types/team';

export type DashboardMetricView = {
  label: string;
  value: number;
  helper: string;
};

export type DashboardView = {
  title: string;
  description: string;
  leaderLabel: string;
  metrics: DashboardMetricView[];
  completionRate: number;
  growthTaskCount: number;
  growthFruitCount: number;
  upcomingItems: string[];
};

export function toDashboardView(team: TeamDetail, dashboard: TeamDashboard): DashboardView {
  const totalTaskCount = dashboard.task.totalCount;
  const completionRate =
    totalTaskCount > 0 ? Math.round((dashboard.task.completedCount / totalTaskCount) * 100) : 0;

  return {
    title: team.name,
    description: team.description || '팀 설명이 없습니다.',
    leaderLabel: `Leader ${team.leader.name}`,
    metrics: [
      {
        label: 'Active tasks',
        value: dashboard.task.incompleteCount,
        helper: `${dashboard.task.dueSoonCount} due soon`,
      },
      {
        label: 'Completed',
        value: dashboard.task.completedCount,
        helper: `${completionRate}% complete`,
      },
      {
        label: 'Deadlines',
        value: dashboard.task.dueSoonCount,
        helper: `${dashboard.task.overdueCount} overdue`,
      },
      {
        label: 'Members',
        value: dashboard.memberCount,
        helper: `${dashboard.retrospective.totalCount} retros`,
      },
    ],
    completionRate,
    growthTaskCount: Math.min(totalTaskCount, 10),
    growthFruitCount: Math.min(dashboard.task.completedCount, 10),
    upcomingItems: getUpcomingItems(dashboard),
  };
}

function getUpcomingItems(dashboard: TeamDashboard) {
  if (dashboard.task.dueSoonCount === 0 && dashboard.task.overdueCount === 0) {
    return ['No close deadlines'];
  }
  return [
    `${dashboard.task.dueSoonCount} due within 2 days`,
    `${dashboard.task.overdueCount} overdue`,
  ];
}
