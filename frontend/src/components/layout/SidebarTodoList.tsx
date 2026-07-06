import { useCallback, useEffect, useState } from 'react';
import { CheckSquare, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import { dueLabel, priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task, TodoList } from '../../types/task';
import { Badge } from '../ui';

type SidebarTodoListProps = {
  teamId: number;
};

export function SidebarTodoList({ teamId }: SidebarTodoListProps) {
  const [todoList, setTodoList] = useState<TodoList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTodoList = useCallback(async () => {
    if (!Number.isFinite(teamId)) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await taskApi.getTodoList(teamId);
      setTodoList(data);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load todos.');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => void loadTodoList(), [loadTodoList]);

  const selectedTasks = todoList?.selectedTasks ?? [];

  useEffect(() => {
    function handleTodoUpdated(event: Event) {
      const detail = (event as CustomEvent<{ teamId: number }>).detail;
      if (detail?.teamId === teamId) {
        void loadTodoList();
      }
    }

    window.addEventListener('todo-list-updated', handleTodoUpdated);
    return () => window.removeEventListener('todo-list-updated', handleTodoUpdated);
  }, [loadTodoList, teamId]);

  return (
    <section className="sidebar-todo">
      <div className="sidebar-todo-head">
        <span className="sidebar-todo-title">
          <CheckSquare size={14} aria-hidden="true" />
          Todo
        </span>
        <Link
          to={`/teams/${teamId}/todos`}
          className={isLoading ? 'sidebar-todo-edit-link sidebar-todo-edit-link-disabled' : 'sidebar-todo-edit-link'}
          title="Edit todo list"
          aria-disabled={isLoading}
        >
          <Edit3 size={13} aria-hidden="true" />
        </Link>
      </div>

      {errorMessage && <div className="sidebar-todo-error">{errorMessage}</div>}

      {selectedTasks.length === 0 ? (
        <div className="sidebar-todo-empty">{isLoading ? 'Loading todos...' : 'Pick tasks to focus on.'}</div>
      ) : (
        <div className="sidebar-todo-list">
          {selectedTasks.map((task) => (
            <TodoItem task={task} teamId={teamId} key={task.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function TodoItem({ task, teamId }: { task: Task; teamId: number }) {
  const isDone = task.status === 'DONE';
  const due = dueLabel(task.dueDate, isDone);
  const priority = priorityTone(task.priority);

  return (
    <Link to={`/teams/${teamId}/tasks/${task.id}`} className={isDone ? 'sidebar-todo-item sidebar-todo-item-done' : 'sidebar-todo-item'}>
      <span className="sidebar-todo-item-title">{task.title}</span>
      <span className="sidebar-todo-item-meta">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <span className={due.tone === 'overdue' ? 'sidebar-todo-due sidebar-todo-due-overdue' : 'sidebar-todo-due'}>
          {due.label}
        </span>
      </span>
    </Link>
  );
}
