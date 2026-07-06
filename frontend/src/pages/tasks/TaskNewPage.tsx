import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import * as specDocumentApi from '../../api/specDocumentApi';
import { Alert, Button, Field, FieldInput, FieldSelect, FieldTextarea, LoadingState, useToast } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TaskPriority, TaskRecommendation } from '../../types/task';
import type { TeamMember } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function TaskNewPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [hasMainSpec, setHasMainSpec] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
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
      const [memberData, taskData, specDocuments, queuedSuggestions] = await Promise.all([
        teamApi.getMembers(numericTeamId),
        taskApi.getTasks(numericTeamId),
        specDocumentApi.getSpecDocuments(numericTeamId),
        taskApi.getQueuedTaskSuggestions(numericTeamId),
      ]);
      setMembers(memberData);
      setHasMainSpec(specDocuments.some((doc) => doc.isMain));

      const existingTitles = new Set(taskData.map((task) => task.title.trim().toLowerCase()));
      setRecommendations(queuedSuggestions.filter((item) => !existingTitles.has(item.title.trim().toLowerCase())));
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

    if (!submittedTitle) {
      setErrorMessage('Enter a task title.');
      return;
    }
    if (form.assigneeUserIds.length === 0) {
      setErrorMessage('Select at least one assignee.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedSuggestionId != null) {
        await taskApi.acceptTaskSuggestion(selectedSuggestionId, form.assigneeUserIds);
      } else {
        await taskApi.createTask(numericTeamId, {
          title: submittedTitle,
          description: submittedDescription || undefined,
          priority: form.priority,
          assigneeUserIds: form.assigneeUserIds,
        });
      }
      setForm({ title: '', description: '', priority: 'MEDIUM', assigneeUserIds: [] });
      setSelectedSuggestionId(null);
      toast('Task created');
      void refreshTeamChrome();
      void refreshRecommendations();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refreshRecommendations() {
    try {
      const [taskData, queuedSuggestions] = await Promise.all([
        taskApi.getTasks(numericTeamId),
        taskApi.getQueuedTaskSuggestions(numericTeamId),
      ]);
      const existingTitles = new Set(taskData.map((task) => task.title.trim().toLowerCase()));
      setRecommendations(queuedSuggestions.filter((item) => !existingTitles.has(item.title.trim().toLowerCase())));
    } catch {
      // Non-critical: keep the current recommendation list if the refresh fails.
    }
  }

  function handleSelectRecommendation(recommendation: TaskRecommendation) {
    setSelectedSuggestionId(recommendation.id ?? null);
    setForm((current) => ({
      ...current,
      title: recommendation.title,
      description: recommendation.description ?? '',
      priority: recommendation.priority,
    }));
  }

  function editField(update: Partial<typeof form>) {
    setSelectedSuggestionId(null);
    setForm((current) => ({ ...current, ...update }));
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
    <div className="page-container">
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
              onChange={(event) => editField({ title: event.target.value })}
              placeholder="Task title"
            />
          </Field>
          <Field label="Description">
            <FieldTextarea
              name="description"
              value={form.description}
              onChange={(event) => editField({ description: event.target.value })}
            />
          </Field>
          <div className="task-form-row">
            <Field label="Priority">
              <FieldSelect
                name="priority"
                value={form.priority}
                onChange={(event) => editField({ priority: event.target.value as TaskPriority })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </FieldSelect>
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

        <aside className="recommend-panel">
          <span className="side-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} aria-hidden="true" />
            Recommended from main spec
          </span>
          {!hasMainSpec && <div className="recommend-empty">Set a main spec to generate task recommendations.</div>}
          {hasMainSpec && recommendations.length === 0 && <div className="recommend-empty">No new tasks to recommend.</div>}
          {recommendations.map((item) => (
            <button
              className={selectedSuggestionId === item.id ? 'recommend-item active' : 'recommend-item'}
              type="button"
              key={item.id ?? item.title}
              onClick={() => handleSelectRecommendation(item)}
            >
              <span className="recommend-item-title">{item.title}</span>
              {item.description && <span className="recommend-item-description">{item.description}</span>}
              <span className="recommend-item-meta">{item.priority}{item.reason ? ` · ${item.reason}` : ''}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
