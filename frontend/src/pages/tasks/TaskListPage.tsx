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

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<CompletionFilter>('ALL');
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();

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

  const backlogTasks = visibleTasks.filter((task) => !task.completed && !isInProgress(task));
  const inProgressTasks = visibleTasks.filter((task) => !task.completed && isInProgress(task));
  const completedTasks = visibleTasks.filter((task) => task.completed);

  async function loadPage() {
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
  }

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

function isInProgress(task: Task) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000);
  return diffDays <= 2;
}

type TaskColumnProps = {
  title: string;
  dot: ReactNode;
  tasks: Task[];
  emptyLabel: string;
  numericTeamId: number;
  isSubmitting: boolean;
  onToggle: (task: Task) => Promise<void>;
};

function TaskColumn({ title, dot, tasks, emptyLabel, numericTeamId, isSubmitting, onToggle }: TaskColumnProps) {
  return (
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
    </section>
  );
}
