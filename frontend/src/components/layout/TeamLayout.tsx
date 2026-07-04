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

export function TeamLayout() {
  const { teamId } = useParams();

  return (
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
      </aside>
      <div className="team-content">
        <Outlet />
      </div>
    </section>
  );
}
