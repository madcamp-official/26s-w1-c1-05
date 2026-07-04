import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import * as specDocumentApi from '../../api/specDocumentApi';
import { Alert, Button, Field, FieldInput, FieldSelect, FieldTextarea, LoadingState } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TaskPriority } from '../../types/task';
import type { TeamMember } from '../../types/team';
import { parseSpecRecommendations } from '../../utils/specRecommendations';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function TaskNewPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    assigneeUserIds: [] as number[],
  });

  useEffect(() => void loadPage(), [numericTeamId]);

  async function loadPage() {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [memberData, taskData, specDocuments] = await Promise.all([
        teamApi.getMembers(numericTeamId),
        taskApi.getTasks(numericTeamId),
        specDocumentApi.getSpecDocuments(numericTeamId),
      ]);
      setMembers(memberData);

      const mainSpec = specDocuments.find((doc) => doc.isMain);
      if (mainSpec) {
        const existingTitles = new Set(taskData.map((task) => task.title.trim().toLowerCase()));
        const parsed = parseSpecRecommendations(mainSpec.content).filter(
          (item) => !existingTitles.has(item.trim().toLowerCase()),
        );
        setRecommendations(parsed);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this page.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const submittedTitle = (form.title || String(formData.get('title') ?? '')).trim();
    const submittedDescription = form.description || String(formData.get('description') ?? '');
    const submittedDueDate = form.dueDate || String(formData.get('dueDate') ?? '');

    if (!submittedTitle) {
      setErrorMessage('Enter a task title.');
      return;
    }
    if (!submittedDueDate) {
      setErrorMessage('Pick a due date.');
      return;
    }
    if (form.assigneeUserIds.length === 0) {
      setErrorMessage('Select at least one assignee.');
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.createTask(numericTeamId, {
        title: submittedTitle,
        description: submittedDescription || undefined,
        priority: form.priority,
        dueDate: submittedDueDate,
        assigneeUserIds: form.assigneeUserIds,
      });
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/tasks`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddRecommendation(title: string) {
    if (form.assigneeUserIds.length === 0 || !form.dueDate) {
      handleEditRecommendation(title);
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.createTask(numericTeamId, {
        title,
        priority: form.priority,
        dueDate: form.dueDate,
        assigneeUserIds: form.assigneeUserIds,
      });
      setRecommendations((current) => current.filter((item) => item !== title));
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not add the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditRecommendation(title: string) {
    setForm((current) => ({ ...current, title }));
  }

  function toggleAssignee(userId: number) {
    setForm((current) => ({
      ...current,
      assigneeUserIds: current.assigneeUserIds.includes(userId)
        ? current.assigneeUserIds.filter((id) => id !== userId)
        : [...current.assigneeUserIds, userId],
    }));
  }

  if (isLoading) {
    return <LoadingState label="Loading…" />;
  }

  return (
    <div className="page-container-doc">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}/tasks`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to board
      </button>

      <h1 className="page-title" style={{ fontSize: 24, marginBottom: 22 }}>
        New task
      </h1>

      <Alert message={errorMessage} />

      <div className="task-new-layout">
        <form className="task-form" onSubmit={handleSubmit}>
          <Field label="Title">
            <FieldInput
              name="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Task title"
            />
          </Field>
          <Field label="Description">
            <FieldTextarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </Field>
          <div className="task-form-row">
            <Field label="Priority">
              <FieldSelect
                name="priority"
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </FieldSelect>
            </Field>
            <Field label="Due date">
              <FieldInput
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                onInput={(event) => {
                  const dueDate = event.currentTarget.value;
                  setForm((current) => ({ ...current, dueDate }));
                }}
              />
            </Field>
          </div>
          <Field label="Assignees">
            <div className="assignee-grid">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={form.assigneeUserIds.includes(member.user.id) ? 'assignee-chip active' : 'assignee-chip'}
                  onClick={() => toggleAssignee(member.user.id)}
                >
                  {member.user.name}
                </button>
              ))}
            </div>
          </Field>
          <div>
            <Button type="submit" isLoading={isSubmitting}>
              Create task
            </Button>
          </div>
        </form>

        {recommendations.length > 0 && (
          <aside className="recommend-panel">
            <span className="side-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} aria-hidden="true" />
              Recommended from spec
            </span>
            {recommendations.map((item) => (
              <div className="recommend-item" key={item}>
                <span className="recommend-item-title">{item}</span>
                <div className="recommend-item-actions">
                  <Button type="button" variant="secondary" size="sm" onClick={() => void handleAddRecommendation(item)}>
                    Add
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleEditRecommendation(item)}>
                    Edit first
                  </Button>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
