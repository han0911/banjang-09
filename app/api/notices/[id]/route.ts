import { NextResponse } from 'next/server';
import { noticeStore } from '@/entities/notice/model/noticeStore';
import type { NoticeInput } from '@/entities/notice/model/types';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, context: { params: { id: string } }) {
  const item = await noticeStore.get(context.params.id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(item, { status: 200 });
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    const body = (await req.json()) as NoticeInput;
    const updated = await noticeStore.update(context.params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: { id: string } }) {
  const ok = await noticeStore.remove(context.params.id);
  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
