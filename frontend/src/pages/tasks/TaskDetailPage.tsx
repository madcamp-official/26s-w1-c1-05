import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Task, TaskComment, TaskPriority } from '../../types/task';
import type { TeamMember } from '../../types/team';

export function TaskDetailPage() {
  const { teamId, taskId } = useParams();
  const numericTeamId = Number(teamId);
  const numericTaskId = Number(taskId);
  const navigate = useNavigate();
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
      setErrorMessage('task 정보가 올바르지 않습니다.');
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
      setErrorMessage(error instanceof ApiError ? error.message : 'task 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTaskId, numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleSaveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('task 제목을 입력하세요.');
      return;
    }
    if (!form.dueDate) {
      setErrorMessage('마감일을 선택하세요.');
      return;
    }
    if (form.assigneeUserIds.length === 0) {
      setErrorMessage('담당자를 1명 이상 선택하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await taskApi.updateTask(numericTaskId, {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate,
        assigneeUserIds: form.assigneeUserIds,
      });
      setTask(updated);
      setForm((current) => ({
        ...current,
        assigneeUserIds: updated.assignees.map((assignee) => assignee.id),
      }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'task를 저장하지 못했습니다.');
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
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '완료 상태를 변경하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask() {
    if (!task || !window.confirm('이 task를 삭제할까요? 댓글도 함께 삭제됩니다.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.deleteTask(task.id);
      navigate(`/teams/${numericTeamId}/tasks`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'task를 삭제하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!commentContent.trim()) {
      setErrorMessage('댓글 내용을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.createComment(numericTaskId, { content: commentContent });
      setCommentContent('');
      const [commentsData, taskData] = await Promise.all([
        taskApi.getComments(numericTaskId),
        taskApi.getTask(numericTaskId),
      ]);
      setComments(commentsData);
      setTask(taskData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '댓글을 작성하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateComment(commentId: number) {
    if (!editingCommentContent.trim()) {
      setErrorMessage('댓글 내용을 입력하세요.');
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
      setErrorMessage(error instanceof ApiError ? error.message : '댓글을 수정하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm('댓글을 삭제할까요?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.deleteComment(commentId);
      const [commentsData, taskData] = await Promise.all([
        taskApi.getComments(numericTaskId),
        taskApi.getTask(numericTaskId),
      ]);
      setComments(commentsData);
      setTask(taskData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '댓글을 삭제하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
    return <LoadingState label="task 상세를 불러오고 있습니다." />;
  }

  return (
    <section className="detail-document">
      <div className="document-header">
        <div>
          <span className="eyebrow">Task #{taskId}</span>
          <h1>{task?.title ?? 'Task 상세'}</h1>
          {task && (
            <div className="document-meta">
              <span className={`priority priority-${task.priority.toLowerCase()}`}>
                {priorityLabel(task.priority)}
              </span>
              <span className={task.completed ? 'soft-pill success' : 'soft-pill'}>
                {task.completed ? 'Completed' : 'Open'}
              </span>
              <span>마감 {task.dueDate}</span>
              <span>댓글 {task.commentCount}</span>
            </div>
          )}
        </div>
        {task && (
          <div className="row-actions">
            <Button
              type="button"
              variant={task.completed ? 'secondary' : 'primary'}
              disabled={isSubmitting}
              onClick={() => void handleToggleCompletion()}
            >
              {task.completed ? '미완료로 변경' : '완료'}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isSubmitting}
              onClick={() => void handleDeleteTask()}
            >
              삭제
            </Button>
          </div>
        )}
      </div>

      <ErrorMessage message={errorMessage} />

      {task && (
        <>
          <form className="document-panel form-stack-plain" onSubmit={handleSaveTask}>
            <h2>기본 정보</h2>
            <label className="field">
              <span>제목</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>설명</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <div className="form-row">
              <label className="field">
                <span>중요도</span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">높음</option>
                </select>
              </label>
              <label className="field">
                <span>마감일</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>
            </div>
            <fieldset className="assignee-fieldset">
              <legend>담당자</legend>
              <div className="checkbox-grid">
                {members.map((member) => (
                  <label key={member.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.assigneeUserIds.includes(member.user.id)}
                      onChange={() => toggleAssignee(member.user.id)}
                    />
                    {member.user.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-actions">
              <Button type="submit" isLoading={isSubmitting}>
                저장
              </Button>
            </div>
          </form>

          <section className="document-panel form-stack-plain">
            <div className="page-header">
              <div>
                <h2>댓글</h2>
                <p className="muted">{comments.length}개의 댓글</p>
              </div>
            </div>

            <form className="inline-form comment-form" onSubmit={handleCreateComment}>
              <input
                type="text"
                placeholder="댓글 입력"
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
              />
              <Button type="submit" isLoading={isSubmitting}>
                작성
              </Button>
            </form>

            <div className="comment-list">
              {comments.length === 0 ? (
                <p className="muted">아직 댓글이 없습니다.</p>
              ) : (
                comments.map((comment) => {
                  const isAuthor = comment.author.id === user?.id;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <article className="comment-row" key={comment.id}>
                      <div className="comment-content">
                        <strong>{comment.author.name}</strong>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCommentContent}
                            onChange={(event) =>
                              setEditingCommentContent(event.target.value)
                            }
                          />
                        ) : (
                          <p>{comment.content}</p>
                        )}
                        <span>{formatDateTime(comment.updatedAt)}</span>
                      </div>
                      {isAuthor && (
                        <div className="row-actions">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={isSubmitting}
                                onClick={() => void handleUpdateComment(comment.id)}
                              >
                                저장
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent('');
                                }}
                              >
                                취소
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentContent(comment.content);
                                }}
                              >
                                수정
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                disabled={isSubmitting}
                                onClick={() => void handleDeleteComment(comment.id)}
                              >
                                삭제
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function priorityLabel(priority: TaskPriority) {
  if (priority === 'HIGH') {
    return '높음';
  }
  if (priority === 'LOW') {
    return '낮음';
  }
  return '보통';
}
