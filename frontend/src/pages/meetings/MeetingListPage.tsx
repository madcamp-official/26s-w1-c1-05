<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
=======
import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
import * as meetingApi from '../../api/meetingApi';
import { Alert, Button, Card, EmptyState, Field, FieldInput, FieldTextarea, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
<<<<<<< HEAD
import { toMeetingListItemView } from '../../viewModels/meetingViewModel';
=======
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92

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

  const loadPage = useCallback(async () => {
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
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const meetingItems = useMemo(() => meetings.map(toMeetingListItemView), [meetings]);

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
<<<<<<< HEAD
          <span className="eyebrow">Meetings</span>
          <h1>회의</h1>
          <p className="muted">회의 내용을 기록하고, 이후 스펙 문서와 task 자동 생성의 입력으로 사용합니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={16} aria-hidden="true" />
          회의록 작성
=======
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">Log meeting notes to build the raw material for spec docs.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={15} aria-hidden="true" />
          New meeting
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
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
<<<<<<< HEAD
        <div className="document-list">
          {meetingItems.map((item) => (
            <Link
              className="document-list-row"
              key={item.meeting.id}
              to={`/teams/${numericTeamId}/meetings/${item.meeting.id}`}
            >
              <span className="document-list-icon">
                <CalendarDays size={16} aria-hidden="true" />
              </span>
              <span className="document-list-main">
                <strong>{item.title}</strong>
                <small>{item.summaryPreview}</small>
              </span>
              <span className="document-list-meta">
                <strong>{item.displayId}</strong>
                <small>
                  {item.dateLabel} · {item.authorLabel}
                </small>
              </span>
            </Link>
=======
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
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
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
