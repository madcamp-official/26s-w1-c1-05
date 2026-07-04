<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as teamApi from '../../api/teamApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusDot } from '../../components/common/StatusDot';
import { ApiError } from '../../types/api';
import type { Task, TaskPriority } from '../../types/task';
import type { TeamMember } from '../../types/team';
import { toTaskCardView, type TaskCardView } from '../../viewModels/taskViewModel';
=======
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, ListTodo, Plus, RotateCcw } from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';
import * as taskApi from '../../api/taskApi';
import { Alert, Avatar, Badge, Card, EmptyState, IconButton, LoadingState, SegmentedControl, StatusDot } from '../../components/ui';
import { dueLabel, priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task } from '../../types/task';

type CompletionFilter = 'ALL' | 'OPEN' | 'DONE';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<CompletionFilter>('ALL');
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setTasks(await taskApi.getTasks(numericTeamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the task board.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const visibleTasks = useMemo(() => {
    if (completedFilter === 'OPEN') {
      return tasks.filter((task) => !task.completed);
    }
    if (completedFilter === 'DONE') {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }, [tasks, completedFilter]);

  const taskViews = visibleTasks.map(toTaskCardView);
  const backlogTasks = taskViews.filter((task) => task.column === 'backlog');
  const inProgressTasks = taskViews.filter((task) => task.column === 'progress');
  const completedTasks = taskViews.filter((task) => task.column === 'done');

  async function handleToggleCompletion(task: Task) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.updateTaskCompletion(task.id, !task.completed);
      await loadPage();
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading task board…" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task board</h1>
          <p className="page-subtitle">Backlog, in-progress, and completed work for this sprint.</p>
        </div>
        <div className="board-toolbar">
          <SegmentedControl
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'OPEN', label: 'Open' },
              { value: 'DONE', label: 'Done' },
            ]}
            value={completedFilter}
            onChange={setCompletedFilter}
          />
          <Link to={`/teams/${numericTeamId}/tasks/new`} className="ds-btn ds-btn-primary ds-btn-md">
            <Plus size={15} aria-hidden="true" />
            Add task
          </Link>
        </div>
      </div>

      <Alert message={errorMessage} />

      {visibleTasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={20} aria-hidden="true" />}
          title="No tasks in this sprint yet."
          description="Create the first task and it will grow a branch on the team's tree."
          action={
            <Link to={`/teams/${numericTeamId}/tasks/new`} className="ds-btn ds-btn-primary ds-btn-md">
              Add task
            </Link>
          }
        />
      ) : (
        <div className="board-columns">
          <TaskColumn
            title="Backlog"
            dot={<StatusDot variant="outline" />}
            tasks={backlogTasks}
            emptyLabel="Nothing in backlog."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            onToggle={handleToggleCompletion}
          />
          <TaskColumn
            title="In progress"
            dot={<StatusDot variant="half" />}
            tasks={inProgressTasks}
            emptyLabel="Nothing due soon."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            onToggle={handleToggleCompletion}
          />
          <TaskColumn
            title="Completed"
            dot={<StatusDot variant="filled" />}
            tasks={completedTasks}
            emptyLabel="Nothing done yet."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            onToggle={handleToggleCompletion}
          />
        </div>
      )}
    </div>
  );
}

type TaskColumnProps = {
  title: string;
<<<<<<< HEAD
  description: string;
  tasks: TaskCardView[];
  tone: 'neutral' | 'blue' | 'green';
=======
  dot: ReactNode;
  tasks: Task[];
  emptyLabel: string;
  numericTeamId: number;
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
  isSubmitting: boolean;
  onToggle: (task: Task) => Promise<void>;
};

function TaskColumn({ title, dot, tasks, emptyLabel, numericTeamId, isSubmitting, onToggle }: TaskColumnProps) {
  return (
<<<<<<< HEAD
    <section className={`task-column task-column-${tone}`}>
      <h2>
        {title} <span>{tasks.length}</span>
      </h2>
      <p className="column-description">{description}</p>
      {tasks.map((taskView) => (
        <article className="task-card" key={taskView.task.id}>
          <div className="task-card-top">
            <div>
              <span className="task-id">{taskView.displayId}</span>
              <h3>{taskView.title}</h3>
            </div>
            <span className={`priority priority-${taskView.priority.toLowerCase()}`}>
              {taskView.priorityLabel}
            </span>
          </div>
          <p className="muted">{taskView.description}</p>
          <div className="task-meta">
            <span className="status-line">
              <StatusDot status={taskView.status} />
              {taskView.statusLabel}
            </span>
            <span>{taskView.dueLabel}</span>
            <div className="avatar-row" aria-label="담당자">
              {taskView.task.assignees.map((user) => (
                <InitialsAvatar name={user.name} key={user.id} />
              ))}
              <span>{taskView.assigneeNames}</span>
            </div>
          </div>
          <Button
            type="button"
            variant={taskView.task.completed ? 'secondary' : 'primary'}
            disabled={isSubmitting}
            onClick={() => void onToggle(taskView.task)}
          >
            {taskView.task.completed ? '미완료로 변경' : '완료'}
          </Button>
        </article>
      ))}
=======
    <section className="board-column">
      <div className="board-column-head">
        <span className="board-column-title">
          {dot}
          {title}
        </span>
        <span className="board-column-count">{tasks.length}</span>
      </div>
      {tasks.map((task) => {
        const due = dueLabel(task.dueDate, task.completed);
        const priority = priorityTone(task.priority);
        return (
          <Card key={task.id} interactive className={`task-card${task.completed ? ' task-card-done' : ''}`}>
            <Link to={`/teams/${numericTeamId}/tasks/${task.id}`} style={{ display: 'contents', color: 'inherit' }}>
              <div className="task-card-top">
                <Badge variant={priority.variant}>{priority.label}</Badge>
                <span className="task-card-id mono">#{task.id}</span>
              </div>
              <div className={`task-card-title${task.completed ? ' task-card-title-done' : ''}`}>{task.title}</div>
              {!task.completed && <div className="task-card-desc">{task.description || 'No description.'}</div>}
            </Link>
            <div className="task-card-footer">
              <span className={`due-label${due.tone === 'overdue' ? ' due-label-overdue' : due.tone === 'soon' ? ' due-label-soon' : ''}`}>
                {due.label}
              </span>
              <div className="task-card-actions">
                {task.assignees[0] && <Avatar name={task.assignees[0].name} size="sm" />}
                <IconButton
                  active={task.completed}
                  disabled={isSubmitting}
                  title={task.completed ? 'Reopen task' : 'Mark complete'}
                  onClick={() => void onToggle(task)}
                >
                  {task.completed ? <RotateCcw size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
                </IconButton>
              </div>
            </div>
          </Card>
        );
      })}
      {tasks.length === 0 && <div className="board-column-empty">{emptyLabel}</div>}
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
    </section>
  );
}
