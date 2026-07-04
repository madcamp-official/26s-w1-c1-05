import type { Meeting } from '../types/meeting';

export type MeetingListItemView = {
  meeting: Meeting;
  displayId: string;
  title: string;
  summaryPreview: string;
  dateLabel: string;
  authorLabel: string;
};

export function toMeetingListItemView(meeting: Meeting): MeetingListItemView {
  return {
    meeting,
    displayId: `MTG-${meeting.id}`,
    title: meeting.title,
    summaryPreview: meeting.summary || meeting.rawContent || '기록 내용이 없습니다.',
    dateLabel: formatShortDate(meeting.meetingAt),
    authorLabel: meeting.author.name,
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
