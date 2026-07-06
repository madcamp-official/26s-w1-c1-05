import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckSquare, Plus, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import { Alert, Badge, Button, EmptyState, LoadingState } from '../../components/ui';
import { priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task, TodoList } from '../../types/task';

export function TeamTodoPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const [todoList, setTodoList] = useState<TodoList | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [promptGeneratedBy, setPromptGeneratedBy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const latestSaveIdsRef = useRef<number[]>([]);

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
      const nextSelectedIds = data.selectedTasks.map((task) => task.id);
      setTodoList(data);
      setSelectedIds(nextSelectedIds);
      latestSaveIdsRef.current = nextSelectedIds;
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
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [selectedIds, todoList]);

  const recommendedTasks = useMemo(
    () => (todoList?.recommendedTasks ?? []).filter((task) => !selectedIds.includes(task.id)),
    [selectedIds, todoList],
  );

  function toggleTask(taskId: number) {
    const currentIds = latestSaveIdsRef.current;
    const nextIds = currentIds.includes(taskId)
      ? currentIds.filter((id) => id !== taskId)
      : [...currentIds, taskId];
    persistSelectedIds(nextIds);
  }

  function addRecommendedTask(taskId: number) {
    const currentIds = latestSaveIdsRef.current;
    if (currentIds.includes(taskId)) {
      return;
    }
    persistSelectedIds([...currentIds, taskId]);
  }

  function persistSelectedIds(nextIds: number[]) {
    setSelectedIds(nextIds);
    setSavedMessage(null);
    setErrorMessage(null);
    setIsAutoSaving(true);
    latestSaveIdsRef.current = nextIds;

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const data = await taskApi.updateTodoList(numericTeamId, { taskIds: nextIds });
        if (sameIds(latestSaveIdsRef.current, nextIds)) {
          setTodoList(data);
          setSelectedIds(data.selectedTasks.map((task) => task.id));
          setSavedMessage('Saved automatically.');
          window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId: numericTeamId } }));
        }
      })
      .catch((error) => {
        if (sameIds(latestSaveIdsRef.current, nextIds)) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not save your todo list.');
          void loadTodoList();
        }
      })
      .finally(() => {
        if (sameIds(latestSaveIdsRef.current, nextIds)) {
          setIsAutoSaving(false);
        }
      });
  }

  async function handleGeneratePrompt() {
    try {
      setIsGeneratingPrompt(true);
      setErrorMessage(null);
      setGeneratedPrompt(null);
      setPromptGeneratedBy(null);
      const data = await taskApi.generateTodoPrompt(numericTeamId);
      setGeneratedPrompt(data.prompt);
      setPromptGeneratedBy(data.generatedBy);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not generate a todo prompt.');
    } finally {
      setIsGeneratingPrompt(false);
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
        <div className="board-toolbar">
          <Button type="button" variant="secondary" onClick={() => void handleGeneratePrompt()} isLoading={isGeneratingPrompt}>
            <Sparkles size={14} aria-hidden="true" />
            Generate prompt
          </Button>
        </div>
      </div>

      <Alert message={errorMessage} />
      {isAutoSaving && <div className="success-banner">Saving automatically...</div>}
      {savedMessage && <div className="success-banner">{savedMessage}</div>}

      {generatedPrompt && (
        <section className="todo-recommend-section">
          <div className="todo-recommend-head">
            <span className="eyebrow">Generated prompt</span>
            {promptGeneratedBy && <span className="todo-recommend-copy">{promptGeneratedBy}</span>}
          </div>
          <pre className="generated-prompt-box">{generatedPrompt}</pre>
        </section>
      )}

      {recommendedTasks.length > 0 && (
        <section className="todo-recommend-section">
          <div className="todo-recommend-head">
            <span className="eyebrow">Suggested</span>
            <span className="todo-recommend-copy">Open tasks assigned to you.</span>
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

function sameIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
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
  const priority = priorityTone(task.priority);

  return (
    <div className="todo-recommend-row">
      <div className="todo-recommend-main">
        <div className="todo-editor-title-row">
          <span className="todo-editor-title">{task.title}</span>
          <Badge variant={priority.variant}>{priority.label}</Badge>
        </div>
        <div className="todo-editor-meta">
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
          <Link to={`/teams/${teamId}/tasks/${task.id}`} className="todo-editor-task-link">
            Open task
          </Link>
        </div>
      </div>
    </div>
  );
}
