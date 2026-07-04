import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { router } from './app/router';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
