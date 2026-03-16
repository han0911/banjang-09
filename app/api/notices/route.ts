import { NextResponse } from 'next/server';
import { noticeStore } from '@/entities/notice/model/noticeStore';
import type { NoticeInput } from '@/entities/notice/model/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await noticeStore.list();
  return NextResponse.json(items, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NoticeInput;
    const created = await noticeStore.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
