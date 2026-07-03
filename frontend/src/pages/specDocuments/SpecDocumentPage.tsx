import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import * as specDocumentApi from '../../api/specDocumentApi';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingState } from '../../components/common/LoadingState';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import type { SpecDocument, SpecDraft } from '../../types/specDocument';

export function SpecDocumentPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<SpecDocument[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<number[]>([]);
  const [draft, setDraft] = useState<SpecDraft | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    if (!Number.isFinite(numericTeamId)) {
      setErrorMessage('팀 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [meetingList, documentList] = await Promise.all([
        meetingApi.getMeetings(numericTeamId),
        specDocumentApi.getSpecDocuments(numericTeamId),
      ]);
      setMeetings(meetingList);
      setDocuments(documentList);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '스펙 문서 화면을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [numericTeamId]);

  useEffect(() => void loadPage(), [loadPage]);

  async function handleGenerateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedMeetingIds.length === 0) {
      setErrorMessage('스펙 초안을 만들 회의록을 1개 이상 선택하세요.');
      return;
    }

    try {
      setIsGenerating(true);
      const generatedDraft = await specDocumentApi.generateSpecDraft(numericTeamId, {
        meetingIds: selectedMeetingIds,
      });
      setDraft(generatedDraft);
      setTitle(generatedDraft.title);
      setContent(generatedDraft.content);
      setSuccessMessage(
        generatedDraft.generatedBy === 'GEMINI'
          ? 'Gemini로 스펙 초안을 생성했습니다.'
          : '로컬 규칙 기반 스펙 초안을 생성했습니다.',
      );
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '스펙 초안을 생성하지 못했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !content.trim()) {
      setErrorMessage('문서 제목과 내용을 모두 입력하세요.');
      return;
    }

    try {
      setIsSaving(true);
      const savedDocument = await specDocumentApi.createSpecDocument(numericTeamId, {
        title,
        content,
        sourceMeetingIds: draft?.sourceMeetingIds ?? selectedMeetingIds,
      });
      setDocuments((current) => [savedDocument, ...current]);
      setSuccessMessage('스펙 문서를 저장했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '스펙 문서를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  function toggleMeeting(meetingId: number) {
    setSelectedMeetingIds((current) =>
      current.includes(meetingId)
        ? current.filter((id) => id !== meetingId)
        : [...current, meetingId],
    );
  }

  if (isLoading) {
    return <LoadingState label="스펙 문서 화면을 불러오고 있습니다." />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>스펙 문서</h1>
          <p className="muted">회의록을 선택해 프로젝트 스펙 초안을 만들고 저장합니다.</p>
        </div>
        <Link className="button button-secondary button-link" to={`/teams/${numericTeamId}/meetings`}>
          회의록 관리
        </Link>
      </div>

      <ErrorMessage message={errorMessage} />
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div className="spec-layout">
        <form className="panel form-stack-plain" onSubmit={handleGenerateDraft}>
          <div className="section-heading">
            <div>
              <h2>회의록 선택</h2>
              <p className="muted">스펙 근거로 사용할 회의록을 복수 선택할 수 있습니다.</p>
            </div>
            <span className="soft-pill">{selectedMeetingIds.length}개 선택</span>
          </div>

          {meetings.length === 0 ? (
            <div className="empty-panel compact">
              <h2>회의록이 없습니다.</h2>
              <p>먼저 회의 탭에서 회의록을 작성하세요.</p>
            </div>
          ) : (
            <div className="meeting-choice-list">
              {meetings.map((meeting) => (
                <label className="meeting-choice" key={meeting.id}>
                  <input
                    type="checkbox"
                    checked={selectedMeetingIds.includes(meeting.id)}
                    onChange={() => toggleMeeting(meeting.id)}
                  />
                  <span>
                    <strong>{meeting.title}</strong>
                    <small>
                      {formatDateTime(meeting.meetingAt)} · {meeting.author.name}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          )}

          <Button type="submit" isLoading={isGenerating} disabled={meetings.length === 0}>
            스펙 초안 생성
          </Button>
        </form>

        <form className="panel form-stack-plain spec-editor" onSubmit={handleSaveDocument}>
          <div className="section-heading">
            <div>
              <h2>생성된 초안</h2>
              <p className="muted">초안을 검토한 뒤 필요한 내용을 수정해 저장하세요.</p>
            </div>
            {draft && (
              <span className={draft.generatedBy === 'GEMINI' ? 'soft-pill success' : 'soft-pill'}>
                {draft.generatedBy === 'GEMINI' ? 'Gemini' : 'Local'}
              </span>
            )}
          </div>

          <label className="field">
            <span>문서 제목</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="스펙 문서 제목"
            />
          </label>
          <label className="field">
            <span>문서 내용</span>
            <textarea
              className="spec-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="회의록을 선택하고 스펙 초안을 생성하세요."
            />
          </label>
          <Button type="submit" isLoading={isSaving} disabled={!content.trim()}>
            스펙 문서 저장
          </Button>
        </form>
      </div>

      <section className="document-panel">
        <div className="section-heading">
          <h2>저장된 스펙 문서</h2>
          <span className="soft-pill">{documents.length}개</span>
        </div>

        {documents.length === 0 ? (
          <div className="empty-panel">
            <h2>저장된 스펙 문서가 없습니다.</h2>
            <p>회의록을 기반으로 초안을 만든 뒤 저장하면 이곳에서 확인할 수 있습니다.</p>
          </div>
        ) : (
          <div className="retro-grid">
            {documents.map((document) => (
              <article className="retro-card" key={document.id}>
                <div className="retro-card-header">
                  <div>
                    <h2>{document.title}</h2>
                    <p className="muted">
                      작성 {document.createdBy.name} · 수정 {formatDateTime(document.updatedAt)}
                    </p>
                  </div>
                  <span className="badge">Spec</span>
                </div>
                <pre className="spec-preview">{document.content}</pre>
                <p className="muted">근거 회의록 {document.sourceMeetingIds.length}개</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
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
