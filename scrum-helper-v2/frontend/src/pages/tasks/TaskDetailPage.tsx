import { useParams } from 'react-router-dom';

export function TaskDetailPage() {
  const { taskId } = useParams();

  return (
    <section className="page-section">
      <h1>Task 상세</h1>
      <p className="muted">Task #{taskId} 수정, 완료 변경, 댓글을 연결할 화면입니다.</p>
    </section>
  );
}
