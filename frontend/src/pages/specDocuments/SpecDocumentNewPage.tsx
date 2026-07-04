import { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as meetingApi from '../../api/meetingApi';
import * as specDocumentApi from '../../api/specDocumentApi';
import { Alert, Button, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { Meeting } from '../../types/meeting';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

type Phase = 'pick' | 'generating' | 'edit';

export function SpecDocumentNewPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('pick');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftSourceIds, setDraftSourceIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => void loadMeetings(), [numericTeamId]);

  async function loadMeetings() {
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

  function toggleMeeting(meetingId: number) {
    setSelectedMeetingIds((current) =>
      current.includes(meetingId) ? current.filter((id) => id !== meetingId) : [...current, meetingId],
    );
  }

  async function handleGenerate() {
    if (selectedMeetingIds.length === 0) {
      setErrorMessage('Select at least one meeting.');
      return;
    }
    setErrorMessage(null);
    setPhase('generating');
    try {
      const draft = await specDocumentApi.generateSpecDraft(numericTeamId, { meetingIds: selectedMeetingIds });
      setDraftTitle(draft.title);
      setDraftBody(draft.content);
      setDraftGenerated(true);
      setDraftSourceIds(draft.sourceMeetingIds);
      setPhase('edit');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not generate the spec.');
      setPhase('pick');
    }
  }

  function handleStartBlank() {
    setDraftTitle('');
    setDraftBody('');
    setDraftGenerated(false);
    setDraftSourceIds(selectedMeetingIds);
    setPhase('edit');
  }

  async function handleConfirm() {
    if (!draftTitle.trim() || !draftBody.trim()) {
      setErrorMessage('Enter a title and body for the spec.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const document = await specDocumentApi.createSpecDocument(numericTeamId, {
        title: draftTitle,
        content: draftBody,
        sourceMeetingIds: draftSourceIds,
      });
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/spec-documents/${document.id}`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save the spec.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading…" />;
  }

  return (
    <div className="page-container-doc">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(`/teams/${numericTeamId}/spec-documents`)}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All specs
      </button>

      <Alert message={errorMessage} />

      {phase === 'pick' && (
        <>
          <h1 className="page-title" style={{ fontSize: 24, marginBottom: 6 }}>
            New spec doc
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 22 }}>
            Select the meetings to generate from, or start with a blank document.
          </p>
          <div className="detail-section-label">Source meetings</div>
          {meetings.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No meetings logged yet — start from a blank document instead.
            </p>
          ) : (
            <div className="spec-pick-list">
              {meetings.map((meeting) => (
                <label className="option-row" key={meeting.id}>
                  <input
                    type="checkbox"
                    checked={selectedMeetingIds.includes(meeting.id)}
                    onChange={() => toggleMeeting(meeting.id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{meeting.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {meeting.summary || meeting.rawContent || 'No content recorded.'}
                    </div>
                  </div>
                  <span className="mono muted" style={{ fontSize: 11 }}>
                    {formatDateTime(meeting.meetingAt)}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="spec-pick-actions">
            <Button type="button" disabled={meetings.length === 0} onClick={() => void handleGenerate()}>
              <Sparkles size={15} aria-hidden="true" />
              Generate spec
            </Button>
            <Button type="button" variant="secondary" onClick={handleStartBlank}>
              Start from blank
            </Button>
            <span className="spec-pick-count">{selectedMeetingIds.length} selected</span>
          </div>
        </>
      )}

      {phase === 'generating' && (
        <div className="ds-empty">
          <span className="ds-loading-spinner" aria-hidden="true" />
          <div className="ds-empty-title" style={{ marginTop: 12 }}>
            Generating spec…
          </div>
          <div className="ds-empty-description">Reading {selectedMeetingIds.length} meetings and drafting a structured document.</div>
        </div>
      )}

      {phase === 'edit' && (
        <>
          {draftGenerated && (
            <span className="draft-source-tag">
              <Sparkles size={12} aria-hidden="true" />
              Draft from {draftSourceIds.length} meeting{draftSourceIds.length === 1 ? '' : 's'}
            </span>
          )}
          <input
            className="spec-title-input"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Spec title"
          />
          <textarea
            className="doc-textarea"
            style={{ minHeight: 360 }}
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            placeholder="Write the spec…"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <Button type="button" size="lg" isLoading={isSubmitting} onClick={() => void handleConfirm()}>
              Confirm spec
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPhase('pick')}>
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
