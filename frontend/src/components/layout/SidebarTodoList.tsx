import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import type { Task, TodoList } from '../../types/task';
import { Badge } from '../ui';
import { priorityTone } from '../../utils/format';

type SidebarTodoListProps = {
  teamId: number;
};

export function SidebarTodoList({ teamId }: SidebarTodoListProps) {
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

  const tasks = todoList?.selectedTasks ?? [];
  const firstTask = tasks[0];
  const extraCount = Math.max(0, tasks.length - 1);

  return (
    <div className="sidebar-todo-tab">
      <div className="sidebar-todo-tab-head">
        <div className="sidebar-todo-tab-title">
          <CheckSquare size={15} aria-hidden="true" />
          <span>TODO</span>
        </div>
        <span className="sidebar-todo-more">+ {extraCount} more...</span>
      </div>
      <div className="sidebar-todo-preview">
        {firstTask ? (
          <SidebarTodoPreview task={firstTask} teamId={teamId} />
        ) : (
          <Link to={`/teams/${teamId}/tasks`} className="sidebar-todo-empty-action">
            <span>Get task suggestions</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SidebarTodoPreview({ task, teamId }: { task: Task; teamId: number }) {
  const priority = priorityTone(task.priority);

  return (
    <Link to={`/teams/${teamId}/todos`} className="sidebar-todo-preview-card">
      <div className="dashboard-todo-title-row">
        <span className="dashboard-todo-title">{task.title}</span>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>
    </Link>
  );
}
