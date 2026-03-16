import type { NoticeInput, NoticeItem } from '../model/types';

const BASE_URL = '/api/notices';

const request = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res;
};

export const noticeApi = {
  async list(): Promise<NoticeItem[]> {
    const res = await request(BASE_URL);
    return res.json();
  },

  async create(payload: NoticeInput): Promise<NoticeItem> {
    const res = await request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async update(id: string, payload: NoticeInput): Promise<NoticeItem> {
    const res = await request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async remove(id: string): Promise<void> {
    await request(`${BASE_URL}/${id}`, { method: 'DELETE' });
  },
};
