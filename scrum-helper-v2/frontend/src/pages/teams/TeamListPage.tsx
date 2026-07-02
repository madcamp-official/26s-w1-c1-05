import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function TeamListPage() {
  const { user } = useAuth();

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>팀 목록</h1>
          <p className="muted">
            {user?.name}님, 다음 단계에서 전체 팀 조회와 팀 생성/가입을 연결합니다.
          </p>
        </div>
      </div>

      <div className="empty-panel">
        <h2>Day 1 인증 기반 완료</h2>
        <p>
          현재 화면은 인증 후 진입 확인용입니다. 다음 작업에서 팀 목록 API와
          생성/가입 모달을 붙입니다.
        </p>
        <Link className="button button-secondary" to="/teams/1">
          팀 내부 화면 미리 보기
        </Link>
      </div>
    </section>
  );
}
