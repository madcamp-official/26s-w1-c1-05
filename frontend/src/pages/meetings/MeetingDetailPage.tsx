import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Clock, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Button } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import type { TeamDetail } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function MeetingDetailPage() {
  const { teamId, meetingId } = useParams();
  const numericTeamId = Number(teamId);
  const numericMeetingId = Number(meetingId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    meetingAt: '',
    rawContent: '',
    summary: '',
  });

  useEffect(() => void loadPage(), [numericMeetingId, numericTeamId]);

  const canManage = meeting != null && (meeting.author.id === user?.id || team?.myRole === 'LEADER');

  async function loadPage() {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericMeetingId)) {
      setErrorMessage('Invalid meeting.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [meetingData, teamData] = await Promise.all([
        meetingApi.getMeeting(numericMeetingId),
        teamApi.getTeam(numericTeamId),
      ]);
      setMeeting(meetingData);
      setTeam(teamData);
      setForm({
        title: meetingData.title,
        meetingAt: toDatetimeLocalValue(meetingData.meetingAt),
        rawContent: meetingData.rawContent ?? '',
        summary: meetingData.summary ?? '',
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this meeting.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim() || !form.meetingAt) {
      setErrorMessage('Enter a title and meeting time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await meetingApi.updateMeeting(numericMeetingId, {
        title: form.title,
        meetingAt: toApiDateTime(form.meetingAt),
        rawContent: form.rawContent || undefined,
        summary: form.summary || undefined,
      });
      setMeeting(updated);
      setForm({
        title: updated.title,
        meetingAt: toDatetimeLocalValue(updated.meetingAt),
        rawContent: updated.rawContent ?? '',
        summary: updated.summary ?? '',
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save the meeting.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMeeting() {
    if (!meeting || !window.confirm('Delete this meeting?')) {
      return;
    }
    try {
      setIsSubmitting(true);
      await meetingApi.deleteMeeting(meeting.id);
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/meetings`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not delete the meeting.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="page-container-doc">Loading…</div>;
  }

  if (!meeting) {
    return <Alert message={errorMessage ?? 'Meeting not found.'} />;
  }

  return (
    <div className="page-container-doc">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}/meetings`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        All meetings
      </button>

      <div className="detail-title-row">
        {canManage ? (
          <input
            className="detail-title spec-title-input"
            style={{ marginBottom: 0, flex: 1 }}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        ) : (
          <h1 className="detail-title" style={{ marginBottom: 0 }}>
            {meeting.title}
          </h1>
        )}
        {canManage && (
          <Button type="button" variant="danger" size="sm" disabled={isSubmitting} onClick={() => void handleDeleteMeeting()}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>

      <div className="doc-meta-row">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} color="var(--gray-400)" aria-hidden="true" />
          <span className="mono">{formatDateTime(meeting.meetingAt)}</span>
        </span>
        <span>Logged by {meeting.author.name}</span>
      </div>

      {!canManage && (
        <div className="readonly-note">Only {meeting.author.name} or a team leader can edit this meeting. You're viewing it read-only.</div>
      )}

      <Alert message={errorMessage} />

      <form onSubmit={handleSaveMeeting}>
        <div className="doc-section-head">
          <span className="detail-section-label" style={{ marginBottom: 0 }}>
            Summary
          </span>
        </div>
        <textarea
          className="doc-textarea"
          style={{ minHeight: 140 }}
          value={form.summary}
          disabled={!canManage}
          onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
        />

        <div className="detail-section-label" style={{ margin: '24px 0 10px' }}>
          Raw transcript
        </div>
        <textarea
          className="doc-textarea"
          style={{ minHeight: 180 }}
          value={form.rawContent}
          disabled={!canManage}
          onChange={(event) => setForm((current) => ({ ...current, rawContent: event.target.value }))}
        />

        {canManage && (
          <div className="doc-save-row">
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function toDatetimeLocalValue(value: string) {
  return value.slice(0, 16);
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}
