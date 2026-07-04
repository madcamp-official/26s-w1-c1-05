import type { Task, TaskDependency } from '../types/task';

export type DependencyLayout = {
  layers: Task[][];
  isolatedTasks: Task[];
};

export function layoutDependencyGraph(tasks: Task[], dependencies: TaskDependency[]): DependencyLayout {
  const predecessorsOf = new Map<number, number[]>();
  const connectedIds = new Set<number>();

  dependencies.forEach((dependency) => {
    const existing = predecessorsOf.get(dependency.successorTaskId) ?? [];
    existing.push(dependency.predecessorTaskId);
    predecessorsOf.set(dependency.successorTaskId, existing);
    connectedIds.add(dependency.predecessorTaskId);
    connectedIds.add(dependency.successorTaskId);
  });

  const layerCache = new Map<number, number>();

  function computeLayer(taskId: number, visiting: Set<number>): number {
    const cached = layerCache.get(taskId);
    if (cached !== undefined) {
      return cached;
    }
    // A predecessor chain shouldn't revisit a task (the backend rejects cycles), but this
    // is rendering code touching externally-fetched data, so guard against a stale/bad
    // response looping forever instead of trusting the invariant blindly.
    if (visiting.has(taskId)) {
      return 0;
    }
    const predecessorIds = predecessorsOf.get(taskId) ?? [];
    if (predecessorIds.length === 0) {
      layerCache.set(taskId, 0);
      return 0;
    }
    visiting.add(taskId);
    const layer = 1 + Math.max(...predecessorIds.map((id) => computeLayer(id, visiting)));
    visiting.delete(taskId);
    layerCache.set(taskId, layer);
    return layer;
  }

  const layers: Task[][] = [];
  const isolatedTasks: Task[] = [];

  tasks.forEach((task) => {
    if (!connectedIds.has(task.id)) {
      isolatedTasks.push(task);
      return;
    }
    const layer = computeLayer(task.id, new Set());
    if (!layers[layer]) {
      layers[layer] = [];
    }
    layers[layer].push(task);
  });

  return { layers: layers.map((layer) => layer ?? []), isolatedTasks };
}
