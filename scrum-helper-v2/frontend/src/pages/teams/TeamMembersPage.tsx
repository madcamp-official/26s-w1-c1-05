import { useParams } from 'react-router-dom';

export function TeamMembersPage() {
  const { teamId } = useParams();

  return (
    <section className="page-section">
      <h1>팀원 관리</h1>
      <p className="muted">Team #{teamId} 팀원 목록, 팀장 변경, 팀원 제거를 연결할 화면입니다.</p>
    </section>
  );
}
