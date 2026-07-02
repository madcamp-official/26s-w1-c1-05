import { useParams } from 'react-router-dom';

export function TaskListPage() {
  const { teamId } = useParams();

  return (
    <section className="page-section">
      <h1>Task 목록</h1>
      <p className="muted">Team #{teamId} task 목록, 필터, 생성 모달을 연결할 화면입니다.</p>
    </section>
  );
}
