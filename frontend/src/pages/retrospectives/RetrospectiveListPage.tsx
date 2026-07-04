import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpenText, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import * as retrospectiveApi from '../../api/retrospectiveApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Retrospective } from '../../types/retrospective';
import type { TeamMember } from '../../types/team';
import { toRetrospectiveListItemView } from '../../viewModels/retrospectiveViewModel';

export function RetrospectiveListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const { user } = useAuth();
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    yesterdayWork: '',
    todayPlan: '',
    note: '',
    collaboratorUserIds: [] as number[],
  });

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('팀 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [retrospectiveData, memberData] = await Promise.all([
        retrospectiveApi.getRetrospectives(numericTeamId),
        teamApi.getMembers(numericTeamId),
      ]);
      setRetrospectives(retrospectiveData);
      setMembers(memberData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회고록 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const retrospectiveItems = useMemo(
    () => retrospectives.map(toRetrospectiveListItemView),
    [retrospectives],
  );

  async function handleCreateRetrospective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('회고록 제목을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await retrospectiveApi.createRetrospective(numericTeamId, {
        title: form.title,
        yesterdayWork: form.yesterdayWork || undefined,
        todayPlan: form.todayPlan || undefined,
        note: form.note || undefined,
        collaboratorUserIds: form.collaboratorUserIds,
      });
      setForm({
        title: '',
        yesterdayWork: '',
        todayPlan: '',
        note: '',
        collaboratorUserIds: [],
      });
      setCreateOpen(false);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회고록을 생성하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleCollaborator(userId: number) {
    setForm((current) => ({
      ...current,
      collaboratorUserIds: current.collaboratorUserIds.includes(userId)
        ? current.collaboratorUserIds.filter((id) => id !== userId)
        : [...current.collaboratorUserIds, userId],
    }));
  }

  if (isLoading) {
    return <LoadingState label="회고록 목록을 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Retrospectives</span>
          <h1>회고록 목록</h1>
          <p className="muted">어제 한 일, 오늘 할 일, 궁금한/필요한/알아낸 것을 일지처럼 기록합니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={16} aria-hidden="true" />
          회고록 작성
        </Button>
      </div>

      {createOpen && (
        <form className="panel form-stack-plain" onSubmit={handleCreateRetrospective}>
          <h2>새 회고록</h2>
          <label className="field">
            <span>제목</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>어제 한 일</span>
            <textarea
              value={form.yesterdayWork}
              onChange={(event) =>
                setForm((current) => ({ ...current, yesterdayWork: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>오늘 할 일</span>
            <textarea
              value={form.todayPlan}
              onChange={(event) =>
                setForm((current) => ({ ...current, todayPlan: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>궁금한/필요한/알아낸 것</span>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </label>

          <fieldset className="assignee-fieldset">
            <legend>공동 작업자</legend>
            <div className="checkbox-grid">
              {members
                .filter((member) => member.user.id !== user?.id)
                .map((member) => (
                  <label key={member.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.collaboratorUserIds.includes(member.user.id)}
                      onChange={() => toggleCollaborator(member.user.id)}
                    />
                    {member.user.name}
                  </label>
                ))}
            </div>
          </fieldset>

          <div className="form-actions">
            <Button type="submit" isLoading={isSubmitting}>
              작성
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
          </div>
        </form>
      )}

      <ErrorMessage message={errorMessage} />

      {retrospectives.length === 0 ? (
        <div className="empty-panel">
          <h2>작성된 회고록이 없습니다.</h2>
          <p>오늘의 진행 상황과 필요한 내용을 첫 회고록으로 남겨보세요.</p>
        </div>
      ) : (
        <div className="document-list">
          {retrospectiveItems.map((item) => (
            <Link
              className="document-list-row"
              key={item.retrospective.id}
              to={`/teams/${numericTeamId}/retrospectives/${item.retrospective.id}`}
            >
              <span className="document-list-icon">
                <BookOpenText size={16} aria-hidden="true" />
              </span>
              <span className="document-list-main">
                <strong>{item.title}</strong>
                <small>{item.preview}</small>
              </span>
              <span className="document-list-meta">
                <strong>{item.displayId}</strong>
                <small>
                  {item.metaLine} · {item.collaboratorLabel}
                </small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
