import { useEffect, useState, type MouseEvent } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as specDocumentApi from '../../api/specDocumentApi';
import { Alert, Badge, Button, Card, EmptyState, LoadingState } from '../../components/ui';
import { formatDateTime } from '../../utils/format';
import { ApiError } from '../../types/api';
import type { SpecDocument } from '../../types/specDocument';

export function SpecDocumentListPage() {
  const { teamId } = useParams();
  const numericTeamId = Number(teamId);
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SpecDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setDocuments(await specDocumentApi.getSpecDocuments(numericTeamId));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load spec docs.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetMain(document: SpecDocument, event: MouseEvent) {
    event.stopPropagation();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await specDocumentApi.setMainSpecDocument(document.id);
      await loadPage();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not set this as the main spec.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading spec docs…" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Spec docs</h1>
          <p className="page-subtitle">Generate specs from meeting notes, or write one from scratch.</p>
        </div>
        <Button type="button" onClick={() => navigate(`/teams/${numericTeamId}/spec-documents/new`)}>
          <Plus size={15} aria-hidden="true" />
          New spec
        </Button>
      </div>

      <Alert message={errorMessage} />

      {documents.length === 0 ? (
        <EmptyState
          title="No spec docs yet."
          description="Generate one from your meeting notes, or start from a blank document."
          action={
            <Button type="button" onClick={() => navigate(`/teams/${numericTeamId}/spec-documents/new`)}>
              New spec
            </Button>
          }
        />
      ) : (
        <div className="row-list">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              interactive
              className="row-item"
              onClick={() => navigate(`/teams/${numericTeamId}/spec-documents/${doc.id}`)}
            >
              <div className="row-icon">
                <FileText size={16} aria-hidden="true" />
              </div>
              <div className="row-body">
                <div className="row-title-line">
                  <span className="row-title">{doc.title}</span>
                  {doc.isMain && <Badge variant="solid">MAIN</Badge>}
                </div>
                <div className="row-subtitle">
                  {doc.createdBy.name} · {formatDateTime(doc.updatedAt)}
                </div>
              </div>
              <div className="row-trailing">
                {!doc.isMain && (
                  <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={(event) => void handleSetMain(doc, event)}>
                    Set main
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
