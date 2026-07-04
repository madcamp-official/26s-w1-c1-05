import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ListTodo, Plus } from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';
import * as taskApi from '../../api/taskApi';
import { Alert, Avatar, Badge, Card, EmptyState, IconButton, LoadingState, StatusDot } from '../../components/ui';
import { dueLabel, priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task, TaskStatus } from '../../types/task';

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();

  useEffect(() => void loadPage(), [numericTeamId]);

  const backlogTasks = tasks.filter((task) => task.status === 'BACKLOG');
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((task) => task.status === 'DONE');

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

  async function handleStatusChange(task: Task, status: TaskStatus) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.updateTaskStatus(task.id, status);
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
          <Link to={`/teams/${numericTeamId}/tasks/new`} className="ds-btn ds-btn-primary ds-btn-md">
            <Plus size={15} aria-hidden="true" />
            Add task
          </Link>
        </div>
      </div>

      <Alert message={errorMessage} />

      {tasks.length === 0 ? (
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
            onStatusChange={handleStatusChange}
          />
          <TaskColumn
            title="In progress"
            dot={<StatusDot variant="half" />}
            tasks={inProgressTasks}
            emptyLabel="Nothing due soon."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            onStatusChange={handleStatusChange}
          />
          <TaskColumn
            title="Done"
            dot={<StatusDot variant="filled" />}
            tasks={completedTasks}
            emptyLabel="Nothing done yet."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
}

type TaskColumnProps = {
  title: string;
  dot: ReactNode;
  tasks: Task[];
  emptyLabel: string;
  numericTeamId: number;
  isSubmitting: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
};

function TaskColumn({ title, dot, tasks, emptyLabel, numericTeamId, isSubmitting, onStatusChange }: TaskColumnProps) {
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
        const isDone = task.status === 'DONE';
        const due = dueLabel(task.dueDate, isDone);
        const isOverdue = !isDone && due.tone === 'overdue';
        const priority = priorityTone(task.priority);
        return (
          <Card
            key={task.id}
            interactive
            className={`task-card${isDone ? ' task-card-done' : ''}${isOverdue ? ' task-card-overdue' : ''}`}
          >
            <Link to={`/teams/${numericTeamId}/tasks/${task.id}`} style={{ display: 'contents', color: 'inherit' }}>
              <div className="task-card-top">
                <Badge variant={priority.variant}>{priority.label}</Badge>
                <span className="task-card-id mono">#{task.id}</span>
              </div>
              <div className={`task-card-title${isDone ? ' task-card-title-done' : ''}`}>{task.title}</div>
              {!isDone && <div className="task-card-desc">{task.description || 'No description.'}</div>}
            </Link>
            <div className="task-card-footer">
              <span className={`due-label${due.tone === 'overdue' ? ' due-label-overdue' : due.tone === 'soon' ? ' due-label-soon' : ''}`}>
                {due.label}
              </span>
              <div className="task-card-actions">
                {task.assignees[0] && <Avatar name={task.assignees[0].name} size="sm" />}
                {task.status !== 'BACKLOG' && (
                  <IconButton
                    disabled={isSubmitting}
                    title={isDone ? 'Move to in progress' : 'Move to backlog'}
                    onClick={() => void onStatusChange(task, task.status === 'DONE' ? 'IN_PROGRESS' : 'BACKLOG')}
                  >
                    <ChevronLeft size={13} aria-hidden="true" />
                  </IconButton>
                )}
                {task.status !== 'DONE' && (
                  <IconButton
                    disabled={isSubmitting}
                    title={task.status === 'BACKLOG' ? 'Move to in progress' : 'Mark done'}
                    onClick={() => void onStatusChange(task, task.status === 'BACKLOG' ? 'IN_PROGRESS' : 'DONE')}
                  >
                    <ChevronRight size={13} aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {tasks.length === 0 && <div className="board-column-empty">{emptyLabel}</div>}
    </section>
  );
}
