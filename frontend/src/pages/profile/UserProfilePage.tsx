import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../../api/authApi';
import * as userProfileApi from '../../api/userProfileApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Badge, Button, Card, Field, FieldInput, FieldTextarea, LoadingState, StatTile, StatusDot } from '../../components/ui';
import { priorityTone } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Task } from '../../types/task';
import type { UserProfile } from '../../types/userProfile';

export function UserProfilePage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', title: '', bio: '', contact: '' });

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const data = await userProfileApi.getMyProfile();
      setProfile(data);
      setForm({
        name: data.user.name,
        title: data.user.title ?? '',
        bio: data.user.bio ?? '',
        contact: data.user.contact ?? '',
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load your profile.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await authApi.updateProfile({
        name: form.name.trim(),
        title: form.title.trim() || undefined,
        bio: form.bio.trim() || undefined,
        contact: form.contact.trim() || undefined,
      });
      setIsEditing(false);
      await Promise.all([loadProfile(), refreshMe()]);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update your profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading profile…" />;
  }

  if (!profile) {
    return (
      <div className="page-container-narrow">
        <Alert message={errorMessage ?? 'Profile not found.'} />
      </div>
    );
  }

  const totalAssigned = profile.teams.reduce((sum, team) => sum + team.tasks.length, 0);

  return (
    <div className="page-scroll scroll-area">
      <div className="page-container-narrow">
        <button type="button" className="back-link" onClick={() => navigate('/teams')}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to teams
        </button>

        <Alert message={errorMessage} />

        <div className="profile-header">
          <Avatar name={profile.user.name} size="lg" tone="ink" />
          <div className="profile-heading">
            <div className="profile-name-row">
              <h1 className="page-title">{profile.user.name}</h1>
            </div>
            <p className="page-subtitle">{profile.user.title || profile.user.email}</p>
          </div>
          {!isEditing && (
            <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
              <Edit3 size={14} aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>

        <div className="profile-stat-grid">
          <StatTile label="Teams" value={profile.teams.length} caption="Joined" />
          <StatTile label="Completed" value={profile.totalCompletedTaskCount} caption="Across all teams" />
          <StatTile label="Assigned" value={totalAssigned} caption="Tasks in total" />
        </div>

        {isEditing ? (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <Field label="Name">
              <FieldInput
                value={form.name}
                maxLength={50}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Title">
              <FieldInput
                value={form.title}
                maxLength={80}
                placeholder="Designer, backend, PM..."
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>
            <Field label="Contact">
              <FieldInput
                value={form.contact}
                maxLength={200}
                placeholder="Phone, GitHub, Slack handle…"
                onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
              />
            </Field>
            <Field label="Bio">
              <FieldTextarea
                value={form.bio}
                maxLength={500}
                placeholder="A short note for teammates."
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              />
            </Field>
            <div className="profile-edit-actions">
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => setIsEditing(false)}>
                <X size={14} aria-hidden="true" />
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={!form.name.trim()}>
                <Save size={14} aria-hidden="true" />
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="profile-info-grid">
            <section className="profile-info-section">
              <span className="detail-section-label">About</span>
              <p className="profile-bio">{profile.user.bio || 'No bio yet.'}</p>
            </section>
            <section className="profile-info-section">
              <span className="detail-section-label">Contact</span>
              <p className="profile-line">{profile.user.contact || '—'}</p>
              <p className="profile-line">{profile.user.email}</p>
            </section>
          </div>
        )}

        <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
          <span className="detail-section-label">Teams &amp; tasks</span>
          {profile.teams.length === 0 && <p className="muted">No teams joined yet.</p>}
          {profile.teams.map((team) => (
            <Card key={team.teamId}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Link to={`/teams/${team.teamId}`} style={{ fontWeight: 600, fontSize: 15 }}>
                    {team.teamName}
                  </Link>
                  <Badge variant={team.role === 'LEADER' ? 'solid' : 'outline'}>{team.role}</Badge>
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {team.completedTaskCount}/{team.tasks.length} done
                </span>
              </div>
              {team.tasks.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No assigned tasks in this team.</p>
              ) : (
                <div style={{ display: 'grid' }}>
                  {team.tasks.map((task) => (
                    <ProfileTaskRow task={task} teamId={team.teamId} key={task.id} />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTaskRow({ task, teamId }: { task: Task; teamId: number }) {
  const priority = priorityTone(task.priority);
  const dotVariant = task.status === 'DONE' ? 'filled' : task.status === 'IN_PROGRESS' ? 'half' : 'outline';

  return (
    <Link to={`/teams/${teamId}/tasks/${task.id}`} className="wrap-stat-row" style={{ gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <StatusDot variant={dotVariant} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
            color: task.status === 'DONE' ? 'var(--gray-500)' : 'inherit',
          }}
        >
          {task.title}
        </span>
      </span>
      <Badge variant={priority.variant}>{priority.label}</Badge>
    </Link>
  );
}
