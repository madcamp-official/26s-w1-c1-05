import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import * as authApi from '../../api/authApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Avatar, Badge, Button, Field, FieldInput, FieldTextarea, LoadingState, StatTile } from '../../components/ui';
import { formatDate } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { TeamMemberProfile } from '../../types/team';

export function TeamProfilePage() {
  const { teamId, userId } = useParams();
  const numericTeamId = Number(teamId);
  const numericUserId = Number(userId);
  const { user, refreshMe } = useAuth();
  const [profile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', title: '', bio: '' });
  const isOwnProfile = user?.id === numericUserId;

  const loadProfile = useCallback(async () => {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericUserId)) {
      setErrorMessage('Invalid profile.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await teamApi.getMemberProfile(numericTeamId, numericUserId);
      setProfile(data);
      setForm({
        name: data.user.name,
        title: data.user.title ?? '',
        bio: data.user.bio ?? '',
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this profile.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId, numericUserId]);

  useEffect(() => void loadProfile(), [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !form.name.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await authApi.updateProfile({
        name: form.name.trim(),
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
      });
      await refreshMe();
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not update your profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelEdit() {
    if (!profile) {
      return;
    }
    setForm({
      name: profile.user.name,
      title: profile.user.title ?? '',
      bio: profile.user.bio ?? '',
    });
    setIsEditing(false);
  }

  if (isLoading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="page-container-narrow">
        <Alert message={errorMessage ?? 'Profile not found.'} />
      </div>
    );
  }

  return (
    <div className="page-container-narrow">
      <Alert message={errorMessage} />

      <div className="profile-header">
        <Avatar name={profile.user.name} size="lg" tone="ink" />
        <div className="profile-heading">
          <div className="profile-name-row">
            <h1 className="page-title">{profile.user.name}</h1>
            <Badge variant={profile.role === 'LEADER' ? 'solid' : 'outline'}>{profile.role}</Badge>
          </div>
          <p className="page-subtitle">{profile.user.title || profile.user.email}</p>
        </div>
        {isOwnProfile && !isEditing && (
          <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit3 size={14} aria-hidden="true" />
            Edit
          </Button>
        )}
      </div>

      <div className="profile-stat-grid">
        <StatTile label="Rank" value={`#${profile.rank}`} caption={profile.reputationLevel} />
        <StatTile label="Points" value={profile.points} caption="Weighted by priority" />
        <StatTile label="Cleared tasks" value={profile.completedTaskCount} caption="Assigned and done" />
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
          <Field label="Bio">
            <FieldTextarea
              value={form.bio}
              maxLength={500}
              placeholder="A short note for teammates."
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            />
          </Field>
          <div className="profile-edit-actions">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={cancelEdit}>
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
            <p className="profile-line">{profile.user.email}</p>
          </section>
          <section className="profile-info-section">
            <span className="detail-section-label">Team</span>
            <p className="profile-line">Joined {formatDate(profile.joinedAt)}</p>
          </section>
        </div>
      )}

      <Link to={`/teams/${numericTeamId}/leaderboard`} className="profile-leaderboard-link">
        View full leaderboard
      </Link>
    </div>
  );
}
