import { request } from './client';
import type {
  GenerateSpecDraftRequest,
  SaveSpecDocumentRequest,
  SpecDocument,
  SpecDraft,
  UpdateSpecDocumentRequest,
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

export function getSpecDocument(documentId: number) {
  return request<SpecDocument>(`/spec-documents/${documentId}`);
}

export function updateSpecDocument(documentId: number, data: UpdateSpecDocumentRequest) {
  return request<SpecDocument>(`/spec-documents/${documentId}`, {
    method: 'PATCH',
    body: data,
  });
}

export function deleteSpecDocument(documentId: number) {
  return request<null>(`/spec-documents/${documentId}`, {
    method: 'DELETE',
  });
}

export function setMainSpecDocument(documentId: number) {
  return request<SpecDocument>(`/spec-documents/${documentId}/main`, {
    method: 'PATCH',
  });
}
