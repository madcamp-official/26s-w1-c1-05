import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import type { TeamDetail } from '../../types/team';

export function MeetingDetailPage() {
  const { teamId, meetingId } = useParams();
  const numericTeamId = Number(teamId);
  const numericMeetingId = Number(meetingId);
  const navigate = useNavigate();
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

  const canManage =
    meeting != null &&
    (meeting.author.id === user?.id || team?.myRole === 'LEADER');

  async function loadPage() {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericMeetingId)) {
      setErrorMessage('회의록 정보가 올바르지 않습니다.');
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
      setErrorMessage(error instanceof ApiError ? error.message : '회의록 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveMeeting(event: FormEvent<HTMLFormElement>) {
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
      setErrorMessage(error instanceof ApiError ? error.message : '회의록을 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMeeting() {
    if (!meeting || !window.confirm('이 회의록을 삭제할까요?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await meetingApi.deleteMeeting(meeting.id);
      navigate(`/teams/${numericTeamId}/meetings`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '회의록을 삭제하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="회의록 상세를 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>회의록 상세</h1>
          {meeting && (
            <p className="muted">
              작성 {meeting.author.name} · 회의 {formatDateTime(meeting.meetingAt)}
            </p>
          )}
        </div>
        {meeting && canManage && (
          <Button
            type="button"
            variant="danger"
            disabled={isSubmitting}
            onClick={() => void handleDeleteMeeting()}
          >
            삭제
          </Button>
        )}
      </div>

      <ErrorMessage message={errorMessage} />

      {meeting && (
        <form className="panel form-stack-plain" onSubmit={handleSaveMeeting}>
          {!canManage && (
            <div className="notice">회의록 작성자 또는 팀장만 회의록을 수정하거나 삭제할 수 있습니다.</div>
          )}

          <div className="form-row">
            <label className="field">
              <span>제목</span>
              <input
                type="text"
                value={form.title}
                disabled={!canManage}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>회의 일시</span>
              <input
                type="datetime-local"
                value={form.meetingAt}
                disabled={!canManage}
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
              disabled={!canManage}
              onChange={(event) => setForm((current) => ({ ...current, rawContent: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>요약</span>
            <textarea
              value={form.summary}
              disabled={!canManage}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
            />
          </label>

          {canManage && (
            <div className="form-actions">
              <Button type="submit" isLoading={isSubmitting}>
                저장
              </Button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

function toDatetimeLocalValue(value: string) {
  return value.slice(0, 16);
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
