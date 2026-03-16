import type { NoticeCategory } from './constants';

export interface NoticeItem {
  _id: string;
  category: NoticeCategory;
  title: string;
  date: string; // YYYY-MM-DD
}

export interface NoticeInput {
  category: NoticeCategory;
  title: string;
  date: string; // YYYY-MM-DD
}
