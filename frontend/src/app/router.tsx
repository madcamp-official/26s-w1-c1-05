import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { TeamLayout } from '../components/layout/TeamLayout';
import { LoadingState } from '../components/common/LoadingState';
import { useAuth } from '../auth/useAuth';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { TeamListPage } from '../pages/teams/TeamListPage';
import { TeamDashboardPage } from '../pages/teams/TeamDashboardPage';
import { TeamMembersPage } from '../pages/teams/TeamMembersPage';
import { TeamSettingsPage } from '../pages/teams/TeamSettingsPage';
import { TaskListPage } from '../pages/tasks/TaskListPage';
import { TaskDetailPage } from '../pages/tasks/TaskDetailPage';
import { MeetingListPage } from '../pages/meetings/MeetingListPage';
import { MeetingDetailPage } from '../pages/meetings/MeetingDetailPage';
import { RetrospectiveListPage } from '../pages/retrospectives/RetrospectiveListPage';
import { RetrospectiveDetailPage } from '../pages/retrospectives/RetrospectiveDetailPage';

function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === 'loading') {
    return <LoadingState label="인증 상태를 확인하고 있습니다." />;
  }
  if (status === 'authenticated') {
    return <Navigate to="/teams" replace />;
  }
  return <Outlet />;
}

function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingState label="인증 상태를 확인하고 있습니다." />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/teams" replace /> },
          { path: '/teams', element: <TeamListPage /> },
          {
            path: '/teams/:teamId',
            element: <TeamLayout />,
            children: [
              { index: true, element: <TeamDashboardPage /> },
              { path: 'members', element: <TeamMembersPage /> },
              { path: 'settings', element: <TeamSettingsPage /> },
              { path: 'meetings', element: <MeetingListPage /> },
              { path: 'meetings/:meetingId', element: <MeetingDetailPage /> },
              { path: 'tasks', element: <TaskListPage /> },
              { path: 'tasks/:taskId', element: <TaskDetailPage /> },
              { path: 'retrospectives', element: <RetrospectiveListPage /> },
              {
                path: 'retrospectives/:retrospectiveId',
                element: <RetrospectiveDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/teams" replace /> },
]);
