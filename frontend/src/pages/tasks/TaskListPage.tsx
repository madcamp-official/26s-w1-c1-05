import { Fragment, useCallback, useEffect, useState, type DragEvent, type ReactNode } from 'react';
import { ListTodo, Plus, Sparkles } from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';
import * as taskApi from '../../api/taskApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Badge, Button, Card, EmptyState, LoadingState, StatusDot } from '../../components/ui';
import { priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { AiTaskRecommendation, Task, TaskStatus } from '../../types/task';

export function TaskListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todoTaskIds, setTodoTaskIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AiTaskRecommendation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ status: TaskStatus; index: number } | null>(null);
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const { user } = useAuth();

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [taskData, todoData] = await Promise.all([
        taskApi.getTasks(numericTeamId),
        taskApi.getTodoList(numericTeamId).catch(() => null),
      ]);
      setTasks(taskData);
      setTodoTaskIds(new Set((todoData?.selectedTasks ?? []).map((task) => task.id)));
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

  async function handleStatusChange(task: Task, status: TaskStatus, position?: number) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await taskApi.updateTaskStatus(task.id, status, position);
      await loadPage();
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function columnTasksFor(status: TaskStatus) {
    return status === 'BACKLOG' ? backlogTasks : status === 'IN_PROGRESS' ? inProgressTasks : completedTasks;
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, task: Task) {
    setDraggedTaskId(task.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(task.id));
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setDropTarget(null);
  }

  function handleCardDragOver(event: DragEvent<HTMLDivElement>, status: TaskStatus, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const isAfter = event.clientY - rect.top > rect.height / 2;
    setDropTarget({ status, index: index + (isAfter ? 1 : 0) });
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    setDropTarget({ status, index: columnTasksFor(status).length });
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (!dropTarget) {
      return;
    }
    const { status, index } = dropTarget;
    setDropTarget(null);
    const task = tasks.find((candidate) => candidate.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task) {
      return;
    }

    const destinationTasks = columnTasksFor(status);
    const draggedIndex = destinationTasks.findIndex((candidate) => candidate.id === task.id);
    const position = draggedIndex !== -1 && draggedIndex < index ? index - 1 : index;

    if (task.status === status && position === draggedIndex) {
      return;
    }
    void handleStatusChange(task, status, position);
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
            <Badge variant={priorityTone(aiRecommendation.task.priority).variant}>{priorityTone(aiRecommendation.task.priority).label}</Badge>
            <span className="task-card-id mono">{aiRecommendation.generatedBy}</span>
          </div>
          <div className="task-card-title">{aiRecommendation.task.title}</div>
          <div className="task-card-desc">{aiRecommendation.task.description || 'No description.'}</div>
          {aiRecommendation.reason && <div className="task-card-desc">Reason: {aiRecommendation.reason}</div>}
          <div className="task-card-footer">
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
            status="BACKLOG"
            tasks={backlogTasks}
            emptyLabel="Nothing in backlog."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            currentUserId={user?.id}
            todoTaskIds={todoTaskIds}
            draggedTaskId={draggedTaskId}
            dropIndex={dropTarget?.status === 'BACKLOG' ? dropTarget.index : null}
            onDragStartTask={handleDragStart}
            onDragEndTask={handleDragEnd}
            onCardDragOver={(event, index) => handleCardDragOver(event, 'BACKLOG', index)}
            onColumnDragOver={(event) => handleColumnDragOver(event, 'BACKLOG')}
            onDropColumn={handleDrop}
          />
          <TaskColumn
            title="In progress"
            dot={<StatusDot variant="half" />}
            status="IN_PROGRESS"
            tasks={inProgressTasks}
            emptyLabel="Nothing in progress."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            currentUserId={user?.id}
            todoTaskIds={todoTaskIds}
            draggedTaskId={draggedTaskId}
            dropIndex={dropTarget?.status === 'IN_PROGRESS' ? dropTarget.index : null}
            onDragStartTask={handleDragStart}
            onDragEndTask={handleDragEnd}
            onCardDragOver={(event, index) => handleCardDragOver(event, 'IN_PROGRESS', index)}
            onColumnDragOver={(event) => handleColumnDragOver(event, 'IN_PROGRESS')}
            onDropColumn={handleDrop}
          />
          <TaskColumn
            title="Done"
            dot={<StatusDot variant="filled" />}
            status="DONE"
            tasks={completedTasks}
            emptyLabel="Nothing done yet."
            numericTeamId={numericTeamId}
            isSubmitting={isSubmitting}
            currentUserId={user?.id}
            todoTaskIds={todoTaskIds}
            draggedTaskId={draggedTaskId}
            dropIndex={dropTarget?.status === 'DONE' ? dropTarget.index : null}
            onDragStartTask={handleDragStart}
            onDragEndTask={handleDragEnd}
            onCardDragOver={(event, index) => handleCardDragOver(event, 'DONE', index)}
            onColumnDragOver={(event) => handleColumnDragOver(event, 'DONE')}
            onDropColumn={handleDrop}
          />
        </div>
      )}
    </div>
  );
}

