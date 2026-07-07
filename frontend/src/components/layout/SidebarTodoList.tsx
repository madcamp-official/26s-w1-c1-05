import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import type { Task, TodoList } from '../../types/task';
import { Badge, Button } from '../ui';
import { priorityTone } from '../../utils/format';

type SidebarTodoListProps = {
  teamId: number;
};

export function SidebarTodoList({ teamId }: SidebarTodoListProps) {
  const navigate = useNavigate();
  const [todoList, setTodoList] = useState<TodoList | null>(null);

  const loadTodoList = useCallback(async () => {
    if (!Number.isFinite(teamId)) {
      return;
    }

    try {
      setTodoList(await taskApi.getTodoList(teamId));
    } catch {
      setTodoList(null);
    }
  }, [teamId]);

  useEffect(() => void loadTodoList(), [loadTodoList]);

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

  async function markDone(taskId: number) {
    try {
      await taskApi.updateTaskStatus(taskId, 'DONE');
      window.dispatchEvent(new CustomEvent('todo-list-updated', { detail: { teamId } }));
      void loadTodoList();
    } catch {
      // this compact widget stays silent on failure; the full todo page surfaces real errors
    }
  }

  const tasks = todoList?.selectedTasks ?? [];
  const firstTask = tasks[0];
  const extraCount = Math.max(0, tasks.length - 1);

  function goToTodoList() {
    navigate(`/teams/${teamId}/todos`);
  }

  return (
    <div
      className="sidebar-todo-tab"
      role="button"
      tabIndex={0}
      onClick={goToTodoList}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goToTodoList();
        }
      }}
    >
      <div className="sidebar-todo-tab-head">
        <div className="sidebar-todo-tab-title">
          <CheckSquare size={15} aria-hidden="true" />
          <span>TODO</span>
        </div>
        {extraCount > 0 && <span className="sidebar-todo-more">+ {extraCount} more...</span>}
      </div>
      <div className="sidebar-todo-preview">
        {firstTask ? (
          <SidebarTodoPreview task={firstTask} teamId={teamId} onMarkDone={() => void markDone(firstTask.id)} />
        ) : (
          <Link
            to={`/teams/${teamId}/tasks`}
            className="sidebar-todo-empty-action"
            onClick={(event) => event.stopPropagation()}
          >
            <span>Get task suggestions</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SidebarTodoPreview({
  task,
  teamId,
  onMarkDone,
}: {
  task: Task;
  teamId: number;
  onMarkDone: () => void;
}) {
  const priority = priorityTone(task.priority);
  const navigate = useNavigate();

  function openTask() {
    navigate(`/teams/${teamId}/tasks/${task.id}`);
  }

  return (
    <div
      className="sidebar-todo-preview-card"
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        openTask();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          openTask();
        }
      }}
    >
      <div className="dashboard-todo-title-row">
        <span className="dashboard-todo-title">
          {task.title} <Badge variant={priority.variant}>{priority.label}</Badge>
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Mark done"
          onClick={(event) => {
            event.stopPropagation();
            onMarkDone();
          }}
        >
          <Check size={12} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
