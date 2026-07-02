import { useParams } from 'react-router-dom';

export function TeamSettingsPage() {
  const { teamId } = useParams();

  return (
    <section className="page-section">
      <h1>팀 설정</h1>
      <p className="muted">Team #{teamId} 팀명, 설명, 비밀번호 변경을 연결할 화면입니다.</p>
    </section>
  );
}
