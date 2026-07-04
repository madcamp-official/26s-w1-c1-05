import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Button, Card, Field, FieldInput } from '../../components/ui';
import { ApiError } from '../../types/api';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Enter your name, email, and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup({ name, email, password });
      navigate('/teams', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="auth-card">
        <h1 className="auth-heading">Create your account</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Field label="Name">
            <FieldInput
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </Field>
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
              autoComplete="new-password"
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
            Create account
          </Button>
        </form>
      </Card>
      <div className="auth-switch">
        Already have an account? <Link className="auth-switch-link" to="/login">Sign in</Link>
      </div>
    </>
  );
}
