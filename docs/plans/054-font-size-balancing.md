# 054 - 면접 질문 폰트 크기 밸런싱

## 1. Overview

### 문제 정의

면접 진행 시 질문 텍스트가 `text-2xl md:text-3xl` (24px → 30px, serif)로 표시되어 지나치게 크며, 지원 텍스트(14px)와의 비율이 2.14:1로 타이포그래피 베스트 프랙티스 권장 범위(~1.5:1)를 초과함.

### 목표

- 면접 질문 폰트 크기를 줄여 적절한 가독성과 밸런스 확보
- 인접 계층 간 폰트 크기 비율을 1.3~1.5:1 범위로 조정
- 모바일/데스크톱 반응형 크기 모두 자연스럽게 유지

### 범위

- 면접 세션 페이지 (`/interview`)
- 케이스 스터디 면접 페이지 (`/case-studies/[slug]/interview`)
- 아카이브 리뷰 페이지 (`/archive/[id]`)
- 검색 결과 페이지 (`/search`)
- 세션 완료 페이지 (`/complete`)
- 피드백 컴포넌트 (필요 시)

---

## 2. Requirements

### 기능 요구사항

| ID   | 요구사항                                                        | 우선순위 |
| ---- | --------------------------------------------------------------- | -------- |
| FR-1 | 면접 질문 텍스트 크기를 `text-lg md:text-xl` (18px/20px)로 줄임 | P1       |
| FR-2 | 페이지 제목과 질문 텍스트의 계층 구분 유지                      | P1       |
| FR-3 | 모바일/데스크톱 모두에서 가독성 검증                            | P1       |
| FR-4 | 완료 페이지 제목 크기 비례 점검                                 | P2       |

### 비기능 요구사항

| ID    | 요구사항                     |
| ----- | ---------------------------- |
| NFR-1 | 빌드 및 타입 체크 통과       |
| NFR-2 | 기존 UI 레이아웃 깨지지 않음 |

---

## 3. Architecture & Design

### 타이포그래피 스케일 변경

| 계층       | 용도                        | 현재                   | 변경 후                | 비율 (vs Tier 3) |
| ---------- | --------------------------- | ---------------------- | ---------------------- | ---------------- |
| **Tier 0** | 페이지 대제목 (완료 페이지) | `text-4xl md:text-5xl` | `text-3xl md:text-4xl` | —                |
| **Tier 1** | 페이지 제목/세션 제목       | `text-2xl md:text-3xl` | `text-xl md:text-2xl`  | 1.71:1           |
| **Tier 2** | 면접 질문 텍스트            | `text-2xl md:text-3xl` | `text-lg md:text-xl`   | 1.43:1           |
| **Tier 3** | 섹션 헤더 (질문 목록 등)    | `text-lg`              | `text-base md:text-lg` | 1.14~1.29:1      |
| **Tier 4** | 지원 텍스트 (힌트, 라벨)    | `text-sm`              | `text-sm` (유지)       | baseline         |
| **Tier 5** | 배지/메타데이터             | `text-xs`              | `text-xs` (유지)       | 0.86:1           |

### 핵심 설계 원칙

1. **인접 계층 간 비율 1.3~1.5:1 유지**
2. **페이지 제목 > 질문 텍스트 > 섹션 헤더** 계층 명확히 구분
3. **`font-display` (serif)는 페이지 제목에만, 질문은 더 작은 크기로 유지**
4. **`leading-relaxed` 유지하여 한국어 텍스트 가독성 확보**

---

## 4. Implementation Plan

### Phase 1: 핵심 면접 페이지 (P1)

| 파일                                             | 변경 내용                                                  |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `src/app/interview/page.tsx`                     | 질문 텍스트: `text-2xl md:text-3xl` → `text-lg md:text-xl` |
| `src/app/case-studies/[slug]/interview/page.tsx` | 질문 텍스트: 동일 변경                                     |

### Phase 2: 관련 페이지 밸런싱 (P1)

| 파일                            | 변경 내용                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `src/app/archive/[id]/page.tsx` | 세션 제목: `text-2xl md:text-3xl` → `text-xl md:text-2xl`                      |
| `src/app/search/page.tsx`       | 검색 쿼리 제목: `text-2xl md:text-3xl` → `text-xl md:text-2xl`, 결과 헤더 점검 |

