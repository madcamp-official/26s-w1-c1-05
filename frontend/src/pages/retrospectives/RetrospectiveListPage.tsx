import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as retrospectiveApi from '../../api/retrospectiveApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Button, Card, EmptyState, Field, FieldTextarea, FieldInput, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Retrospective } from '../../types/retrospective';
import type { TeamMember } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function RetrospectiveListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
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
      setErrorMessage('Invalid team.');
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
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load retro entries.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleCreateRetrospective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('Enter a title.');
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
      setForm({ title: '', yesterdayWork: '', todayPlan: '', note: '', collaboratorUserIds: [] });
      setCreateOpen(false);
      await loadPage();
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create the entry.');
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
    return <LoadingState label="Loading retro entries…" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Retro</h1>
          <p className="page-subtitle">Log what you did, what's next, and what you need.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={15} aria-hidden="true" />
          New entry
        </Button>
      </div>

      {createOpen && (
        <Card className="fade-in" style={{ marginBottom: 16 }}>
          <form className="auth-form" onSubmit={handleCreateRetrospective}>
            <Field label="Title">
              <FieldInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </Field>
            <Field label="Yesterday">
              <FieldTextarea
                value={form.yesterdayWork}
                onChange={(event) => setForm((current) => ({ ...current, yesterdayWork: event.target.value }))}
              />
            </Field>
            <Field label="Today">
              <FieldTextarea
                value={form.todayPlan}
                onChange={(event) => setForm((current) => ({ ...current, todayPlan: event.target.value }))}
              />
            </Field>
            <Field label="Questions, needs & findings">
              <FieldTextarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
            </Field>
            <Field label="Collaborators">
              <div className="assignee-grid">
                {members
                  .filter((member) => member.user.id !== user?.id)
                  .map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={form.collaboratorUserIds.includes(member.user.id) ? 'assignee-chip active' : 'assignee-chip'}
                      onClick={() => toggleCollaborator(member.user.id)}
                    >
                      {member.user.name}
                    </button>
                  ))}
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Alert message={errorMessage} />

      {retrospectives.length === 0 ? (
        <EmptyState
          title="No retro entries yet."
          description="Log what you did, what's next, and what you need — one short entry a day."
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New entry
            </Button>
          }
        />
      ) : (
        <div className="retro-grid">
          {retrospectives.map((retro) => (
            <Card
              key={retro.id}
              interactive
              className="retro-card"
              onClick={() => navigate(`/teams/${numericTeamId}/retrospectives/${retro.id}`)}
            >
              <div className="retro-card-head">
                <span className="row-title">{retro.title}</span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {formatDateTime(retro.updatedAt)}
                </span>
              </div>
              <div className="retro-card-preview">{retro.todayPlan || retro.yesterdayWork || 'No content recorded.'}</div>
              <div className="retro-card-footer">
                <Avatar name={retro.author.name} size="sm" />
                <span className="muted" style={{ fontSize: 12 }}>
                  {retro.author.name}
                </span>
                {retro.collaborators.length > 0 && (
                  <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
                    +{retro.collaborators.length} collaborating
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
