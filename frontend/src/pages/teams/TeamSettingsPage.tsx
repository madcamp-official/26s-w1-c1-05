import { useEffect, useState, type FormEvent } from 'react';
import { Copy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { Alert, Button, Card, Field, FieldInput, FieldTextarea, LoadingState, useConfirm, useToast } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TeamRole } from '../../types/team';

export function TeamSettingsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      if (!Number.isFinite(numericTeamId)) {
        setErrorMessage('Invalid team.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const team = await teamApi.getTeam(numericTeamId);
        setName(team.name);
        setDescription(team.description ?? '');
        setHasPassword(team.hasPassword);
        setInviteCode(team.inviteCode);
        setMyRole(team.myRole);
      } catch (error) {
        setErrorMessage(error instanceof ApiError ? error.message : 'Could not load team settings.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadTeam();
  }, [numericTeamId]);

  const canManageTeam = myRole === 'LEADER';

  async function handleUpdateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Enter a team name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const team = await teamApi.updateTeam(numericTeamId, {
        name,
        description: description || undefined,
      });
      setName(team.name);
      setDescription(team.description ?? '');
      setSuccessMessage('Team info saved.');
      toast();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save team info.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRotateInviteCode() {
    if (!await confirm({ title: 'Regenerate invite code?', message: 'The current invite code will stop working.', confirmLabel: 'Regenerate' })) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setIsSubmitting(true);
      const result = await teamApi.rotateInviteCode(numericTeamId);
      setInviteCode(result.inviteCode);
      setSuccessMessage('Invite code regenerated.');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not regenerate the invite code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPassword(password || null);
  }

  async function handleClearPassword() {
    if (!await confirm({ title: 'Make team public?', message: 'Anyone with access can join without a password.', confirmLabel: 'Make public' })) {
      return;
    }
    await submitPassword(null);
  }

  async function submitPassword(nextPassword: string | null) {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setIsSubmitting(true);
      const result = await teamApi.updateTeamPassword(numericTeamId, { password: nextPassword });
      setHasPassword(result.hasPassword);
      setPassword('');
      setSuccessMessage(result.hasPassword ? 'Join password updated.' : 'Team is now public.');
      toast();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update the join password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) {
      return;
    }
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return <LoadingState label="Loading team settings…" />;
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Team settings</h1>
        <p className="page-subtitle">Manage team info, the join password, and the invite code.</p>
      </div>

      {!canManageTeam && (
        <div className="readonly-note">Only the team leader can change these settings. You have read-only access.</div>
      )}
      <Alert message={errorMessage} />
      {successMessage && <Alert message={successMessage} tone="success" />}

      <Card className="settings-section">
        <div className="settings-section-label">Team info</div>
        <form className="settings-field-group" onSubmit={handleUpdateTeam}>
          <Field label="Team name">
            <FieldInput value={name} disabled={!canManageTeam} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description">
            <FieldTextarea
              value={description}
              disabled={!canManageTeam}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <div>
            <Button type="submit" isLoading={isSubmitting} disabled={!canManageTeam}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card className="settings-section">
        <div className="settings-section-label">Join password</div>
        <p className="page-subtitle" style={{ margin: '0 0 16px' }}>
          {hasPassword ? 'This team requires a password to join.' : 'This team is public — anyone can join.'}
        </p>
        <form className="settings-row" onSubmit={handleUpdatePassword}>
          <FieldInput
            type="password"
            value={password}
            disabled={!canManageTeam}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
          />
          <Button type="submit" isLoading={isSubmitting} disabled={!canManageTeam}>
            Update
          </Button>
          {hasPassword && (
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || !canManageTeam}
              onClick={() => void handleClearPassword()}
            >
              Remove
            </Button>
          )}
        </form>
      </Card>

      <Card className="settings-section" style={{ marginBottom: 0 }}>
        <div className="settings-section-label">Invite code</div>
        <p className="page-subtitle" style={{ margin: '0 0 16px' }}>
          Share this code so teammates can join instantly from the teams page.
        </p>
        <div className="settings-row">
          <div className="invite-code-box">
            <span className="invite-code-value">{inviteCode}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopyCode()}>
              <Copy size={13} aria-hidden="true" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <Button type="button" variant="secondary" disabled={isSubmitting || !canManageTeam} onClick={() => void handleRotateInviteCode()}>
            Regenerate
          </Button>
        </div>
      </Card>
    </div>
  );
}
