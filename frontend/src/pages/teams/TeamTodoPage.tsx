import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckSquare, ChevronDown, ChevronUp, Copy, Plus, Sparkles } from 'lucide-react';
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
  const [promptTaskIds, setPromptTaskIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [isSuggestedOpen, setIsSuggestedOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const latestTodoIdsRef = useRef<number[]>([]);

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
      const todoIds = data.selectedTasks.map((task) => task.id);
      setTodoList(data);
      setPromptTaskIds((prev) => prev.filter((id) => todoIds.includes(id)));
      latestTodoIdsRef.current = todoIds;
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load your todo list.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadTodoList(), [loadTodoList]);

  const tasks = todoList?.selectedTasks ?? [];
  const recommendedTasks = todoList?.recommendedTasks ?? [];

  function togglePromptTask(taskId: number) {
    setPromptTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }

  function addRecommendedTask(taskId: number) {
    const currentIds = latestTodoIdsRef.current;
    if (currentIds.includes(taskId)) {
      return;
    }
    persistTodoIds([...currentIds, taskId]);
  }

  function persistTodoIds(nextIds: number[]) {
    setErrorMessage(null);
    latestTodoIdsRef.current = nextIds;

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const data = await taskApi.updateTodoList(numericTeamId, { taskIds: nextIds });
        if (sameIds(latestTodoIdsRef.current, nextIds)) {
          setTodoList(data);
          latestTodoIdsRef.current = data.selectedTasks.map((task) => task.id);
          window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId: numericTeamId } }));
        }
      })
      .catch((error) => {
        if (sameIds(latestTodoIdsRef.current, nextIds)) {
          setErrorMessage(error instanceof ApiError ? error.message : 'Could not save your todo list.');
          void loadTodoList();
        }
      });
  }

  async function markTaskDone(taskId: number) {
    try {
      await taskApi.updateTaskStatus(taskId, 'DONE');
      window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId: numericTeamId } }));
      void loadTodoList();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not mark this task done.');
    }
  }

  async function handleGeneratePrompt() {
    try {
      setIsGeneratingPrompt(true);
      setErrorMessage(null);
      setGeneratedPrompt(null);
      setIsPromptCopied(false);
      const data = await taskApi.generateTodoPrompt(numericTeamId, promptTaskIds);
      setGeneratedPrompt(data.prompt);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not generate a todo prompt.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  async function handleCopyPrompt() {
    if (!generatedPrompt) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setIsPromptCopied(true);
      setTimeout(() => setIsPromptCopied(false), 1500);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not copy the prompt.');
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
          <p className="page-subtitle">
            Click tasks to select them for prompt generation — with none selected, the whole list is used.
          </p>
        </div>
        <div className="board-toolbar">
          <Button type="button" variant="secondary" onClick={() => void handleGeneratePrompt()} isLoading={isGeneratingPrompt}>
            <Sparkles size={14} aria-hidden="true" />
            Generate prompt
          </Button>
        </div>
      </div>

      <Alert message={errorMessage} />

      {generatedPrompt && (
        <section className="todo-recommend-section">
          <div className="todo-recommend-head">
            <span className="eyebrow">Generated prompt</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopyPrompt()}>
              <Copy size={13} aria-hidden="true" />
              {isPromptCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <pre className="generated-prompt-box">{generatedPrompt}</pre>
        </section>
      )}

      <section className="todo-recommend-section">
        <button
          type="button"
          className={isSuggestedOpen ? 'todo-recommend-head todo-recommend-head-toggle' : 'todo-recommend-head todo-recommend-head-toggle collapsed'}
          aria-expanded={isSuggestedOpen}
          onClick={() => setIsSuggestedOpen((open) => !open)}
        >
          <span className="eyebrow">Suggested ({recommendedTasks.length})</span>
          <span className="todo-recommend-copy">
            Open tasks assigned to you.{' '}
            {isSuggestedOpen ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </button>
        {isSuggestedOpen && (
          <div className="todo-recommend-list">
            {recommendedTasks.length === 0 ? (
              <p className="todo-recommend-copy" style={{ margin: 0 }}>
                No suggestions right now.
              </p>
            ) : (
              recommendedTasks.map((task) => (
                <RecommendedTodoTask
                  task={task}
                  onAdd={() => addRecommendedTask(task.id)}
                  teamId={numericTeamId}
                  key={task.id}
                />
              ))
            )}
          </div>
        )}
      </section>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={20} aria-hidden="true" />}
          title="Your todo list is empty."
          description="Add assigned tasks from the suggestions above."
        />
      ) : (
        <div className="todo-editor-list">
          {tasks.map((task) => (
            <TodoEditorRow
              task={task}
              checked={promptTaskIds.includes(task.id)}
              onToggle={() => togglePromptTask(task.id)}
              onMarkDone={() => void markTaskDone(task.id)}
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
          <span className="todo-editor-title">
            {task.title} <Badge variant={priority.variant}>{priority.label}</Badge>
          </span>
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
  onMarkDone,
  teamId,
}: {
  task: Task;
  checked: boolean;
  onToggle: () => void;
  onMarkDone: () => void;
  teamId: number;
}) {
  const priority = priorityTone(task.priority);

  return (
    <div
      className={checked ? 'todo-editor-row todo-editor-row-selected' : 'todo-editor-row'}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="todo-editor-main">
        <div className="todo-editor-title-row">
          <span className="todo-editor-title">
            {task.title} <Badge variant={priority.variant}>{priority.label}</Badge>
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onMarkDone();
            }}
          >
            <Check size={13} aria-hidden="true" />
            Done
          </Button>
        </div>
        <div className="todo-editor-meta">
          <Link
            to={`/teams/${teamId}/tasks/${task.id}`}
            className="todo-editor-task-link"
            onClick={(event) => event.stopPropagation()}
          >
            Open task
          </Link>
        </div>
      </div>
    </div>
  );
}
