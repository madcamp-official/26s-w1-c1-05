import type { TeamSummary } from '../types/team';

export type TeamCardView = {
  team: TeamSummary;
  badge: string;
  accessLabel: string;
  accessTone: 'public' | 'locked';
  statusLabel: string;
  actionLabel: string;
  leaderLabel: string;
  memberLabel: string;
};

export function toTeamCardView(team: TeamSummary): TeamCardView {
  return {
    team,
    badge: getTeamBadge(team.name),
    accessLabel: team.hasPassword ? 'LOCKED' : 'PUBLIC',
    accessTone: team.hasPassword ? 'locked' : 'public',
    statusLabel: team.joined ? team.myRole ?? 'MEMBER' : 'NOT JOINED',
    actionLabel: team.joined ? 'Open' : team.hasPassword ? 'Enter password' : 'Join',
    leaderLabel: team.leader.name,
    memberLabel: `${team.memberCount} members`,
  };
}

function getTeamBadge(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return initials.toUpperCase() || 'TM';
}
