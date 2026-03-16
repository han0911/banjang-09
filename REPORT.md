# FSD 전환 및 개선 보고서

## 요약
- FSD 레이어 구조로 화면/도메인/유틸 분리를 진행했습니다.
- 공지 API 호출 로직과 D-Day 계산 로직을 엔티티 레이어로 이동해 재사용성과 유지보수성을 높였습니다.
- 공지 입력 검증을 강화해 잘못된 날짜가 저장되지 않도록 보완했습니다.

## 적용한 FSD 구조
- `app/` : Next.js 라우팅과 페이지 엔트리
- `widgets/notice-board/` : 화면 단위 컴포지션(UI + 상태/로직)
- `entities/notice/` : 공지 도메인 모델, API, 유틸
- `shared/` : (현재는 비어있으나) 공용 유틸/컴포넌트 확장 가능

## 변경/개선 사항 (코드 수정 포함)
- `app/page.tsx`
  - 페이지 로직을 위젯으로 분리하고 화면은 `NoticeBoard`만 렌더하도록 단순화.
- `widgets/notice-board/ui/NoticeBoard.tsx`
  - 기존 페이지 전체 UI/로직을 위젯으로 이동.
  - API 호출을 `noticeApi`로 분리해 재사용성 향상.
  - 카테고리 목록을 상수로 관리해 중복 제거.
- `widgets/notice-board/ui/NoticeBoard.module.css`
  - 기존 스타일을 위젯 단위로 이동.
- `entities/notice/api/noticeApi.ts`
  - 공지 CRUD API 호출 모듈 추가.
  - `res.ok` 체크로 실패 시 예외 처리 일관화.
- `entities/notice/lib/calculateDDay.ts`
  - D-Day 계산 로직 분리.
- `entities/notice/model/constants.ts`
  - 카테고리 상수와 타입을 단일 소스로 관리.
- `entities/notice/model/types.ts`
  - 타입 정의 정리 및 상수 기반 타입 사용.
- `entities/notice/model/noticeStore.ts`
  - 저장소 위치를 엔티티 레이어로 이동.
  - 날짜 형식 유효성 검증 강화(실제 달력 날짜 여부 체크).
- `app/api/notices/route.ts`, `app/api/notices/[id]/route.ts`
  - 새 `noticeStore` 경로로 import 수정.

## 추가/삭제된 파일
- 추가됨
  - `entities/notice/api/noticeApi.ts`
  - `entities/notice/lib/calculateDDay.ts`
  - `entities/notice/model/constants.ts`
  - `entities/notice/model/noticeStore.ts`
  - `widgets/notice-board/ui/NoticeBoard.tsx`
  - `widgets/notice-board/ui/NoticeBoard.module.css`
  - `widgets/notice-board/index.ts`
- 삭제됨
  - `shared/lib/noticeStore.ts`
  - `app/page.module.css`

## 남은 개선 여지 (선택)
- `shared/` 레이어에 공용 UI/유틸(예: 버튼, 모달, 날짜 유틸) 정리.
- API 에러 메시지 표준화 및 사용자 알림 UX 개선.
- `noticeApi`에 타입 안전한 응답 스키마 검증 도입(zod 등).

## 추가 변경: DB 연결 적용
- `shared/lib/mongoClient.ts`에 MongoDB 클라이언트 유틸 추가.
- `app/util/database.ts`는 공유 유틸을 재사용하도록 단순화.
- `entities/notice/model/noticeStore.ts`를 파일 저장 방식에서 MongoDB 저장 방식으로 전환.
- `.env`에 `MONGODB_URL`, `MONGODB_DB` 설정 템플릿 추가.
