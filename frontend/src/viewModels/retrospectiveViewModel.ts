import type { Retrospective } from '../types/retrospective';

export type RetrospectiveListItemView = {
  retrospective: Retrospective;
  displayId: string;
  title: string;
  preview: string;
  metaLine: string;
  collaboratorLabel: string;
};

export function toRetrospectiveListItemView(
  retrospective: Retrospective,
): RetrospectiveListItemView {
  return {
    retrospective,
    displayId: `RETRO-${retrospective.id}`,
    title: retrospective.title,
    preview: retrospective.todayPlan || retrospective.yesterdayWork || retrospective.note || '기록 내용이 없습니다.',
    metaLine: `${formatShortDate(retrospective.updatedAt)} · ${retrospective.author.name}`,
    collaboratorLabel:
      retrospective.collaborators.length === 0
        ? '공동 작업자 없음'
        : `공동 ${retrospective.collaborators.length}명`,
  };
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
