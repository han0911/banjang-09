import { ObjectId } from 'mongodb';
import type { NoticeInput, NoticeItem } from './types';
import type { NoticeCategory } from './constants';
import { connectDB } from '@/shared/lib/mongoClient';

const COLLECTION = 'notices';
const DEFAULT_DB = 'notice_board';

const isValidDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

const isValidCategory = (category: NoticeCategory) => {
  return category === '시험' || category === '수행' || category === '공지';
};

const isValidInput = (input: NoticeInput) => {
  const validCategory = isValidCategory(input.category);
  const validTitle = typeof input.title === 'string' && input.title.trim().length > 0;
  const validDate = typeof input.date === 'string' && isValidDate(input.date);
  return validCategory && validTitle && validDate;
};

const getDb = async () => {
  const client = await connectDB;
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;
  return client.db(dbName);
};

type NoticeDoc = { _id: ObjectId; category: NoticeCategory; title: string; date: string };

const mapNotice = (doc: NoticeDoc): NoticeItem => ({
  _id: doc._id.toHexString(),
  category: doc.category,
  title: doc.title,
  date: doc.date,
});

export const noticeStore = {
  async list(): Promise<NoticeItem[]> {
    const db = await getDb();
    const items = await db.collection<NoticeDoc>(COLLECTION).find().toArray();
    return items.map(item => mapNotice(item));
  },

  async get(id: string): Promise<NoticeItem | null> {
    const db = await getDb();
    if (!ObjectId.isValid(id)) return null;
    const item = await db.collection<NoticeDoc>(COLLECTION).findOne({ _id: new ObjectId(id) });
    return item ? mapNotice(item) : null;
  },

  async create(input: NoticeInput): Promise<NoticeItem> {
    if (!isValidInput(input)) {
      throw new Error('Invalid input');
    }
    const db = await getDb();
    const payload = { ...input, title: input.title.trim() };
    const result = await db.collection(COLLECTION).insertOne(payload);
    return { _id: result.insertedId.toHexString(), ...payload };
  },

  async update(id: string, input: NoticeInput): Promise<NoticeItem | null> {
    if (!isValidInput(input)) {
      throw new Error('Invalid input');
    }
    if (!ObjectId.isValid(id)) return null;
    const db = await getDb();
    const payload = { ...input, title: input.title.trim() };
    const result = await db.collection<NoticeDoc>(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: payload },
      { returnDocument: 'after' },
    );
    return result.value ? mapNotice(result.value) : null;
  },

  async remove(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const db = await getDb();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },
};
