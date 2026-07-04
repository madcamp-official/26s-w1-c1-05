<<<<<<< HEAD
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
=======
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Badge, Button, FieldSelect, FieldTextarea, LoadingState, StatusDot } from '../../components/ui';
import { dueLabel, priorityTone, relativeTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task, TaskComment, TaskPriority } from '../../types/task';
import type { TeamMember } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function TaskDetailPage() {
  const { teamId, taskId } = useParams();
  const numericTeamId = Number(teamId);
  const numericTaskId = Number(taskId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    assigneeUserIds: [] as number[],
  });

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTaskId) || !Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid task.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [taskData, memberData, commentData] = await Promise.all([
        taskApi.getTask(numericTaskId),
        teamApi.getMembers(numericTeamId),
        taskApi.getComments(numericTaskId),
      ]);
      setTask(taskData);
      setMembers(memberData);
      setComments(commentData);
      setForm({
        title: taskData.title,
        description: taskData.description ?? '',
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        assigneeUserIds: taskData.assignees.map((assignee) => assignee.id),
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this task.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTaskId, numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function saveField(next: Partial<typeof form>) {
    if (!task) {
      return;
    }
    const nextForm = { ...form, ...next };
    setForm(nextForm);
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const updated = await taskApi.updateTask(task.id, {
        title: nextForm.title.trim() || task.title,
        description: nextForm.description || undefined,
        priority: nextForm.priority,
        dueDate: nextForm.dueDate,
        assigneeUserIds: nextForm.assigneeUserIds,
      });
      setTask(updated);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompletion() {
    if (!task) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setTask(await taskApi.updateTaskCompletion(task.id, !task.completed));
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask() {
    if (!task || !window.confirm('Delete this task? Its comments will be deleted too.')) {
      return;
    }
    try {
      setIsSubmitting(true);
      await taskApi.deleteTask(task.id);
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/tasks`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not delete the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!commentContent.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.createComment(numericTaskId, { content: commentContent });
      setCommentContent('');
      const [commentsData, taskData] = await Promise.all([taskApi.getComments(numericTaskId), taskApi.getTask(numericTaskId)]);
      setComments(commentsData);
      setTask(taskData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not post the comment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateComment(commentId: number) {
    if (!editingCommentContent.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.updateComment(commentId, { content: editingCommentContent });
      setEditingCommentId(null);
      setEditingCommentContent('');
      setComments(await taskApi.getComments(numericTaskId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the comment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm('Delete this comment?')) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.deleteComment(commentId);
      const [commentsData, taskData] = await Promise.all([taskApi.getComments(numericTaskId), taskApi.getTask(numericTaskId)]);
      setComments(commentsData);
      setTask(taskData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not delete the comment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleAssignee(userId: number) {
    const nextIds = form.assigneeUserIds.includes(userId)
      ? form.assigneeUserIds.filter((id) => id !== userId)
      : [...form.assigneeUserIds, userId];
    void saveField({ assigneeUserIds: nextIds });
  }

  if (isLoading) {
    return <LoadingState label="Loading task…" />;
  }

  if (!task) {
    return <Alert message={errorMessage ?? 'Task not found.'} />;
  }

  const due = dueLabel(task.dueDate, task.completed);
  const priority = priorityTone(task.priority);
  const statusLabel = task.completed ? 'Completed' : due.tone === 'soon' ? 'In progress' : 'Backlog';
  const statusDotVariant = task.completed ? 'filled' : due.tone === 'soon' ? 'half' : 'outline';

  return (
    <div className="page-container-doc">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}/tasks`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to board
      </button>

      <div className="detail-header">
        <span className="mono muted" style={{ fontSize: 12 }}>
          #{task.id}
        </span>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>
      <input
        className="detail-title spec-title-input"
        style={{ marginBottom: 14 }}
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        onBlur={() => form.title.trim() && form.title !== task.title && void saveField({ title: form.title })}
        aria-label="Task title"
      />

      <div className="detail-meta-row">
        <div className="detail-meta-item">
          <span className="detail-meta-label">Status</span>
          <span className="detail-meta-value">
            <StatusDot variant={statusDotVariant} />
            {statusLabel}
          </span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Due</span>
          <span className={`mono${due.tone === 'overdue' ? ' due-label-overdue' : ''}`} style={{ fontSize: 13 }}>
            {due.label}
          </span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Assignees</span>
          <span className="detail-meta-value">{task.assignees.map((a) => a.name).join(', ') || 'Unassigned'}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Comments</span>
          <span className="mono" style={{ fontSize: 13 }}>
            {task.commentCount}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <span className="detail-section-label">Description</span>
        <FieldTextarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          onBlur={() => void saveField({ description: form.description })}
          placeholder="Add a description..."
        />
      </div>

      <div className="detail-fields-grid">
        <div className="detail-section" style={{ margin: 0 }}>
          <span className="detail-section-label">Priority</span>
          <FieldSelect
            value={form.priority}
            onChange={(event) => void saveField({ priority: event.target.value as TaskPriority })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </FieldSelect>
        </div>
        <div className="detail-section" style={{ margin: 0 }}>
          <span className="detail-section-label">Due date</span>
          <input
            type="date"
            className="ds-field-control"
            value={form.dueDate}
            onChange={(event) => void saveField({ dueDate: event.target.value })}
          />
        </div>
      </div>

      <div className="detail-section">
        <span className="detail-section-label">Assignees</span>
        <div className="option-list">
          {members.map((member) => (
            <label className="option-row" key={member.id}>
              <input
                type="checkbox"
                checked={form.assigneeUserIds.includes(member.user.id)}
                onChange={() => toggleAssignee(member.user.id)}
              />
              <Avatar name={member.user.name} size="sm" />
              <span className="option-row-name">{member.user.name}</span>
              <span className="option-row-tag">{member.role}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="detail-action-bar">
        <Button
          type="button"
          variant={task.completed ? 'secondary' : 'primary'}
          disabled={isSubmitting}
          onClick={() => void handleToggleCompletion()}
        >
          {task.completed ? 'Mark incomplete' : 'Mark complete'}
        </Button>
        <div className="detail-action-bar-end">
          <Button type="button" variant="danger" disabled={isSubmitting} onClick={() => void handleDeleteTask()}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      <Alert message={errorMessage} />

      <div>
        <div className="comments-heading">Comments · {comments.length}</div>
        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No comments yet. Start the thread.
            </p>
          ) : (
            comments.map((comment) => {
              const isAuthor = comment.author.id === user?.id;
              const isEditing = editingCommentId === comment.id;
              return (
                <div className="comment-item" key={comment.id}>
                  <Avatar name={comment.author.name} />
                  <div className="comment-body-wrap">
                    <div className="comment-head">
                      <span className="comment-author">{comment.author.name}</span>
                      <span className="comment-time">{relativeTime(comment.updatedAt)}</span>
                    </div>
                    {isEditing ? (
                      <input
                        className="ds-field-control"
                        style={{ marginTop: 6 }}
                        value={editingCommentContent}
                        onChange={(event) => setEditingCommentContent(event.target.value)}
                      />
                    ) : (
                      <div className="comment-body">{comment.content}</div>
                    )}
                    {isAuthor && (
                      <div className="comment-actions">
                        {isEditing ? (
                          <>
                            <button type="button" className="comment-action-link" onClick={() => void handleUpdateComment(comment.id)}>
                              Save
                            </button>
                            <button
                              type="button"
                              className="comment-action-link"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentContent('');
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="comment-action-link"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.content);
                              }}
                            >
                              Edit
                            </button>
                            <button type="button" className="comment-action-link" onClick={() => void handleDeleteComment(comment.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form className="comment-compose" onSubmit={handleCreateComment}>
          <Avatar name={user?.name ?? 'You'} tone="ink" />
          <div className="comment-compose-body">
            <FieldTextarea
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              placeholder="Add a comment…"
              style={{ minHeight: 64 }}
            />
            <div className="comment-submit-row">
              <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!commentContent.trim()}>
                Comment
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
