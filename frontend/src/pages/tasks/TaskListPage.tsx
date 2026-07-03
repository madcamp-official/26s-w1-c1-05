import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Task, TaskPriority } from '../../types/task';
import type { TeamMember } from '../../types/team';

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [completedFilter, setCompletedFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
    assigneeUserIds: [] as number[],
  });

  useEffect(() => void loadPage(), [numericTeamId]);

  const visibleTasks = useMemo(() => {
    if (completedFilter === 'OPEN') {
      return tasks.filter((task) => !task.completed);
    }
    if (completedFilter === 'DONE') {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }, [tasks, completedFilter]);

  const incompleteTasks = visibleTasks.filter((task) => !task.completed);
  const completedTasks = visibleTasks.filter((task) => task.completed);

  async function loadPage() {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('팀 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [taskData, memberData] = await Promise.all([
        taskApi.getTasks(numericTeamId),
        teamApi.getMembers(numericTeamId),
      ]);
      setTasks(taskData);
      setMembers(memberData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'task 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
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
      await taskApi.createTask(numericTeamId, {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate,
        assigneeUserIds: form.assigneeUserIds,
      });
      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeUserIds: [],
      });
      setCreateOpen(false);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'task를 생성하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompletion(task: Task) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.updateTaskCompletion(task.id, !task.completed);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '완료 상태를 변경하지 못했습니다.');
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
    return <LoadingState label="task 목록을 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Task 목록</h1>
          <p className="muted">Team #{teamId}의 할 일을 등록하고 완료 상태를 관리합니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          Task 생성
        </Button>
      </div>

      <div className="segmented">
        <button
          type="button"
          className={completedFilter === 'ALL' ? 'active' : ''}
          onClick={() => setCompletedFilter('ALL')}
        >
          전체
        </button>
        <button
          type="button"
          className={completedFilter === 'OPEN' ? 'active' : ''}
          onClick={() => setCompletedFilter('OPEN')}
        >
          미완료
        </button>
        <button
          type="button"
          className={completedFilter === 'DONE' ? 'active' : ''}
          onClick={() => setCompletedFilter('DONE')}
        >
          완료
        </button>
      </div>

      {createOpen && (
        <form className="panel form-stack-plain" onSubmit={handleCreateTask}>
          <h2>새 Task</h2>
          <label className="field">
            <span>제목</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>설명</span>
            <input
              type="text"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
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
              생성
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
          </div>
        </form>
      )}

      <ErrorMessage message={errorMessage} />

      {visibleTasks.length === 0 ? (
        <div className="empty-panel">
          <h2>등록된 task가 없습니다.</h2>
          <p>첫 task를 생성하고 담당자를 지정하세요.</p>
        </div>
      ) : (
        <div className="task-board">
          <TaskColumn
            title="미완료"
            tasks={incompleteTasks}
            isSubmitting={isSubmitting}
            onToggle={handleToggleCompletion}
          />
          <TaskColumn
            title="완료"
            tasks={completedTasks}
            isSubmitting={isSubmitting}
            onToggle={handleToggleCompletion}
          />
        </div>
      )}
    </section>
  );
}

type TaskColumnProps = {
  title: string;
  tasks: Task[];
  isSubmitting: boolean;
  onToggle: (task: Task) => Promise<void>;
};

function TaskColumn({ title, tasks, isSubmitting, onToggle }: TaskColumnProps) {
  return (
    <section className="task-column">
      <h2>
        {title} <span>{tasks.length}</span>
      </h2>
      {tasks.map((task) => (
        <article className="task-card" key={task.id}>
          <div className="task-card-top">
            <h3>{task.title}</h3>
            <span className={`priority priority-${task.priority.toLowerCase()}`}>
              {priorityLabel(task.priority)}
            </span>
          </div>
          <p className="muted">{task.description || '설명이 없습니다.'}</p>
          <div className="task-meta">
            <span>마감 {task.dueDate}</span>
            <span>담당 {task.assignees.map((user) => user.name).join(', ')}</span>
          </div>
          <Button
            type="button"
            variant={task.completed ? 'secondary' : 'primary'}
            disabled={isSubmitting}
            onClick={() => void onToggle(task)}
          >
            {task.completed ? '미완료로 변경' : '완료'}
          </Button>
        </article>
      ))}
    </section>
  );
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
