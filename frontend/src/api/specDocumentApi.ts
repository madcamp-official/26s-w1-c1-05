import { request } from './client';
import type {
  GenerateSpecDraftRequest,
  SaveSpecDocumentRequest,
  SpecDocument,
  SpecDraft,
} from '../types/specDocument';

export function getSpecDocuments(teamId: number) {
  return request<SpecDocument[]>(`/teams/${teamId}/spec-documents`);
}

export function generateSpecDraft(teamId: number, data: GenerateSpecDraftRequest) {
  return request<SpecDraft>(`/teams/${teamId}/spec-documents/draft`, {
    method: 'POST',
    body: data,
  });
}

export function createSpecDocument(teamId: number, data: SaveSpecDocumentRequest) {
  return request<SpecDocument>(`/teams/${teamId}/spec-documents`, {
    method: 'POST',
    body: data,
  });
}