type TaskColumnProps = {
  title: string;
  dot: ReactNode;
  status: TaskStatus;
  tasks: Task[];
  emptyLabel: string;
  numericTeamId: number;
  isSubmitting: boolean;
  currentUserId: number | undefined;
  todoTaskIds: Set<number>;
  draggedTaskId: number | null;
  dropIndex: number | null;
  onDragStartTask: (event: DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEndTask: () => void;
  onCardDragOver: (event: DragEvent<HTMLDivElement>, index: number) => void;
  onColumnDragOver: (event: DragEvent<HTMLElement>) => void;
  onDropColumn: (event: DragEvent<HTMLElement>) => void;
};

function TaskColumn({
  title,
  dot,
  tasks,
  emptyLabel,
  numericTeamId,
  isSubmitting,
  currentUserId,
  todoTaskIds,
  draggedTaskId,
  dropIndex,
  onDragStartTask,
  onDragEndTask,
  onCardDragOver,
  onColumnDragOver,
  onDropColumn,
}: TaskColumnProps) {
  return (
    <section
      className={`board-column${dropIndex !== null ? ' board-column-drag-over' : ''}`}
      onDragOver={onColumnDragOver}
      onDrop={onDropColumn}
    >
      <div className="board-column-head">
        <span className="board-column-title">
          {dot}
          {title}
        </span>
        <span className="board-column-count">{tasks.length}</span>
      </div>
      {tasks.map((task, index) => {
        const isDone = task.status === 'DONE';
        const priority = priorityTone(task.priority);
        const isMine = currentUserId != null && task.assignees.some((assignee) => assignee.id === currentUserId);
        const inTodo = todoTaskIds.has(task.id);
        return (
          <Fragment key={task.id}>
            {dropIndex === index && <div className="board-drop-indicator" />}
            <Card
              interactive
              draggable={!isSubmitting}
              onDragStart={(event) => onDragStartTask(event, task)}
              onDragEnd={onDragEndTask}
              onDragOver={(event) => onCardDragOver(event, index)}
              className={`task-card${isDone ? ' task-card-done' : ''}${isMine ? ' task-card-mine' : ''}${inTodo ? ' task-card-todo' : ''}${draggedTaskId === task.id ? ' task-card-dragging' : ''}`}
            >
              <Link
                to={`/teams/${numericTeamId}/tasks/${task.id}`}
                style={{ display: 'contents', color: 'inherit' }}
                draggable={false}
              >
                <div className="task-card-top">
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                  <span className="task-card-id mono">#{task.id}</span>
                </div>
                <div className={`task-card-title${isDone ? ' task-card-title-done' : ''}`}>{task.title}</div>
                <div className="task-card-desc">{task.description || 'No description.'}</div>
              </Link>
              <div className="task-card-footer">
                <div className="task-card-actions">
                  {task.assignees[0] && <Avatar name={task.assignees[0].name} size="sm" />}
                </div>
              </div>
            </Card>
          </Fragment>
        );
      })}
      {dropIndex === tasks.length && <div className="board-drop-indicator" />}
      {tasks.length === 0 && <div className="board-column-empty">{emptyLabel}</div>}
    </section>
  );
}
