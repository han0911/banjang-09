'use client';

import { useEffect, useState } from 'react';
import styles from './NoticeBoard.module.css';
import { noticeApi } from '@/entities/notice/api/noticeApi';
import { calculateDDay } from '@/entities/notice/lib/calculateDDay';
import { NOTICE_CATEGORIES, type NoticeCategory } from '@/entities/notice/model/constants';
import type { NoticeInput, NoticeItem } from '@/entities/notice/model/types';

type NoticeItemWithDDay = NoticeItem & { dDay: number };

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function CustomCalendar({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? parseInt(value.slice(0, 4)) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? parseInt(value.slice(5, 7)) - 1 : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const toStr = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={styles.calendar}>
      <div className={styles.calHeader}>
        <button className={styles.calNav} onClick={prevMonth} type="button">‹</button>
        <span className={styles.calTitle}>{viewYear}년 {viewMonth + 1}월</span>
        <button className={styles.calNav} onClick={nextMonth} type="button">›</button>
      </div>
      <div className={styles.calWeekdays}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`${styles.calWeekday} ${i === 0 ? styles.sun : i === 6 ? styles.sat : ''}`}>{w}</div>
        ))}
      </div>
      <div className={styles.calGrid}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const str = toStr(d);
          const dow = (firstDay + d - 1) % 7;
          return (
            <button
              key={i}
              type="button"
              className={[
                styles.calDay,
                str === value ? styles.calDaySelected : '',
                str === todayStr && str !== value ? styles.calDayToday : '',
                dow === 0 ? styles.sun : dow === 6 ? styles.sat : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(str)}
            >
              {d}
            </button>
          );
        })}
      </div>
      {value && <div className={styles.calSelected}>선택됨: {value}</div>}
    </div>
  );
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<NoticeItemWithDDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<NoticeInput>({ category: '공지', title: '', date: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await noticeApi.list();
      const withDDay = data.map(item => ({ ...item, dDay: calculateDDay(item.date) }));
      withDDay.sort((a, b) => {
        if (a.dDay < 0 && b.dDay >= 0) return 1;
        if (a.dDay >= 0 && b.dDay < 0) return -1;
        return a.dDay - b.dDay;
      });
      setNotices(withDDay);
    } catch {
      alert('데이터를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!form.date) {
      setError('날짜를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await noticeApi.update(editingId, form);
      } else {
        await noticeApi.create(form);
      }
      await fetchNotices();
      closeModal();
    } catch {
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await noticeApi.remove(id);
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch {
      alert('삭제에 실패했어요.');
    }
  };

  const nextEvent = notices.filter(n => n.dDay >= 0)[0];

  const getBadgeClass = (cat: NoticeCategory) =>
    cat === '시험' ? styles.typeExam : cat === '수행' ? styles.typeTask : styles.typeNotice;
  const getBannerClass = (cat: NoticeCategory) =>
    cat === '시험' ? styles.ddayExam : cat === '수행' ? styles.ddayTask : styles.ddayNotice;
  const getDDayLabel = (d: number) => (d === 0 ? 'D-Day' : d < 0 ? `D+${Math.abs(d)}` : `D-${d}`);

  const openModal = () => {
    setIsClosing(false);
    setEditingId(null);
    setForm({ category: '공지', title: '', date: '' });
    setError('');
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 280);
  };
  const openEdit = (item: NoticeItemWithDDay) => {
    setIsClosing(false);
    setEditingId(item._id);
    setForm({ category: item.category, title: item.title, date: item.date });
    setError('');
    setIsModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>우리 반 게시판</h1>
          <p>반장 선거 공약 이행 중! 📝</p>
        </div>
        <div className={styles.headerBadge}>{notices.length}개</div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.skeletonBanner} />
        ) : nextEvent ? (
          <div className={`${styles.ddayBanner} ${getBannerClass(nextEvent.category)}`}>
            <div className={styles.ddayLabel}>Next Event</div>
            <div className={styles.ddayTitle}>{nextEvent.title}</div>
            <div className={styles.ddayCount}>{getDDayLabel(nextEvent.dDay)}</div>
            <div className={styles.ddayDate}>{nextEvent.date}</div>
          </div>
        ) : (
          <div className={styles.emptyBanner}><p>🎉 다가오는 일정이 없어요!</p></div>
        )}

        <section className={styles.listSection}>
          <h3>다가오는 일정 <span className={styles.count}>{notices.length}</span></h3>

          {loading ? (
            <>
              <div className={styles.skeletonCard} />
              <div className={styles.skeletonCard} />
              <div className={styles.skeletonCard} />
            </>
          ) : notices.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📭 아직 등록된 일정이 없어요</p>
              <p>아래 + 버튼으로 추가해보세요!</p>
            </div>
          ) : (
            notices.map(item => (
              <div key={item._id} className={`${styles.card} ${item.dDay < 0 ? styles.cardPast : ''}`}>
                <div className={styles.infoGroup}>
                  <div className={`${styles.badge} ${getBadgeClass(item.category)}`}>{item.category}</div>
                  <div>
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.date}>{item.date}</p>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <div className={`${styles.dDayText} ${item.dDay === 0 ? styles.dDayToday : item.dDay < 0 ? styles.dDayPast : ''}`}>
                    {getDDayLabel(item.dDay)}
                  </div>
                  <button className={styles.editBtn} onClick={() => openEdit(item)} aria-label="수정">수정</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)} aria-label="삭제">
                    <svg className={styles.trashIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12h8a2 2 0 0 0 2-2V9H6v10a2 2 0 0 0 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <button className={styles.fab} onClick={openModal} aria-label="일정 추가">+</button>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={`${styles.modalContent} ${isClosing ? styles.modalClosing : ''}`}>
            <div className={styles.modalHandle} />
            <h2>{editingId ? '일정 수정' : '새 일정 추가'}</h2>

            <div className={styles.inputGroup}>
              <label>카테고리</label>
              <div className={styles.categoryGroup}>
                {NOTICE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.catBtn} ${form.category === cat ? styles.catBtnActive : ''} ${getBadgeClass(cat)}`}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="title">제목</label>
              <input
                id="title"
                type="text"
                placeholder="예: 영어 단어 시험"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setError(''); }}
                maxLength={30}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>날짜</label>
              <CustomCalendar value={form.date} onChange={d => { setForm(f => ({ ...f, date: d })); setError(''); }} />
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              {submitting ? '저장 중...' : editingId ? '수정하기' : '추가하기'}
            </button>
            <button className={styles.closeBtn} onClick={closeModal}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
