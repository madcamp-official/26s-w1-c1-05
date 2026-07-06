import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ListTodo, Lock, Plus, Sparkles } from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';
import * as taskApi from '../../api/taskApi';
import * as taskDependencyApi from '../../api/taskDependencyApi';
import { Alert, Avatar, Badge, Button, Card, EmptyState, IconButton, LoadingState, StatusDot } from '../../components/ui';
import { dueLabel, priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { AiTaskRecommendation, Task, TaskStatus } from '../../types/task';

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockedTaskIds, setBlockedTaskIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AiTaskRecommendation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      const [taskData, dependencyData] = await Promise.all([
        taskApi.getTasks(numericTeamId),
        taskDependencyApi.getTeamDependencies(numericTeamId),
      ]);
      setTasks(taskData);
      setBlockedTaskIds(
        new Set(
          dependencyData
            .filter((dependency) => !dependency.predecessorCompleted)
            .map((dependency) => dependency.successorTaskId),
        ),
      );
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the task board.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const backlogTasks = tasks.filter((task) => task.status === 'BACKLOG');
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((task) => task.status === 'DONE');

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

  async function handleGenerateAiRecommendation() {
    try {
      setIsGeneratingRecommendation(true);
      setErrorMessage(null);
      const recommendation = await taskApi.generateAiTaskRecommendation(numericTeamId);
      setAiRecommendation(recommendation);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not generate a task recommendation.');
    } finally {
      setIsGeneratingRecommendation(false);
    }
  }

  async function handleAcceptAiRecommendation() {
    if (!aiRecommendation) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.acceptAiTaskRecommendation(numericTeamId, aiRecommendation);
      setAiRecommendation(null);
      await loadPage();
      void refreshTeamChrome();
      window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId: numericTeamId } }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not add the recommended task.');
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleGenerateAiRecommendation()}
            isLoading={isGeneratingRecommendation}
          >
            <Sparkles size={15} aria-hidden="true" />
            AI recommend
          </Button>
          <Link to={`/teams/${numericTeamId}/tasks/new`} className="ds-btn ds-btn-primary ds-btn-md">
            <Plus size={15} aria-hidden="true" />
            Add task
          </Link>
        </div>
      </div>

      <Alert message={errorMessage} />

      {aiRecommendation && (
        <Card className="ai-recommendation-card">
          <div className="task-card-top">
            <Badge variant={priorityTone(aiRecommendation.priority).variant}>{priorityTone(aiRecommendation.priority).label}</Badge>
            <span className="task-card-id mono">{aiRecommendation.generatedBy}</span>
          </div>
          <div className="task-card-title">{aiRecommendation.title}</div>
          <div className="task-card-desc">{aiRecommendation.description || 'No description.'}</div>
          {aiRecommendation.reason && <div className="task-card-desc">Reason: {aiRecommendation.reason}</div>}
          <div className="task-card-footer">
            <span className="due-label">{dueLabel(aiRecommendation.dueDate, false).label}</span>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleAcceptAiRecommendation()}
              isLoading={isSubmitting}
            >
              <Plus size={13} aria-hidden="true" />
              Add to Todo
            </Button>
          </div>
        </Card>
      )}

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
            blockedTaskIds={blockedTaskIds}
            onStatusChange={handleStatusChange}
          />
          <TaskColumn
            title="In progress"
            dot={<StatusDot variant="half" />}
            tasks={inProgressTasks}
            emptyLabel="Nothing due soon."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            blockedTaskIds={blockedTaskIds}
            onStatusChange={handleStatusChange}
          />
          <TaskColumn
            title="Done"
            dot={<StatusDot variant="filled" />}
            tasks={completedTasks}
            emptyLabel="Nothing done yet."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            blockedTaskIds={blockedTaskIds}
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
  blockedTaskIds: Set<number>;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
};

function TaskColumn({ title, dot, tasks, emptyLabel, numericTeamId, isSubmitting, blockedTaskIds, onStatusChange }: TaskColumnProps) {
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
                {blockedTaskIds.has(task.id) && (
                  <Badge variant="outline">
                    <Lock size={10} aria-hidden="true" />
                    Blocked
                  </Badge>
                )}
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
