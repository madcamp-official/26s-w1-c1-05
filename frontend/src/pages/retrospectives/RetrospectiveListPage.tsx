import { useParams } from 'react-router-dom';

export function RetrospectiveListPage() {
  const { teamId } = useParams();

  return (
    <section className="page-section">
      <h1>회고록 목록</h1>
      <p className="muted">Team #{teamId} 회고록 목록과 생성 모달을 연결할 화면입니다.</p>
    </section>
  );
}
