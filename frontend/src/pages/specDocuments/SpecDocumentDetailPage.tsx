import { useEffect, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import * as specDocumentApi from '../../api/specDocumentApi';
import * as teamApi from '../../api/teamApi';
import { useAuth } from '../../auth/useAuth';
import { Alert, Badge, Button, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { SpecDocument } from '../../types/specDocument';
import type { TeamDetail } from '../../types/team';
import type { TeamLayoutContext } from '../../components/layout/TeamLayout';

export function SpecDocumentDetailPage() {
  const { teamId, documentId } = useParams();
  const numericTeamId = Number(teamId);
  const numericDocumentId = Number(documentId);
  const navigate = useNavigate();
  const { refreshTeamChrome } = useOutletContext<TeamLayoutContext>();
  const { user } = useAuth();
  const [specDoc, setSpecDoc] = useState<SpecDocument | null>(null);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => void loadPage(), [numericDocumentId, numericTeamId]);

  const canEdit = specDoc != null && (specDoc.createdBy.id === user?.id || team?.myRole === 'LEADER');

  async function loadPage() {
    if (!Number.isFinite(numericTeamId) || !Number.isFinite(numericDocumentId)) {
      setErrorMessage('Invalid spec doc.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [documentData, teamData] = await Promise.all([
        specDocumentApi.getSpecDocument(numericDocumentId),
        teamApi.getTeam(numericTeamId),
      ]);
      setSpecDoc(documentData);
      setTeam(teamData);
      setBody(documentData.content);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this spec doc.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!specDoc) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const updated = await specDocumentApi.updateSpecDocument(specDoc.id, {
        title: specDoc.title,
        content: body,
        sourceMeetingIds: specDoc.sourceMeetingIds,
      });
      setSpecDoc(updated);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not save this spec doc.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleMain() {
    if (!specDoc) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const updated = await specDocumentApi.setMainSpecDocument(specDoc.id);
      setSpecDoc(updated);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not set this as the main spec.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!specDoc || !window.confirm('Delete this spec doc?')) {
      return;
    }
    try {
      setIsSubmitting(true);
      await specDocumentApi.deleteSpecDocument(specDoc.id);
      void refreshTeamChrome();
      navigate(`/teams/${numericTeamId}/spec-documents`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not delete this spec doc.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading spec doc…" />;
  }

  if (!specDoc) {
    return <Alert message={errorMessage ?? 'Spec doc not found.'} />;
  }

  return (
    <div className="page-container-doc">
      <button type="button" className="back-link" onClick={() => navigate(`/teams/${numericTeamId}/spec-documents`)}>
        <ArrowLeft size={15} aria-hidden="true" />
        All specs
      </button>

      <div className="detail-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="detail-title" style={{ marginBottom: 0 }}>
            {specDoc.title}
          </h1>
          {specDoc.isMain && <Badge variant="solid">MAIN</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <Button type="button" variant="secondary" size="sm" disabled={isSubmitting || specDoc.isMain} onClick={() => void handleToggleMain()}>
            {specDoc.isMain ? 'Main spec' : 'Set as main'}
          </Button>
          {canEdit && (
            <Button type="button" variant="danger" size="sm" disabled={isSubmitting} onClick={() => void handleDelete()}>
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="doc-meta-row">
        <span>
          {specDoc.createdBy.name} · {formatDateTime(specDoc.updatedAt)}
        </span>
        {specDoc.sourceMeetingIds.length > 0 && <span>From {specDoc.sourceMeetingIds.length} meeting(s)</span>}
      </div>

      {!canEdit && <div className="readonly-note">You have view-only access to this spec doc.</div>}

      <Alert message={errorMessage} />

      <textarea
        className="doc-textarea"
        style={{ minHeight: 360 }}
        value={body}
        disabled={!canEdit}
        onChange={(event) => setBody(event.target.value)}
      />
      {canEdit && (
        <div className="doc-save-row">
          <Button type="button" isLoading={isSubmitting} onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}
