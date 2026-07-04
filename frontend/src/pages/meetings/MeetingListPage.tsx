import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import { toMeetingListItemView } from '../../viewModels/meetingViewModel';

export function MeetingListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
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
      setErrorMessage('팀 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setMeetings(await meetingApi.getMeetings(numericTeamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회의록 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  const meetingItems = useMemo(() => meetings.map(toMeetingListItemView), [meetings]);

  async function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.title.trim()) {
      setErrorMessage('회의 제목을 입력하세요.');
      return;
    }
    if (!form.meetingAt) {
      setErrorMessage('회의 일시를 입력하세요.');
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
      setForm({
        title: '',
        meetingAt: toDatetimeLocalValue(new Date()),
        rawContent: '',
        summary: '',
      });
      setCreateOpen(false);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회의록을 생성하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="회의록 목록을 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <span className="eyebrow">Meetings</span>
          <h1>회의</h1>
          <p className="muted">회의 내용을 기록하고, 이후 스펙 문서와 task 자동 생성의 입력으로 사용합니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen((open) => !open)}>
          <Plus size={16} aria-hidden="true" />
          회의록 작성
        </Button>
      </div>

      {createOpen && (
        <form className="panel form-stack-plain" onSubmit={handleCreateMeeting}>
          <h2>새 회의록</h2>
          <div className="form-row">
            <label className="field">
              <span>제목</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>회의 일시</span>
              <input
                type="datetime-local"
                value={form.meetingAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, meetingAt: event.target.value }))
                }
              />
            </label>
          </div>
          <label className="field">
            <span>회의 원문</span>
            <textarea
              value={form.rawContent}
              onChange={(event) => setForm((current) => ({ ...current, rawContent: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>요약</span>
            <textarea
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </label>
          <div className="form-actions">
            <Button type="submit" isLoading={isSubmitting}>
              작성
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
          </div>
        </form>
      )}

      <ErrorMessage message={errorMessage} />

      {meetings.length === 0 ? (
        <div className="empty-panel">
          <h2>작성된 회의록이 없습니다.</h2>
          <p>회의 내용을 먼저 기록하면 이후 스펙 초안과 task 추천 기능을 붙이기 쉽습니다.</p>
        </div>
      ) : (
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
          ))}
        </div>
      )}
    </section>
  );
}

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}
