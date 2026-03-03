# Plan: 면접 범주 선택 카드 정적 데이터 리팩토링

**Issue**: [#43](https://github.com/kwakseongjae/dev-interview/issues/43)
**Branch**: `fix/43-slow-interview-type-card-rendering`
**Date**: 2026-03-04

---

## 1. Overview

### 문제 정의

홈 화면 "면접 범주 선택 (선택사항)" 카드가 페이지 로드 후 늦게 렌더링되는 원인은 `page.tsx`(Client Component)에서 `useEffect`로 `/api/interview-types` API를 호출하기 때문임.

렌더링 지연 경로:

```
서버 HTML 전송 → JS hydration → useEffect 실행 → /api/interview-types 요청
  → Supabase 쿼리 → 응답 → setState → 리렌더링 → 카드 표시
```

### 목표

- 면접 범주 4종(CS, PROJECT, SYSTEM_DESIGN, CASE_STUDY)은 **완전히 정적인 데이터**로 정적 상수로 관리
- API 호출 제거 → 홈 페이지 최초 렌더링 시 즉시 카드 표시
- 연계된 `search/page.tsx` 및 세션 생성 플로우 호환성 유지

### 범위

- 홈 화면 카드 렌더링 최적화 (API 호출 제거)
- `interview_type_id` (UUID) 의존성을 `code` 기반으로 전환
- 세션 생성 API가 `code`를 받아 내부에서 UUID 조회하도록 변경

---

## 2. Requirements

### FR (기능 요구사항)

- **FR-1**: 홈 화면 면접 범주 카드가 API 호출 없이 즉시 렌더링됨
- **FR-2**: `src/data/interview-types.ts`에 4종 면접 범주 정적 데이터 정의
- **FR-3**: 기존 InterviewTypeSelector UI 동작 유지 (선택, 해제, 반응형)
- **FR-4**: 면접 시작 시 세션에 `interview_type_id`(UUID) 정상 저장
- **FR-5**: 아카이브 페이지 면접 범주 필터 동작 유지

### TR (기술 요구사항)

- **TR-1**: `InterviewTypeCode` 타입 (`src/types/interview.ts`)을 정적 데이터의 기준으로 사용
- **TR-2**: `InterviewTypeSelector` props를 `ApiInterviewType[]` → 정적 타입 배열로 변경
- **TR-3**: `page.tsx`의 `selectedInterviewTypeId`(UUID 기반) → `selectedInterviewTypeCode`(code 기반)로 전환
- **TR-4**: 세션 생성 API(`/api/sessions POST`)가 `interview_type_code` 파라미터를 받아 UUID를 내부 조회
- **TR-5**: 빌드/타입체크/린트 전부 통과

---

## 3. Architecture & Design

### 데이터 구조

```typescript
// src/data/interview-types.ts (NEW)
export interface StaticInterviewType {
  code: InterviewTypeCode;
  displayName: string;
  description: string;
  icon: string;   // ICON_MAP 키 ('Brain', 'FolderKanban', 'Network', 'BookOpen')
  color: string;  // COLOR_MAP 키 ('blue', 'green', 'purple', 'amber')
  sortOrder: number;
}

export const INTERVIEW_TYPES: StaticInterviewType[] = [
  { code: "CS",            displayName: "CS 기초",        icon: "Brain",         color: "blue",   sortOrder: 1, ... },
  { code: "PROJECT",       displayName: "프로젝트 기반",  icon: "FolderKanban",  color: "green",  sortOrder: 2, ... },
  { code: "SYSTEM_DESIGN", displayName: "시스템 설계",    icon: "Network",       color: "purple", sortOrder: 3, ... },
  { code: "CASE_STUDY",    displayName: "케이스 스터디",  icon: "BookOpen",      color: "amber",  sortOrder: 4, ... },
];
```

### 변경 후 홈 → 검색 → 세션 생성 플로우

```
[홈 page.tsx]
  INTERVIEW_TYPES (정적) → InterviewTypeSelector
  선택 → selectedInterviewTypeCode: "CS" | "PROJECT" | ...
  제출 → URL params: ?interview_type=CS (interview_type_id 제거)

[search/page.tsx]
  interviewTypeCode = searchParams.get("interview_type")
  typeInfo = INTERVIEW_TYPES.find(t => t.code === interviewTypeCode)  ← 정적 lookup
  세션 생성 시 → createSessionApi(..., interviewTypeCode)  (UUID 대신 code 전달)

[/api/sessions POST]
  interview_type_code 수신 → interview_types 테이블에서 UUID 조회
  interview_type_id = DB lookup 결과 → 세션에 저장
```

---

## 4. Implementation Plan

### Step 1: 정적 데이터 파일 생성

**파일**: `src/data/interview-types.ts` (NEW)

- `StaticInterviewType` 인터페이스 정의 (ApiInterviewType에서 `id` 제거)
- `INTERVIEW_TYPES` 상수 배열 정의 (4종)
- `getInterviewTypeByCode()` 헬퍼 함수 추가

### Step 2: InterviewTypeSelector props 타입 업데이트

**파일**: `src/components/InterviewTypeSelector.tsx`

- `interviewTypes: ApiInterviewType[]` → `interviewTypes: StaticInterviewType[]`
- `selectedTypeId` → `selectedTypeCode` (string → InterviewTypeCode | null)
- ICON_MAP/COLOR_MAP은 그대로 유지 (이미 정적 상수)
- `InterviewTypeBadge`도 같이 타입 업데이트

### Step 3: 홈 page.tsx 리팩토링

**파일**: `src/app/page.tsx`

제거:

- `interviewTypes` 상태 (`useState<ApiInterviewType[]>([])`)
- `isLoadingInterviewTypes` 상태
- `loadInterviewTypes` useEffect
- `getInterviewTypesApi` import
- 스켈레톤 로딩 UI 분기

추가:

- `INTERVIEW_TYPES` import from `@/data/interview-types`
- `selectedInterviewTypeCode` 상태 (`useState<InterviewTypeCode | null>(null)`)

수정:

- `selectedInterviewTypeId` → `selectedInterviewTypeCode`
- 제출 핸들러: `interview_type_id` URL param 제거, `interview_type` (code)만 유지
- InterviewTypeSelector props 업데이트

### Step 4: search/page.tsx 업데이트

**파일**: `src/app/search/page.tsx`

- `interviewTypeId` URL param 제거
- 면접 범주 표시 정보: `INTERVIEW_TYPES.find(t => t.code === interviewTypeCode)` 로 lookup
- `createSessionApi()` 호출 시 `interviewTypeId` → `interviewTypeCode` 전달
- 하드코딩된 displayName 매핑 제거 (정적 데이터에서 가져옴)

### Step 5: createSessionApi 및 세션 생성 API 업데이트

**파일**: `src/lib/api.ts`

- `createSessionApi` 파라미터: `interviewTypeId?: string` → `interviewTypeCode?: InterviewTypeCode`
- URL param 변경: `interview_type_id` → `interview_type_code`

**파일**: `src/app/api/sessions/route.ts`

- POST handler: `interview_type_code` 수신
- interview_types 테이블에서 UUID 조회: `.eq("code", interview_type_code)`
- 조회된 UUID를 세션에 저장
- GET handler: `interview_type_id` 필터 유지 (아카이브 필터용) 또는 `interview_type_code` 기반으로 전환

### Step 6: 정리

- `src/lib/api.ts`: `getInterviewTypesApi()` 및 `ApiInterviewType` 인터페이스 제거 (또는 deprecated 처리)
- `src/app/api/interview-types/route.ts`: 사용 여부 확인 후 삭제 검토 (다른 곳에서 사용 안 하면 삭제)

---

## 5. Quality Gates

- [ ] `npm run build` 성공
- [ ] `npx tsc --noEmit` 타입 에러 없음
- [ ] `npx eslint src/` lint 통과
- [ ] 홈 화면 면접 범주 카드 즉시 렌더링 확인
- [ ] 면접 범주 선택 후 검색 정상 동작
- [ ] 세션 생성 후 DB에 `interview_type_id` 정상 저장 확인

---

## 6. Risks & Dependencies

| 리스크                      | 영향도 | 완화 방법                                                      |
| --------------------------- | ------ | -------------------------------------------------------------- |
| 세션 생성 시 UUID 조회 실패 | 높음   | DB `interview_types` 테이블에 4종 데이터 존재 확인 (이미 존재) |
| 아카이브 필터 동작 깨짐     | 중간   | archive/page.tsx의 interviewTypeId 사용 패턴 확인 후 처리      |
| 타입 불일치                 | 낮음   | TypeScript 컴파일러가 즉시 감지                                |

---

## 7. Files to Change

| 파일                                       | 변경 유형 | 주요 내용                                                 |
| ------------------------------------------ | --------- | --------------------------------------------------------- |
| `src/data/interview-types.ts`              | **신규**  | StaticInterviewType 타입 + INTERVIEW_TYPES 상수           |
| `src/app/page.tsx`                         | 수정      | API 호출 제거, 정적 데이터 사용                           |
| `src/components/InterviewTypeSelector.tsx` | 수정      | props 타입 업데이트                                       |
| `src/app/search/page.tsx`                  | 수정      | interviewTypeId 제거, 정적 lookup                         |
| `src/lib/api.ts`                           | 수정      | createSessionApi 파라미터 변경, getInterviewTypesApi 제거 |
| `src/app/api/sessions/route.ts`            | 수정      | code → UUID 조회 로직 추가                                |
| `src/app/api/interview-types/route.ts`     | 삭제 검토 | 미사용 시 삭제                                            |

---

## 8. References

- Issue: [#43 홈 화면 면접 범주 선택 카드 느린 렌더링](https://github.com/kwakseongjae/dev-interview/issues/43)
- 관련: `src/data/trend-topics.ts` (정적 데이터 파일 패턴 참조)
- 관련: `src/types/interview.ts` (`InterviewTypeCode` 타입)

---

## Implementation Summary

**Completion Date**: 2026-03-04
**Implemented By**: Claude Sonnet 4.6

### Changes Made

| 파일                                                                                                                   | 변경 유형   | 주요 내용                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`src/data/interview-types.ts`](src/data/interview-types.ts)                                                           | **신규**    | `StaticInterviewType` 인터페이스, `INTERVIEW_TYPES` 상수(4종), `getInterviewTypeByCode()` 헬퍼                          |
| [`src/components/InterviewTypeSelector.tsx`](src/components/InterviewTypeSelector.tsx)                                 | 전면 재작성 | 카드 그리드 → Popover 기반 UI로 전환. `InterviewTypePopoverSelector`, `SelectedInterviewTypePill`, `InterviewTypeBadge` |
| [`src/app/page.tsx`](src/app/page.tsx)                                                                                 | 수정        | API 호출/로딩 상태/스켈레톤 제거. 위 카드 영역 제거. 하단 툴바 + 입력창 내부 Pill 방식으로 전환                         |
| [`src/app/search/page.tsx`](src/app/search/page.tsx)                                                                   | 수정        | `interviewTypeId` URL 파라미터 제거. 하드코딩 displayName 제거. `getInterviewTypeByCode()`로 대체                       |
| [`src/lib/api.ts`](src/lib/api.ts)                                                                                     | 수정        | `createSessionApi()` 파라미터: `interviewTypeId` → `interviewTypeCode`                                                  |
| [`src/app/api/sessions/route.ts`](src/app/api/sessions/route.ts)                                                       | 수정        | `interview_type_code` 수신 후 DB에서 UUID 내부 조회                                                                     |
| [`docs/plans/043-refactor-interview-type-to-static-data.md`](docs/plans/043-refactor-interview-type-to-static-data.md) | 신규        | 계획 문서                                                                                                               |

### Key Implementation Details

- **정적 데이터 전환**: 4종 면접 범주를 `INTERVIEW_TYPES` 배열로 정의. API 호출 없이 즉시 렌더링
- **식별자 변경**: UUID(`id`) 기반 → `code`(CS/PROJECT/SYSTEM_DESIGN/CASE_STUDY) 기반으로 프론트엔드 전체 통일
- **UUID 역방향 조회**: 백엔드 세션 생성 시 `interview_type_code`를 받아 DB에서 `interview_type_id`(UUID) 자동 조회
- **UI 패턴 통일**: `TrendTopicSelector`와 동일한 Popover 패턴으로 면접 범주 선택 UI 재설계
- **디테일 표시**: Popover 2×2 카드에 아이콘 + 이름 + 설명 전체 표시
- **InterviewTypeBadge 호환성 유지**: 최소 인터페이스(`displayName`, `icon`, `color`)만 요구해 아카이브/검색 등 기존 코드 무변경

### Deviations from Plan

**Added (계획 외 추가)**:

- `InterviewTypePopoverSelector`를 트렌드 토픽과 동일한 Popover 패턴으로 구현 (계획 문서에는 UI 방식 미확정)
- `SelectedInterviewTypePill` 컴포넌트 추가 (입력창 내부 상단 표시)
- 면접 범주 + 트렌드 토픽 Pill이 동시에 나란히 표시되는 레이아웃

**Changed (변경)**:

- 계획상 `getInterviewTypesApi` 제거로 명시했으나, `archive/page.tsx`가 여전히 사용하므로 유지

**Skipped (미구현)**:

- `/api/interview-types` 라우트 삭제 (archive 페이지 필터용으로 여전히 필요하여 유지)

### Quality Validation

- [x] Build: Success (`npm run build`)
- [x] Type Check: Passed (`npx tsc --noEmit`)
- [x] Lint: Passed (`npx eslint`)

---

## QA Checklist

> 🤖 Generated by qa-generator agent
> Date: 2026-03-04

### 테스트 요약

- **총 테스트 케이스**: 31개
- **우선순위별**: High 13, Medium 12, Low 6
- **예상 테스트 시간**: 60분

### 기능 테스트

| #     | 테스트 시나리오                 | 테스트 단계                               | 예상 결과                                                                    | 우선순위 |
| ----- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| FT-1  | 면접 범주 버튼 즉시 렌더링      | 홈 화면 접속 → 입력창 하단 툴바 확인      | 로딩/스켈레톤 없이 "면접 범주" 버튼 즉시 표시                                | High     |
| FT-2  | Popover 열기                    | 입력창 하단 "면접 범주" 버튼 클릭         | 2×2 카드 그리드 Popover 열림. 4개 범주 모두 표시                             | High     |
| FT-3  | 면접 범주 선택                  | Popover에서 "CS 기초" 카드 클릭           | Popover 닫힘. 툴바 버튼 → "CS 기초" 파란 텍스트+Brain 아이콘으로 변경        | High     |
| FT-4  | 선택된 범주 Pill 표시           | "CS 기초" 선택 후 입력창 내부 상단 확인   | 파란색 Pill (Brain 아이콘 + "CS 기초" + X 버튼) 표시                         | High     |
| FT-5  | Pill X 버튼으로 범주 해제       | Pill의 X 버튼 클릭                        | Pill 사라짐. 툴바 버튼 기본 상태로 복원                                      | High     |
| FT-6  | 같은 범주 재클릭 해제           | 선택된 범주 재클릭                        | 선택 해제. 기본 상태로 복원                                                  | Medium   |
| FT-7  | 검색 시 면접 범주 코드 URL 전달 | "SYSTEM_DESIGN" 선택 후 검색              | URL에 `interview_type=SYSTEM_DESIGN` 포함 (UUID 없음)                        | High     |
| FT-8  | 검색 페이지 배지 표시           | `/search?q=테스트&interview_type=CS` 접속 | `InterviewTypeBadge`에 "CS 기초" 파란색 배지 표시                            | High     |
| FT-9  | 인터뷰 시작 시 코드→UUID 변환   | "PROJECT" 선택 후 인터뷰 시작             | POST `/api/sessions`에 `interview_type_code: "PROJECT"` 전송. DB에 UUID 저장 | High     |
| FT-10 | 샘플 프롬프트 클릭 시 범주 유지 | 범주 선택 후 샘플 프롬프트 클릭           | URL에 `interview_type` 파라미터 유지                                         | Medium   |
| FT-11 | 비로그인 상태 범주 선택         | 로그아웃 상태에서 범주 선택 후 검색       | 검색 페이지 정상 이동. 배지 표시. 인터뷰 시작 시 로그인 페이지로 이동        | Medium   |
| FT-12 | 범주 순차 전환                  | CS → 프로젝트 기반 전환                   | 이전 선택 해제 후 새 선택으로 즉시 전환                                      | Medium   |

### 엣지 케이스 테스트

| #    | 시나리오                                                        | 예상 결과                                              | 우선순위 |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| EC-1 | 잘못된 interview_type 코드 URL 접속 (`?interview_type=INVALID`) | 배지 미표시. 에러 없이 정상 렌더링                     | High     |
| EC-2 | 면접 범주 미선택 세션 생성                                      | `interview_type_id = null`로 저장. 세션 생성 정상 완료 | High     |
| EC-3 | DB에 없는 코드로 세션 생성 API 호출                             | `interview_type_id = null` 처리. 500 에러 없음         | High     |
| EC-4 | 파일 첨부 + 면접 범주 동시 선택 후 검색                         | 두 파라미터 모두 URL에 포함                            | Medium   |
| EC-5 | Popover 열린 상태에서 Escape 키                                 | Popover 닫힘. 선택 상태 변경 없음                      | Medium   |
| EC-6 | Popover 외부 클릭                                               | Popover 닫힘. 선택 상태 변경 없음                      | Medium   |
| EC-7 | 면접 범주 + 트렌드 토픽 동시 선택                               | 두 Pill이 나란히 표시. 각각 독립 해제 가능             | Medium   |
| EC-8 | 파일 업로드 중 버튼 클릭                                        | `disabled` 상태. Popover 열리지 않음                   | Medium   |

### UI/UX 테스트

| #    | 확인 항목                             | 예상 결과                                                | 우선순위 |
| ---- | ------------------------------------- | -------------------------------------------------------- | -------- |
| UI-1 | 범주별 색상 (blue/green/purple/amber) | 버튼 텍스트, Pill, 카드 테두리 모두 해당 색상            | Medium   |
| UI-2 | Popover 카드 선택 체크 표시           | 선택된 카드 우측 상단 체크 아이콘 (scale 0→1 애니메이션) | Medium   |
| UI-3 | 반응형 Popover 너비                   | 모바일에서 `calc(100vw-2rem)`, 최대 480px                | Medium   |
| UI-4 | 툴바 아이콘 전환                      | 미선택: LayoutGrid, 선택: 범주별 아이콘                  | Medium   |

### 회귀 테스트

| #    | 기능                               | 예상 결과                                             | 우선순위 |
| ---- | ---------------------------------- | ----------------------------------------------------- | -------- |
| RT-1 | 홈 화면 기본 검색 (범주 미선택)    | 정상 검색. `interview_type` 파라미터 없어도 에러 없음 | High     |
| RT-2 | 아카이브 `InterviewTypeBadge`      | 기존과 동일하게 렌더링                                | High     |
| RT-3 | 트렌드 토픽 선택 기능              | 기존과 동일하게 동작                                  | High     |
| RT-4 | 레퍼런스 파일 첨부                 | 툴바 레이아웃 변경 없이 정상 동작                     | High     |
| RT-5 | 검색 페이지 질문 재생성            | 면접 범주 코드가 재요청에 유지                        | High     |
| RT-6 | GET `/api/sessions` 면접 범주 필터 | UUID 기반 필터 정상 동작 (GET API 변경 없음)          | Medium   |
