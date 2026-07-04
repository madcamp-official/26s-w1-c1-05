import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as retrospectiveApi from '../../api/retrospectiveApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Retrospective } from '../../types/retrospective';
import type { TeamMember } from '../../types/team';

export function RetrospectiveDetailPage() {
  const { teamId, retrospectiveId } = useParams();
  const numericTeamId = Number(teamId);
  const numericRetrospectiveId = Number(retrospectiveId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [retrospective, setRetrospective] = useState<Retrospective | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    yesterdayWork: '',
    todayPlan: '',
    note: '',
    collaboratorUserIds: [] as number[],
  });

  const canEdit =
    retrospective != null &&
    (retrospective.author.id === user?.id ||
      retrospective.collaborators.some((collaborator) => collaborator.id === user?.id));
  const canManageCollaborators =
    retrospective != null && retrospective.author.id === user?.id;

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericRetrospectiveId)) {
      setErrorMessage('회고록 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [retrospectiveData, memberData] = await Promise.all([
        retrospectiveApi.getRetrospective(numericRetrospectiveId),
        teamApi.getMembers(numericTeamId),
      ]);
      setRetrospective(retrospectiveData);
      setMembers(memberData);
      setForm({
        title: retrospectiveData.title,
        yesterdayWork: retrospectiveData.yesterdayWork ?? '',
        todayPlan: retrospectiveData.todayPlan ?? '',
        note: retrospectiveData.note ?? '',
        collaboratorUserIds: retrospectiveData.collaborators.map((collaborator) => collaborator.id),
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회고록 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [numericRetrospectiveId, numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleSaveRetrospective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('회고록 제목을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await retrospectiveApi.updateRetrospective(numericRetrospectiveId, {
        title: form.title,
        yesterdayWork: form.yesterdayWork || undefined,
        todayPlan: form.todayPlan || undefined,
        note: form.note || undefined,
        collaboratorUserIds: form.collaboratorUserIds,
      });
      setRetrospective(updated);
      setForm({
        title: updated.title,
        yesterdayWork: updated.yesterdayWork ?? '',
        todayPlan: updated.todayPlan ?? '',
        note: updated.note ?? '',
        collaboratorUserIds: updated.collaborators.map((collaborator) => collaborator.id),
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회고록을 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRetrospective() {
    if (!retrospective || !window.confirm('이 회고록을 삭제할까요?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await retrospectiveApi.deleteRetrospective(retrospective.id);
      navigate(`/teams/${numericTeamId}/retrospectives`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회고록을 삭제하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleCollaborator(userId: number) {
    if (!canManageCollaborators) {
      return;
    }
    setForm((current) => ({
      ...current,
      collaboratorUserIds: current.collaboratorUserIds.includes(userId)
        ? current.collaboratorUserIds.filter((id) => id !== userId)
        : [...current.collaboratorUserIds, userId],
    }));
  }

  if (isLoading) {
    return <LoadingState label="회고록 상세를 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Retrospective detail</span>
          <h1>{retrospective?.title ?? '회고록 상세'}</h1>
          {retrospective && (
            <p className="muted">
              작성 {retrospective.author.name} · 수정 {formatDateTime(retrospective.updatedAt)}
            </p>
          )}
        </div>
        {retrospective && canEdit && (
          <Button
            type="button"
            variant="danger"
            disabled={isSubmitting}
            onClick={() => void handleDeleteRetrospective()}
          >
            삭제
          </Button>
        )}
      </div>

      <ErrorMessage message={errorMessage} />

      {retrospective && (
        <form className="panel form-stack-plain" onSubmit={handleSaveRetrospective}>
          {!canEdit && (
            <div className="notice">
              작성자 또는 공동 작업자만 이 회고록을 수정할 수 있습니다.
            </div>
          )}
          {canEdit && !canManageCollaborators && (
            <div className="notice">
              공동 작업자 목록은 회고록 작성자만 변경할 수 있습니다.
            </div>
          )}

          <label className="field">
            <span>제목</span>
            <input
              type="text"
              value={form.title}
              disabled={!canEdit}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>어제 한 일</span>
            <textarea
              value={form.yesterdayWork}
              disabled={!canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, yesterdayWork: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>오늘 할 일</span>
            <textarea
              value={form.todayPlan}
              disabled={!canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, todayPlan: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>궁금한/필요한/알아낸 것</span>
            <textarea
              value={form.note}
              disabled={!canEdit}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </label>

          <fieldset className="assignee-fieldset" disabled={!canEdit || !canManageCollaborators}>
            <legend>공동 작업자</legend>
            <div className="checkbox-grid">
              {members
                .filter((member) => member.user.id !== retrospective.author.id)
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

          {canEdit && (
            <div className="form-actions">
              <Button type="submit" isLoading={isSubmitting}>
                저장
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
