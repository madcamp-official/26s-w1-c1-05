import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Button, Card, Field, FieldInput } from '../../components/ui';
import { ApiError } from '../../types/api';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/teams', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="auth-card">
        <h1 className="auth-heading">Sign in</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Field label="Email">
            <FieldInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@team.com"
            />
          </Field>
          <Field label="Password">
            <FieldInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          {errorMessage && (
            <div className="auth-error">
              <CircleAlert size={14} aria-hidden="true" />
              {errorMessage}
            </div>
          )}
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </Card>
      <div className="auth-switch">
        Don't have an account? <Link className="auth-switch-link" to="/signup">Sign up</Link>
      </div>
    </>
  );
}
