import { request } from './client';
import type { UserProfile } from '../types/userProfile';
import type { Task, TaskStatus } from '../types/task';

type WireTask = Omit<Task, 'status'> & {
  status?: TaskStatus;
  completed?: boolean;
};

type WireUserProfile = Omit<UserProfile, 'teams'> & {
  teams: Array<Omit<UserProfile['teams'][number], 'tasks'> & { tasks: WireTask[] }>;
};

function normalize(profile: WireUserProfile): UserProfile {
  return {
    ...profile,
    teams: profile.teams.map((team) => ({
      ...team,
      tasks: team.tasks.map((task) => ({
        ...task,
        status: task.status ?? (task.completed ? 'DONE' : 'BACKLOG'),
      })),
    })),
  };
}

export function getMyProfile() {
  return request<WireUserProfile>('/users/me/profile').then(normalize);
}

export function getUserProfile(userId: number) {
  return request<WireUserProfile>(`/users/${userId}/profile`).then(normalize);
}
