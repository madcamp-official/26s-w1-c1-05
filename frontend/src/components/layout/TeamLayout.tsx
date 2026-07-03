import { NavLink, Outlet, useParams } from 'react-router-dom';

export function TeamLayout() {
  const { teamId } = useParams();

  return (
    <section className="team-layout">
      <aside className="team-nav">
        <strong>Team #{teamId}</strong>
        <NavLink to={`/teams/${teamId}`} end>
          대시보드
        </NavLink>
        <NavLink to={`/teams/${teamId}/tasks`}>Task</NavLink>
        <NavLink to={`/teams/${teamId}/meetings`}>회의</NavLink>
        <NavLink to={`/teams/${teamId}/spec-documents`}>스펙</NavLink>
        <NavLink to={`/teams/${teamId}/retrospectives`}>회고록</NavLink>
        <NavLink to={`/teams/${teamId}/members`}>팀원</NavLink>
        <NavLink to={`/teams/${teamId}/settings`}>설정</NavLink>
      </aside>
      <div className="team-content">
        <Outlet />
      </div>
    </section>
  );
}
