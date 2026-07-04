import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import { Alert, Button, Card, EmptyState, Field, FieldInput, FieldTextarea, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function MeetingListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    meetingAt: toDatetimeLocalValue(new Date()),
    rawContent: '',
    summary: '',
  });

  useEffect(() => void loadPage(), [numericTeamId]);

  async function loadPage() {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('Invalid team.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setMeetings(await meetingApi.getMeetings(numericTeamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load meetings.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim() || !form.meetingAt) {
      setErrorMessage('Enter a title and meeting time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await meetingApi.createMeeting(numericTeamId, {
        title: form.title,
        meetingAt: toApiDateTime(form.meetingAt),
        rawContent: form.rawContent || undefined,
        summary: form.summary || undefined,
      });
      setForm({ title: '', meetingAt: toDatetimeLocalValue(new Date()), rawContent: '', summary: '' });
      setCreateOpen(false);
      await loadPage();
      void refreshTeamChrome();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not log the meeting.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading meetings…" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">Log meeting notes to build the raw material for spec docs.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={15} aria-hidden="true" />
          New meeting
        </Button>
      </div>

      {createOpen && (
        <Card className="fade-in" style={{ marginBottom: 16 }}>
          <form className="auth-form" onSubmit={handleCreateMeeting}>
            <div className="task-form-row">
              <Field label="Title">
                <FieldInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </Field>
              <Field label="Meeting time">
                <FieldInput
                  type="datetime-local"
                  value={form.meetingAt}
                  onChange={(event) => setForm((current) => ({ ...current, meetingAt: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Raw transcript">
              <FieldTextarea
                value={form.rawContent}
                onChange={(event) => setForm((current) => ({ ...current, rawContent: event.target.value }))}
              />
            </Field>
            <Field label="Summary">
              <FieldTextarea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Alert message={errorMessage} />

      {meetings.length === 0 ? (
        <EmptyState
          title="No meetings logged yet."
          description="Record a meeting to build the raw material for auto-generated spec docs."
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New meeting
            </Button>
          }
        />
      ) : (
        <div className="row-list">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              interactive
              className="row-item"
              onClick={() => navigate(`/teams/${numericTeamId}/meetings/${meeting.id}`)}
            >
              <div className="row-icon">
                <CalendarDays size={16} aria-hidden="true" />
              </div>
              <div className="row-body">
                <div className="row-title">{meeting.title}</div>
                <div className="row-subtitle">{meeting.summary || meeting.rawContent || 'No content recorded.'}</div>
              </div>
              <div className="row-meta">
                <div className="row-meta-date">{formatDateTime(meeting.meetingAt)}</div>
                <div className="row-meta-sub">{meeting.author.name}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}
