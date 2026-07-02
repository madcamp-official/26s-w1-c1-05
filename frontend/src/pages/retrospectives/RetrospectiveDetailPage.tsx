import { useParams } from 'react-router-dom';

export function RetrospectiveDetailPage() {
  const { retrospectiveId } = useParams();

  return (
    <section className="page-section">
      <h1>회고록 상세</h1>
      <p className="muted">
        회고록 #{retrospectiveId} 조회, 수정, 공동 작업자 변경을 연결할 화면입니다.
      </p>
    </section>
  );
}
