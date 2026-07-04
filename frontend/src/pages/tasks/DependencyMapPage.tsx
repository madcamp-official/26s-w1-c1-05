import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as taskApi from '../../api/taskApi';
import * as taskDependencyApi from '../../api/taskDependencyApi';
import { Alert, EmptyState, LoadingState, StatusDot } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { Task, TaskDependency } from '../../types/task';
import { layoutDependencyGraph } from '../../utils/dependencyLayout';
import './DependencyMapPage.css';

type NodeRect = { top: number; left: number; width: number; height: number };

function statusDotVariant(status: Task['status']) {
  if (status === 'DONE') return 'filled' as const;
  if (status === 'IN_PROGRESS') return 'half' as const;
  return 'outline' as const;
}

export function DependencyMapPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [positions, setPositions] = useState<Record<number, NodeRect>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());

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
      setDependencies(dependencyData);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load the dependency map.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const { layers, isolatedTasks } = useMemo(() => layoutDependencyGraph(tasks, dependencies), [tasks, dependencies]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const next: Record<number, NodeRect> = {};
    nodeRefs.current.forEach((el, taskId) => {
      const rect = el.getBoundingClientRect();
      next[taskId] = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
      };
    });
    setPositions(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, layers]);

  if (isLoading) {
    return <LoadingState label="Loading dependency map…" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dependency map</h1>
          <p className="page-subtitle">How tasks in this sprint block one another.</p>
        </div>
      </div>

      <Alert message={errorMessage} />

      {dependencies.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={20} aria-hidden="true" />}
          title="No dependencies yet."
          description="Open a task and use 'Add dependency' to link it to another task."
        />
      ) : (
        <>
          <div className="dependency-map" ref={containerRef}>
            <svg className="dependency-map-svg" aria-hidden="true">
              <defs>
                <marker id="dependency-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="var(--gray-400)" />
                </marker>
              </defs>
              {dependencies.map((dependency) => {
                const from = positions[dependency.predecessorTaskId];
                const to = positions[dependency.successorTaskId];
                if (!from || !to) {
                  return null;
                }
                const startX = from.left + from.width;
                const startY = from.top + from.height / 2;
                const endX = to.left;
                const endY = to.top + to.height / 2;
                const controlOffset = Math.max(32, (endX - startX) / 2);
                const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX - 6} ${endY}`;
                return (
                  <path
                    key={dependency.id}
                    d={path}
                    className="dependency-map-edge"
                    markerEnd="url(#dependency-arrow)"
                  />
                );
              })}
            </svg>

            {layers.map((layer, layerIndex) => (
              <div className="dependency-map-layer" key={layerIndex}>
                {layer.map((task) => (
                  <div
                    className="dependency-map-node"
                    key={task.id}
                    ref={(el) => {
                      if (el) {
                        nodeRefs.current.set(task.id, el);
                      } else {
                        nodeRefs.current.delete(task.id);
                      }
                    }}
                    onClick={() => navigate(`/teams/${numericTeamId}/tasks/${task.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        navigate(`/teams/${numericTeamId}/tasks/${task.id}`);
                      }
                    }}
                  >
                    <StatusDot variant={statusDotVariant(task.status)} />
                    <span className="mono dependency-map-node-id">#{task.id}</span>
                    <span className="dependency-map-node-title">{task.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {isolatedTasks.length > 0 && (
            <div className="dependency-map-isolated">
              <span className="dependency-group-label">No dependencies yet</span>
              <div className="dependency-map-isolated-list">
                {isolatedTasks.map((task) => (
                  <button
                    type="button"
                    className="dependency-map-isolated-chip"
                    key={task.id}
                    onClick={() => navigate(`/teams/${numericTeamId}/tasks/${task.id}`)}
                  >
                    <StatusDot variant={statusDotVariant(task.status)} />
                    <span className="mono" style={{ fontSize: 11 }}>
                      #{task.id}
                    </span>
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
