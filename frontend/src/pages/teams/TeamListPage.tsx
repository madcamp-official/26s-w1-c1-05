import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, LogOut, Plus, Search, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Button, Card, EmptyState, Field, FieldInput, LoadingState } from '../../components/ui';
import { ApiError } from '../../types/api';
import type { TeamSummary } from '../../types/team';

export function TeamListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinPasswordTeamId, setJoinPasswordTeamId] = useState<number | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', description: '', password: '' });

  useEffect(() => {
    void loadTeams();
  }, []);

  async function loadTeams(nextKeyword = keyword) {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await teamApi.getTeams({ keyword: nextKeyword.trim() || undefined });
      setTeams(data);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Could not load teams.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!createForm.name.trim()) {
      setErrorMessage('Enter a team name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const team = await teamApi.createTeam({
        name: createForm.name,
        description: createForm.description || undefined,
        password: createForm.password || undefined,
      });
      navigate(`/teams/${team.id}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Could not create the team.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(team: TeamSummary) {
    if (team.joined) {
      navigate(`/teams/${team.id}`);
      return;
    }
    if (team.hasPassword) {
      setJoinPasswordTeamId(team.id);
      setJoinPassword('');
      return;
    }
    await submitJoin(team.id);
  }

  async function handlePasswordJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinPasswordTeamId) {
      return;
    }
    await submitJoin(joinPasswordTeamId, joinPassword);
  }

  async function handleInviteJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!inviteCode.trim()) {
      setErrorMessage('Enter an invite code.');
      return;
    }

    try {
      setIsSubmitting(true);
      const member = await teamApi.joinTeamByInviteCode({ inviteCode });
      navigate(`/teams/${member.teamId}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Could not join with that invite code.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitJoin(teamId: number, password?: string) {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await teamApi.joinTeam(teamId, password ? { password } : undefined);
      navigate(`/teams/${teamId}`);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Could not join the team.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="team-list-shell">
        <header className="simple-topbar">
          <span className="simple-topbar-brand">Scrum Helper</span>
          <div className="topbar-actions">
            <Link to="/profile" className="user-chip user-chip-link">
              <Avatar name={user?.name ?? 'You'} size="sm" />
              <span>{user?.name ?? 'You'}</span>
            </Link>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        </header>

        <div className="page-scroll scroll-area">
          <div className="page-container">
            <div className="page-header">
              <div>
                <h1 className="page-title" style={{ fontSize: 24 }}>
                  Teams
                </h1>
                <p className="page-subtitle">Join a team or start a new one.</p>
              </div>
              <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
                <Plus size={15} aria-hidden="true" />
                Create team
              </Button>
            </div>

            <div className="team-toolbar">
              <form className="invite-join" onSubmit={handleInviteJoin}>
                <KeyRound size={15} color="var(--gray-400)" aria-hidden="true" />
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="Invite code"
                />
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Join
                </Button>
              </form>
              <form
                className="team-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadTeams(keyword);
                }}
              >
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search teams"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </form>
            </div>

            {createOpen && (
              <Card className="fade-in" style={{ marginBottom: 22 }}>
                <form className="auth-form" onSubmit={handleCreate}>
                  <Field label="Team name">
                    <FieldInput
                      type="text"
                      value={createForm.name}
                      onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))}
                    />
                  </Field>
                  <Field label="Description">
                    <FieldInput
                      type="text"
                      value={createForm.description}
                      onChange={(event) =>
                        setCreateForm((form) => ({ ...form, description: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Team password" hint="Leave blank for a public team.">
                    <FieldInput
                      type="password"
                      value={createForm.password}
                      onChange={(event) => setCreateForm((form) => ({ ...form, password: event.target.value }))}
                    />
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="submit" isLoading={isSubmitting}>
                      Create
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <Alert message={errorMessage} />

            {isLoading ? (
              <LoadingState label="Loading teams…" />
            ) : teams.length === 0 ? (
              <EmptyState title="No teams yet." description="Create the first team to start a project." />
            ) : (
              <div className="team-grid">
                {teams.map((team) => (
                  <Card key={team.id} className="team-card">
                    <div className="team-card-head">
                      <span className="team-card-badge">{team.name.slice(0, 2).toUpperCase()}</span>
                      <div className="team-card-info">
                        <div className="team-card-name">{team.name}</div>
                        <div className="team-card-desc">{team.description || 'No description yet.'}</div>
                      </div>
                      <span className={team.hasPassword ? 'ds-badge ds-badge-subtle' : 'ds-badge ds-badge-outline'}>
                        {team.hasPassword ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <div className="team-card-meta">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Users size={13} color="var(--gray-400)" aria-hidden="true" />
                        {team.leader.name}
                      </span>
                      <span className="mono muted">{team.memberCount} members</span>
                    </div>
                    {joinPasswordTeamId === team.id && (
                      <form className="team-card-password fade-in" onSubmit={handlePasswordJoin}>
                        <FieldInput
                          type="password"
                          value={joinPassword}
                          onChange={(event) => setJoinPassword(event.target.value)}
                          placeholder="Team password"
                        />
                        <Button type="submit" size="sm" isLoading={isSubmitting}>
                          Join
                        </Button>
                      </form>
                    )}
                    <div className="team-card-footer">
                      <span className="muted" style={{ fontSize: 12.5 }}>
                        {team.joined ? team.myRole : 'Not joined'}
                      </span>
                      <Button
                        type="button"
                        variant={team.joined ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => void handleJoin(team)}
                      >
                        {team.joined ? 'Open' : team.hasPassword ? 'Enter password' : 'Join'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
