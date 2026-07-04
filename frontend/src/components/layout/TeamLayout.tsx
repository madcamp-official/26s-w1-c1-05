<<<<<<< HEAD
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Users,
  Video,
} from 'lucide-react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
=======
import { useEffect, useState } from 'react';
import { LayoutDashboard, ListChecks, CalendarDays, FileText, RotateCcw, Users, Settings, ChevronsUpDown, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import * as meetingApi from '../../api/meetingApi';
import * as specDocumentApi from '../../api/specDocumentApi';
import { useAuth } from '../../auth/useAuth';
import { Avatar, LoadingState } from '../ui';
import { ApiError } from '../../types/api';
import type { TeamDashboard, TeamDetail } from '../../types/team';

type NavItem = {
  to: string;
  end?: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  count?: number;
};
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92

export function TeamLayout() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [meetingCount, setMeetingCount] = useState(0);
  const [specCount, setSpecCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadTeamChrome();
  }, [numericTeamId]);

  async function loadTeamChrome() {
    if (!Number.isFinite(numericTeamId)) {
      return;
    }
    try {
      setIsLoading(true);
      const [teamData, dashboardData, meetings, specs] = await Promise.all([
        teamApi.getTeam(numericTeamId),
        teamApi.getDashboard(numericTeamId),
        meetingApi.getMeetings(numericTeamId),
        specDocumentApi.getSpecDocuments(numericTeamId),
      ]);
      setTeam(teamData);
      setDashboard(dashboardData);
      setMeetingCount(meetings.length);
      setSpecCount(specs.length);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this team.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const basePath = `/teams/${teamId}`;
  const navItems: NavItem[] = [
    { to: basePath, end: true, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${basePath}/tasks`, label: 'Task', icon: ListChecks, count: dashboard?.task.incompleteCount },
    { to: `${basePath}/meetings`, label: 'Meetings', icon: CalendarDays, count: meetingCount },
    { to: `${basePath}/spec-documents`, label: 'Spec', icon: FileText, count: specCount },
    { to: `${basePath}/retrospectives`, label: 'Retro', icon: RotateCcw, count: dashboard?.retrospective.totalCount },
    { to: `${basePath}/members`, label: 'Members', icon: Users, count: dashboard?.memberCount },
    { to: `${basePath}/settings`, label: 'Settings', icon: Settings },
  ];

  const activeItem = [...navItems].reverse().find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );
  const crumbLabel = activeItem?.label ?? 'Dashboard';

  if (isLoading && !team) {
    return <LoadingState label="Loading team…" />;
  }

  return (
<<<<<<< HEAD
    <section className="team-layout">
      <aside className="team-nav">
        <strong>Team #{teamId}</strong>
        <NavLink to={`/teams/${teamId}`} end>
          <LayoutDashboard size={16} aria-hidden="true" />
          대시보드
        </NavLink>
        <NavLink to={`/teams/${teamId}/tasks`}>
          <ClipboardList size={16} aria-hidden="true" />
          Task
        </NavLink>
        <NavLink to={`/teams/${teamId}/meetings`}>
          <Video size={16} aria-hidden="true" />
          회의
        </NavLink>
        <NavLink to={`/teams/${teamId}/spec-documents`}>
          <FileText size={16} aria-hidden="true" />
          스펙
        </NavLink>
        <NavLink to={`/teams/${teamId}/retrospectives`}>
          <MessageSquareText size={16} aria-hidden="true" />
          회고록
        </NavLink>
        <NavLink to={`/teams/${teamId}/members`}>
          <Users size={16} aria-hidden="true" />
          팀원
        </NavLink>
        <NavLink to={`/teams/${teamId}/settings`}>
          <Settings size={16} aria-hidden="true" />
          설정
        </NavLink>
=======
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">Scrum Helper</div>

        <button type="button" className="team-switch" onClick={() => navigate('/teams')}>
          <span className="team-switch-badge">{(team?.name ?? '?').slice(0, 2).toUpperCase()}</span>
          <span className="team-switch-meta">
            <span className="team-switch-name">{team?.name ?? `Team #${teamId}`}</span>
            <span className="team-switch-sub">Switch team</span>
          </span>
          <ChevronsUpDown size={14} className="team-switch-chevron" aria-hidden="true" />
        </button>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item === activeItem;
            return (
              <Link key={item.to} to={item.to} className={isActive ? 'nav-item active' : 'nav-item'}>
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count !== undefined && <span className="nav-count">{item.count}</span>}
              </Link>
            );
          })}
        </nav>
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-crumb">
            <span className="crumb-team" onClick={() => navigate(basePath)}>
              {team?.name ?? `Team #${teamId}`}
            </span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{crumbLabel}</span>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <Avatar name={user?.name ?? 'You'} size="sm" />
              <span>{user?.name ?? 'You'}</span>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        </header>

        {errorMessage && <div className="readonly-banner">{errorMessage}</div>}

        <main className="app-content scroll-area">
          <Outlet context={{ team, dashboard, refreshTeamChrome: loadTeamChrome } satisfies TeamLayoutContext} />
        </main>
      </div>
    </div>
  );
}

export type TeamLayoutContext = {
  team: TeamDetail | null;
  dashboard: TeamDashboard | null;
  refreshTeamChrome: () => Promise<void>;
};