### Phase 3: 완료 페이지 비례 조정 (P2)

| 파일                        | 변경 내용                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| `src/app/complete/page.tsx` | 대제목: `text-4xl md:text-5xl` → `text-3xl md:text-4xl`, 스탯 값 비례 점검 |

---

## 5. Quality Gates

- [x] `npm run build` 성공
- [x] `npx tsc --noEmit` 통과
- [x] `npx eslint src/` 통과
- [ ] 모바일 뷰포트에서 가독성 확인
- [ ] 데스크톱 뷰포트에서 가독성 확인
- [ ] 페이지 간 폰트 크기 일관성 확인

---

## 6. Risks & Dependencies

| 리스크                       | 확률 | 완화 방법                                     |
| ---------------------------- | ---- | --------------------------------------------- |
| 크기를 너무 줄여 가독성 저하 | 낮음 | `text-lg`(18px)이 본문보다 크므로 충분한 강조 |
| 다른 컴포넌트에 영향         | 낮음 | 변경은 Tailwind 클래스만, 구조 변경 없음      |

---

## 7. References

- GitHub Issue: [#54](https://github.com/kwakseongjae/dev-interview/issues/54)
- 타이포그래피 베스트 프랙티스: 인접 계층 비율 ~1.5:1 권장
- Tailwind CSS 기본 스케일: xs(12) → sm(14) → base(16) → lg(18) → xl(20) → 2xl(24) → 3xl(30)

---

## Implementation Summary

**Completion Date**: 2026-03-16
**Implemented By**: Claude Opus 4.6

### Changes Made

#### Files Modified

- [src/app/interview/page.tsx](src/app/interview/page.tsx) - 질문 텍스트 `text-2xl md:text-3xl` → `text-lg md:text-xl`, 사이드바 헤더 `text-lg` → `text-base md:text-lg`, 질문 헤더 레이아웃 리팩토링 (배지+찜 버튼 한 줄 정렬), `space-y-6` → `space-y-4`, 하트 아이콘 `w-6 h-6` → `w-5 h-5`, "진행상황 복원됨" 텍스트 모바일 숨김 + 축약, 제출하기 버튼 `bg-gold text-navy` → `bg-navy text-white`
- [src/app/archive/[id]/page.tsx](src/app/archive/[id]/page.tsx) - 세션 제목 `text-2xl md:text-3xl` → `text-xl md:text-2xl`
- [src/app/search/page.tsx](src/app/search/page.tsx) - 검색 쿼리 제목 `text-2xl md:text-3xl` → `text-xl md:text-2xl`
- [src/app/complete/page.tsx](src/app/complete/page.tsx) - 대제목 `text-4xl md:text-5xl` → `text-3xl md:text-4xl`, 스탯 값 `text-2xl` → `text-xl`

### Quality Validation

- [x] Build: Success
- [x] Type Check: Passed
- [x] Lint: Passed

### Deviations from Plan

**Added** (사용자 피드백 반영):

- 면접 페이지 질문 헤더 레이아웃 리팩토링: 배지+찜 버튼 같은 줄 `items-center` 정렬, 질문 텍스트 별도 행 + `pl-1`
- `space-y-6` → `space-y-4` (요소 간 간격 축소)
- 하트 아이콘 크기 축소 (`w-6 h-6` → `w-5 h-5`)
- "진행상황 복원됨" → 모바일 숨김 + 데스크톱 "복원됨"으로 축약 (작은 화면 버튼 줄바꿈 방지)
- 제출하기 버튼 색상 변경: `bg-gold text-navy` → `bg-navy text-white`

**Skipped**:

- `src/app/case-studies/[slug]/interview/page.tsx`: 이미 `text-xl md:text-2xl`로 설정되어 있어 변경 불필요

### Notes

- 피드백 컴포넌트(`src/components/feedback/`)는 이미 `text-sm`/`text-xs` 일관적이라 변경 불필요
- `package-lock.json` 변경은 무관한 자동 변경 (커밋 제외 대상)
