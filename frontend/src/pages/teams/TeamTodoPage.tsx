import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckSquare, Plus, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import { Alert, Badge, Button, EmptyState, LoadingState } from '../../components/ui';
import { dueLabel, priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task, TodoList } from '../../types/task';

export function TeamTodoPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const [todoList, setTodoList] = useState<TodoList | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadTodoList = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await taskApi.getTodoList(numericTeamId);
      setTodoList(data);
      setSelectedIds(data.selectedTasks.map((task) => task.id));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load your todo list.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadTodoList(), [loadTodoList]);

  const tasks = useMemo(() => {
    const byId = new Map<number, Task>();
    todoList?.selectedTasks.forEach((task) => byId.set(task.id, task));
    todoList?.candidateTasks.forEach((task) => byId.set(task.id, task));
    return Array.from(byId.values()).sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected !== bSelected) {
        return aSelected ? -1 : 1;
      }
      return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);
    });
  }, [selectedIds, todoList]);

  const recommendedTasks = useMemo(
    () => (todoList?.recommendedTasks ?? []).filter((task) => !selectedIds.includes(task.id)),
    [selectedIds, todoList],
  );

  function toggleTask(taskId: number) {
    setSavedMessage(null);
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  function addRecommendedTask(taskId: number) {
    setSavedMessage(null);
    setSelectedIds((current) => current.includes(taskId) ? current : [...current, taskId]);
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const data = await taskApi.updateTodoList(numericTeamId, { taskIds: selectedIds });
      setTodoList(data);
      setSelectedIds(data.selectedTasks.map((task) => task.id));
      setSavedMessage('Todo list saved.');
      window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId: numericTeamId } }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save your todo list.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading todo list..." />;
  }

  return (
    <div className="page-container-narrow">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to dashboard
      </button>

      <div className="page-header">
        <div>
          <span className="eyebrow">Personal focus</span>
          <h1 className="page-title">Todo list</h1>
          <p className="page-subtitle">Choose assigned tasks to keep pinned in the lower-left sidebar.</p>
        </div>
        <Button type="button" onClick={() => void handleSave()} isLoading={isSaving}>
          <Save size={14} aria-hidden="true" />
          Save
        </Button>
      </div>

      <Alert message={errorMessage} />
      {savedMessage && <div className="success-banner">{savedMessage}</div>}

      {recommendedTasks.length > 0 && (
        <section className="todo-recommend-section">
          <div className="todo-recommend-head">
            <span className="eyebrow">Recommended</span>
            <span className="todo-recommend-copy">Unblocked tasks assigned to you.</span>
          </div>
          <div className="todo-recommend-list">
            {recommendedTasks.map((task) => (
              <RecommendedTodoTask
                task={task}
                onAdd={() => addRecommendedTask(task.id)}
                teamId={numericTeamId}
                key={task.id}
              />
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={20} aria-hidden="true" />}
          title="No assigned open tasks."
          description="Tasks assigned to you will appear here."
        />
      ) : (
        <div className="todo-editor-list">
          {tasks.map((task) => (
            <TodoEditorRow
              task={task}
              checked={selectedIds.includes(task.id)}
              onToggle={() => toggleTask(task.id)}
              teamId={numericTeamId}
              key={task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendedTodoTask({
  task,
  onAdd,
  teamId,
}: {
  task: Task;
  onAdd: () => void;
  teamId: number;
}) {
  const due = dueLabel(task.dueDate, false);
  const priority = priorityTone(task.priority);

  return (
    <div className="todo-recommend-row">
      <div className="todo-recommend-main">
        <div className="todo-editor-title-row">
          <span className="todo-editor-title">{task.title}</span>
          <Badge variant={priority.variant}>{priority.label}</Badge>
        </div>
        <div className="todo-editor-meta">
          <span className={due.tone === 'overdue' ? 'due-label due-label-overdue' : 'due-label'}>{due.label}</span>
          <Link to={`/teams/${teamId}/tasks/${task.id}`} className="todo-editor-task-link">
            Open task
          </Link>
        </div>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
        <Plus size={13} aria-hidden="true" />
        Add
      </Button>
    </div>
  );
}

function TodoEditorRow({
  task,
  checked,
  onToggle,
  teamId,
}: {
  task: Task;
  checked: boolean;
  onToggle: () => void;
  teamId: number;
}) {
  const due = dueLabel(task.dueDate, task.status === 'DONE');
  const priority = priorityTone(task.priority);

  return (
    <div className={checked ? 'todo-editor-row todo-editor-row-selected' : 'todo-editor-row'}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <div className="todo-editor-main">
        <div className="todo-editor-title-row">
          <span className="todo-editor-title">{task.title}</span>
          <Badge variant={priority.variant}>{priority.label}</Badge>
        </div>
        <div className="todo-editor-meta">
          <span className={due.tone === 'overdue' ? 'due-label due-label-overdue' : 'due-label'}>{due.label}</span>
          <Link to={`/teams/${teamId}/tasks/${task.id}`} className="todo-editor-task-link">
            Open task
          </Link>
        </div>
      </div>
    </div>
  );
}
