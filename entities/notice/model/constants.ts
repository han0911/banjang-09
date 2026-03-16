export const NOTICE_CATEGORIES = ['시험', '수행', '공지'] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];
