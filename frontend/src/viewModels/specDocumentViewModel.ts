import type { SpecDocument } from '../types/specDocument';

export type SpecDocumentCardView = {
  document: SpecDocument;
  displayId: string;
  title: string;
  metaLine: string;
  preview: string;
  sourceLabel: string;
};

export function toSpecDocumentCardView(document: SpecDocument): SpecDocumentCardView {
  return {
    document,
    displayId: `SPEC-${document.id}`,
    title: document.title,
    metaLine: `${formatShortDate(document.updatedAt)} · ${document.createdBy.name}`,
    preview: getPreview(document.content),
    sourceLabel: `${document.sourceMeetingIds.length} source meetings`,
  };
}

function getPreview(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 180) {
    return compact;
  }
  return `${compact.slice(0, 180)}...`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
