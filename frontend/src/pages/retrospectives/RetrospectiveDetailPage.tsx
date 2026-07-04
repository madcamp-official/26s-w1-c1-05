import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as retrospectiveApi from '../../api/retrospectiveApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Button, useConfirm } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Retrospective } from '../../types/retrospective';
import type { TeamMember } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function RetrospectiveDetailPage() {
  const confirm = useConfirm();
  const { teamId, retrospectiveId } = useParams();
  const numericTeamId = Number(teamId);
  const numericRetrospectiveId = Number(retrospectiveId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
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

  useEffect(() => void loadPage(), [numericRetrospectiveId, numericTeamId]);

  const canEdit =
    retrospective != null &&
    (retrospective.author.id === user?.id || retrospective.collaborators.some((c) => c.id === user?.id));
  const canManageCollaborators = retrospective != null && retrospective.author.id === user?.id;

  async function loadPage() {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericRetrospectiveId)) {
      setErrorMessage('Invalid retro entry.');
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
        collaboratorUserIds: retrospectiveData.collaborators.map((c) => c.id),
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this retro entry.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveRetrospective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('Enter a title.');
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
        collaboratorUserIds: updated.collaborators.map((c) => c.id),
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save this retro entry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRetrospective() {
    if (!retrospective || !await confirm({ title: 'Delete retrospective?', message: 'This retrospective entry will be permanently deleted.', confirmLabel: 'Delete', tone: 'danger' })) {
      return;
    }
    try {
      setIsSubmitting(true);
      await retrospectiveApi.deleteRetrospective(retrospective.id);
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/retrospectives`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not delete this retro entry.');
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
    return <div className="page-container-narrow">Loading…</div>;
  }

  if (!retrospective) {
    return <Alert message={errorMessage ?? 'Retro entry not found.'} />;
  }

  return (
    <div className="page-container-narrow">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}/retrospectives`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        All entries
      </button>

      <div className="detail-title-row">
        {canEdit ? (
          <input
            className="detail-title spec-title-input"
            style={{ marginBottom: 0, flex: 1 }}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        ) : (
          <h1 className="detail-title" style={{ marginBottom: 0 }}>
            {retrospective.title}
          </h1>
        )}
        <span className="mono muted" style={{ fontSize: 12, marginTop: 8 }}>
          {formatDateTime(retrospective.createdAt)}
        </span>
      </div>
      <div className="doc-meta-row">
        <span>By {retrospective.author.name}</span>
        {canEdit && (
          <Button type="button" variant="danger" size="sm" disabled={isSubmitting} onClick={() => void handleDeleteRetrospective()}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>

      {!canEdit && <div className="readonly-note">Only the author or a collaborator can edit this entry.</div>}

      <Alert message={errorMessage} />

      <form onSubmit={handleSaveRetrospective}>
        <div className="retro-sections">
          <div>
            <div className="retro-section-label">Yesterday</div>
            <textarea
              className="doc-textarea"
              style={{ minHeight: 90 }}
              value={form.yesterdayWork}
              disabled={!canEdit}
              onChange={(event) => setForm((current) => ({ ...current, yesterdayWork: event.target.value }))}
            />
          </div>
          <div>
            <div className="retro-section-label">Today</div>
            <textarea
              className="doc-textarea"
              style={{ minHeight: 90 }}
              value={form.todayPlan}
              disabled={!canEdit}
              onChange={(event) => setForm((current) => ({ ...current, todayPlan: event.target.value }))}
            />
          </div>
          <div>
            <div className="retro-section-label">Questions, needs &amp; findings</div>
            <textarea
              className="doc-textarea"
              style={{ minHeight: 90 }}
              value={form.note}
              disabled={!canEdit}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </div>
        </div>

        <div className="collab-section">
          <div className="collab-section-head">
            <span className="detail-section-label" style={{ marginBottom: 0 }}>
              Collaborators
            </span>
            {canEdit && !canManageCollaborators && (
              <span className="muted" style={{ fontSize: 12 }}>
                Only {retrospective.author.name} can change this list
              </span>
            )}
          </div>
          <div className="option-list">
            {members
              .filter((member) => member.user.id !== retrospective.author.id)
              .map((member) => (
                <label className="option-row" key={member.id} style={!canManageCollaborators ? { cursor: 'default' } : undefined}>
                  <input
                    type="checkbox"
                    checked={form.collaboratorUserIds.includes(member.user.id)}
                    disabled={!canManageCollaborators}
                    onChange={() => toggleCollaborator(member.user.id)}
                  />
                  <Avatar name={member.user.name} size="sm" />
                  <span className="option-row-name">{member.user.name}</span>
                </label>
              ))}
          </div>
        </div>

        {canEdit && (
          <div className="doc-save-row">
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
