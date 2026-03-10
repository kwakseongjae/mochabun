# 052 - Google Search Console 리디렉션 포함 페이지 색인 미생성 문제 해결

**Issue**: [#52](https://github.com/kwakseongjae/dev-interview/issues/52)
**Branch**: `fix/52-search-console-redirect-indexing`
**Created**: 2026-03-11

---

## 1. Overview

### 문제 정의

Google Search Console에서 "리디렉션이 포함된 페이지"라는 이유로 일부 페이지의 색인이 생성되지 않고 있음. Googlebot이 인증 필요 페이지를 크롤링할 때 `/auth`로 리디렉션되어 발생하는 문제.

### 목표

1. **robots.txt 수정**: 인증 필요 페이지를 disallow 목록에 추가하여 Googlebot의 불필요한 크롤링 방지
2. **sitemap.ts 정리**: 인증 필요 페이지 및 robots.txt disallow 페이지를 sitemap에서 제거
3. **쿼리 파라미터 URL 정리**: `/trends?topic=X` URL을 sitemap에서 제거하여 중복/리디렉션 혼란 방지

### 핵심 원칙

- robots.txt에서 disallow한 URL은 sitemap에 포함하지 않음 (일관성)
- sitemap에는 200 상태를 반환하는 canonical URL만 포함
- 인증 필요 페이지는 색인 대상이 아님

### 범위

- **IN**: robots.ts disallow 확장, sitemap.ts 정리 (인증 페이지 제거 + 쿼리 파라미터 URL 제거)
- **OUT**: 도메인 www/non-www 리디렉션 설정 (Vercel 설정, 별도 이슈), trends 페이지 라우트 구조 변경 (`/trends/[topicId]` slug 기반)

---

## 2. Requirements

### 기능 요구사항

| ID   | 요구사항                                                                                                  | 우선순위 |
| ---- | --------------------------------------------------------------------------------------------------------- | -------- |
| FR-1 | robots.ts에 인증 필요 경로 disallow 추가: `/archive`, `/favorites`, `/team-spaces`, `/interview`          | P1       |
| FR-2 | sitemap.ts에서 인증 필요 페이지 제거: `/archive`, `/favorites`, `/team-spaces/new`, `/auth`, `/interview` | P1       |
| FR-3 | sitemap.ts에서 `/trends?topic=X` 쿼리 파라미터 URL 제거                                                   | P1       |

### 비기능 요구사항

| ID    | 요구사항                                                                         |
| ----- | -------------------------------------------------------------------------------- |
| NFR-1 | 빌드 성공                                                                        |
| NFR-2 | 공개 페이지(/, /search, /case-studies, /trends, /faq, /privacy)는 sitemap에 유지 |

---

## 3. Architecture & Design

### 변경 대상 파일

1. **`src/app/robots.ts`** — disallow 목록 확장
2. **`src/app/sitemap.ts`** — 인증 필요 페이지 + 쿼리 파라미터 URL 제거

### 설계 결정

**robots.txt disallow 대상 (인증 필요 경로)**:

| 경로            | 리디렉션 행동                     | 추가 여부     |
| --------------- | --------------------------------- | ------------- |
| `/api/`         | API 엔드포인트                    | 이미 disallow |
| `/auth/`        | 인증 페이지                       | 이미 disallow |
| `/complete/`    | 인증 필요                         | 이미 disallow |
| `/archive`      | → `/auth?redirect=/archive`       | **추가**      |
| `/favorites`    | → `/auth?redirect=/favorites`     | **추가**      |
| `/team-spaces/` | → `/auth`                         | **추가**      |
| `/interview`    | 세션 파라미터 필요, 리디렉션 발생 | **추가**      |

**sitemap 유지 대상 (공개 페이지)**:

| 경로            | 상태                                                       |
| --------------- | ---------------------------------------------------------- |
| `/`             | 유지 (priority 1.0)                                        |
| `/search`       | 유지 (priority 0.9)                                        |
| `/case-studies` | 유지 (priority 0.8)                                        |
| `/trends`       | 유지 (priority 0.8) — 쿼리 파라미터 없이 기본 페이지만     |
| `/faq`          | **추가** (priority 0.7) — 공개 페이지인데 sitemap에 없었음 |
| `/privacy`      | 유지 (priority 0.2)                                        |

**sitemap 제거 대상**:

| 경로               | 제거 이유                               |
| ------------------ | --------------------------------------- |
| `/interview`       | 세션 없이 직접 접근 불가, 리디렉션 발생 |
| `/archive`         | 인증 필요, robots.txt disallow          |
| `/favorites`       | 인증 필요, robots.txt disallow          |
| `/team-spaces/new` | 인증 필요, robots.txt disallow          |
| `/auth`            | robots.txt disallow와 모순              |
| `/trends?topic=X`  | 쿼리 파라미터 URL, 중복 콘텐츠 가능성   |

---

## 4. Implementation Plan

### Phase 1: robots.ts 수정

**파일**: `src/app/robots.ts`

- 모든 userAgent 규칙의 disallow 배열에 `/archive`, `/favorites`, `/team-spaces/`, `/interview` 추가
- 기존 `/api/`, `/auth/`, `/complete/` 유지

### Phase 2: sitemap.ts 정리

**파일**: `src/app/sitemap.ts`

- staticPages에서 제거: `/interview`, `/archive`, `/favorites`, `/team-spaces/new`, `/auth`
- staticPages에 추가: `/faq` (공개 페이지)
- trendPages (쿼리 파라미터 URL) 섹션 제거
- `TREND_TOPICS` import 제거

### Phase 3: 검증

- `npm run build` 성공 확인
- 빌드 후 생성된 robots.txt, sitemap.xml 내용 확인

---

## 5. Quality Gates

- [x] Build: Success
- [ ] TypeScript: No errors (`npx tsc --noEmit`)
- [ ] Lint: Pass (`npx eslint src/`)
- [ ] robots.txt에 인증 경로 disallow 포함 확인
- [ ] sitemap.xml에 인증 필요 페이지 미포함 확인
- [ ] sitemap.xml에 쿼리 파라미터 URL 미포함 확인
- [ ] `/faq` 페이지 sitemap 포함 확인

---

## 6. Risks & Dependencies

| 리스크                                                          | 영향 | 완화                                                  |
| --------------------------------------------------------------- | ---- | ----------------------------------------------------- |
| robots.txt 변경 후 기존 색인된 인증 페이지가 즉시 제거되지 않음 | 낮음 | Google이 점진적으로 재크롤링하여 반영                 |
| trends 쿼리 파라미터 URL이 이미 일부 색인됨                     | 낮음 | `/trends` 기본 페이지로 통합, 시간이 지나면 자연 정리 |

---

## 7. References

- [#52](https://github.com/kwakseongjae/dev-interview/issues/52)
- [#39 AEO/SEO/GEO 최적화](https://github.com/kwakseongjae/dev-interview/issues/39) — 관련 SEO 이슈
- Google: [robots.txt Introduction](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- Google: [Block Search Indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

---

## Implementation Summary

**Completion Date**: 2026-03-11
**Implemented By**: Claude Opus 4.6

### Changes Made

#### Files Modified

- [src/app/robots.ts](src/app/robots.ts) — `DISALLOW_PATHS` 상수 추출로 DRY 리팩토링, 인증 필요 경로 4개 추가 (`/archive`, `/favorites`, `/team-spaces`, `/interview`), trailing slash 통일 (`/auth/` → `/auth`, `/complete/` → `/complete`, `/team-spaces/` → `/team-spaces`)
- [src/app/sitemap.ts](src/app/sitemap.ts) — 인증 필요 페이지 5개 제거 (`/interview`, `/archive`, `/favorites`, `/team-spaces/new`, `/auth`), `/trends?topic=X` 쿼리 파라미터 URL 제거 및 `TREND_TOPICS` import 제거, `/faq` 공개 페이지 추가

#### Key Implementation Details

- robots.ts: 동일 disallow 배열을 7번 반복하던 것을 `DISALLOW_PATHS` 상수로 추출 (DRY)
- robots.ts: trailing slash 통일 — `/api/`만 유지 (하위 경로만 차단 의도), 나머지는 slash 없이 prefix match
- sitemap.ts: robots.txt disallow와 sitemap 일관성 확보 (disallow 페이지는 sitemap에 미포함)
- sitemap.ts: 쿼리 파라미터 URL 제거로 중복 콘텐츠 리스크 해소

### Red Team Analysis

레드팀 분석을 통해 추가 발견:

- **근본 원인**: Vercel 도메인 `mochabun.co.kr` → `www.mochabun.co.kr` 307 Temporary Redirect가 "리디렉션 포함 페이지"의 주 원인
- **조치**: Vercel에서 307 → 308 Permanent Redirect로 수동 변경 필요 (코드 외 인프라 작업)
- **코드 변경 효과**: 인증 페이지 크롤링 낭비 방지 + sitemap 위생 개선 (근본 원인과 상호 보완적)

### Quality Validation

- [x] Build: Success
- [x] Type Check: Passed
- [x] Lint: Passed

### Deviations from Plan

**Added**:

- robots.ts DRY 리팩토링 (`DISALLOW_PATHS` 상수 추출) — 레드팀 리뷰에서 발견된 유지보수성 문제 해결
- trailing slash 통일 — 기존 `/complete/`, `/auth/` 등이 정확한 경로를 차단하지 못하는 버그 수정

**Changed**:

- 없음

**Skipped**:

- 없음

### Follow-up Tasks (수동)

- [ ] Vercel Dashboard에서 `mochabun.co.kr` 리디렉션 307 → 308 변경
- [ ] Search Console에서 사이트맵 재제출
- [ ] Search Console에서 주요 페이지 색인 생성 요청
- [ ] 1~4주 후 "리디렉션이 포함된 페이지" 수 감소 확인

---

## QA Checklist

> Generated by qa-generator agent — 2026-03-11

### 테스트 요약

- **총 테스트 케이스**: 18개
- **우선순위별**: High 8, Medium 7, Low 3

### 기능 테스트 — robots.txt

| #    | 테스트 시나리오              | 테스트 단계                                                                        | 예상 결과                                                       | 우선순위 |
| ---- | ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------- |
| FT-1 | 인증 필요 경로 disallow 확인 | 빌드 후 robots.txt에서 `/archive`, `/favorites`, `/team-spaces`, `/interview` 확인 | 모든 userAgent 규칙에 4개 경로 포함                             | High     |
| FT-2 | trailing slash 통일 확인     | robots.txt에서 `/auth`, `/complete`, `/team-spaces` 확인                           | trailing slash 없이 prefix match 방식으로 통일 (`/api/`만 예외) | High     |
| FT-3 | Sitemap URL 확인             | robots.txt의 Sitemap 항목 확인                                                     | `https://www.mochabun.co.kr/sitemap.xml`                        | Medium   |
| FT-4 | DISALLOW_PATHS 상수 통합     | robots.ts 소스에서 disallow 배열 반복 여부 확인                                    | 단일 `DISALLOW_PATHS` 상수를 7개 규칙이 공유                    | Low      |

### 기능 테스트 — sitemap.xml

| #    | 테스트 시나리오             | 테스트 단계                                                                                      | 예상 결과                                              | 우선순위 |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------- |
| FT-5 | 인증 필요 페이지 제거 확인  | 빌드 후 sitemap.xml에서 `/archive`, `/favorites`, `/team-spaces/new`, `/auth`, `/interview` 검색 | 5개 경로 미포함                                        | High     |
| FT-6 | `/faq` 페이지 추가 확인     | sitemap.xml에서 `/faq` 검색                                                                      | `https://www.mochabun.co.kr/faq` 포함 (priority 0.7)   | High     |
| FT-7 | 쿼리 파라미터 URL 제거 확인 | sitemap.xml에서 `?topic=` 검색                                                                   | `/trends?topic=X` 형태 URL 없음                        | High     |
| FT-8 | 공개 페이지 유지 확인       | sitemap.xml에서 `/`, `/search`, `/case-studies`, `/trends`, `/privacy` 검색                      | 5개 공개 페이지 + `/faq` + case study 동적 페이지 포함 | High     |

### 엣지 케이스

| #    | 테스트 시나리오                         | 테스트 단계                                                                     | 예상 결과                                               | 우선순위 |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| EC-1 | `/archive/[id]` prefix match 차단       | robots.txt에서 `/archive` 규칙이 `/archive/123`도 차단하는지 확인               | `/archive` prefix match로 하위 경로도 차단됨            | Medium   |
| EC-2 | `/team-spaces/[id]` prefix match 차단   | robots.txt에서 `/team-spaces`가 `/team-spaces/123/manage`도 차단하는지 확인     | `/team-spaces` prefix match로 모든 하위 경로 차단       | Medium   |
| EC-3 | `/auth/callback` prefix match 차단      | robots.txt에서 `/auth`가 `/auth/callback`도 차단하는지 확인                     | `/auth` prefix match로 콜백 경로도 차단됨 (의도된 동작) | Medium   |
| EC-4 | `/case-studies/[slug]/interview` 미차단 | robots.txt `/interview`가 `/case-studies/slug/interview`를 차단하지 않는지 확인 | prefix match는 URL 시작부터 매칭하므로 차단되지 않음    | Medium   |

### 빌드 및 회귀 테스트

| #    | 테스트 시나리오          | 테스트 단계                                     | 예상 결과                         | 우선순위 |
| ---- | ------------------------ | ----------------------------------------------- | --------------------------------- | -------- |
| RT-1 | 빌드 성공                | `npm run build`                                 | 에러 없이 성공                    | High     |
| RT-2 | 타입 체크 통과           | `npx tsc --noEmit`                              | 에러 없음                         | High     |
| RT-3 | 공개 페이지 접근 정상    | `/`, `/search`, `/trends`, `/faq` 브라우저 접근 | 200 상태 코드 반환                | Medium   |
| RT-4 | TREND_TOPICS import 제거 | sitemap.ts에서 미사용 import 없는지 확인        | `@/data/trend-topics` import 없음 | Low      |

### 수동 확인 사항

| #    | 확인 항목                      | 확인 방법                                      | 예상 결과                       | 우선순위 |
| ---- | ------------------------------ | ---------------------------------------------- | ------------------------------- | -------- |
| MN-1 | Vercel 307 → 308 리디렉션 변경 | Vercel Dashboard → Domains → mochabun.co.kr    | 308 Permanent Redirect로 변경됨 | High     |
| MN-2 | Search Console 사이트맵 재제출 | Search Console → 사이트맵 → sitemap.xml 재제출 | 사이트맵 처리됨 상태            | Low      |
