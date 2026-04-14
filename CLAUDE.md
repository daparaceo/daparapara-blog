# CLAUDE.md — daparapara 블로그 작업 가이드

새 세션에서 이 파일을 읽으면 바로 이어서 작업할 수 있습니다.

---

## 프로젝트 개요

- **스택**: Astro + Tailwind CSS + @tailwindcss/typography
- **배포**: GitHub Pages (`daparaceo/daparapara-blog`)
- **포스트 위치**: `src/content/blog/*.md`
- **카테고리**: `life-info`, `camping`, `tech`, `finance`, `travel`, `food`, `english-reading`

---

## 작업 스타일 가이드

- 이모지 사용 금지 (코드·파일에 추가하지 않음)
- 파일 수정 전 변경 내용 미리 설명 후 진행
- 커밋 후 푸시는 사용자 승인 후 실행
- 글 작성 시 사용자가 "엉" 또는 "네" 하면 커밋/푸시 진행

---

## 생활정보(life-info) 블로그 포스트 작성 가이드

### 프론트매터 형식

```yaml
---
title: "제목 — 부제목"
description: "150자 이내 요약. SEO 핵심 키워드 포함."
publishedAt: 2026-04-14
category: "life-info"
tags: ["태그1", "태그2", "태그3", "연도"]
# 위치 정보가 있는 글에만 추가
locations:
  - lat: 37.5665
    lng: 126.9780
    label: "장소명"
---
```

### 글 구조 패턴

```
1. 도입부 (2~3줄) — 왜 이 글을 읽어야 하는지
2. 공식 출처 링크 blockquote (변동 가능한 정보 면책)
3. 핵심 정보 요약 표 (한눈에 보기)
4. 본문 섹션들 — H2로 나누기
5. 핵심 요약 표 (마무리)
6. CTA 1~2줄
```

### 작성 원칙

- **표(table)** 를 적극 활용 — 한국 독자는 표 선호
- 숫자·금액은 **볼드** 처리
- 공식 링크는 반드시 포함 (홈택스, 청약홈, 복지로 등)
- 변동 가능한 정보는 첫 blockquote에 면책 고지
- 마감일·신청기간은 강조 처리
- 파일명: 영문 kebab-case (`earned-income-tax-credit-2026.md`)

### 잘 작동하는 주제 유형

- 정부 지원금·장려금 신청 가이드 (근로장려금, 고유가지원금 등)
- 청약·부동산 관련 정보 (청약홈 신청방법, 줍줍 가이드 등)
- 금융 상품 비교 (K-패스 vs 기후동행카드, 청년미래적금 등)
- 세금 신고 가이드 (종합소득세, 연말정산 등)
- 시즌성 정보 (봄 캠핑장, 벚꽃 명소 등)

---

## 주요 기능

### 지도 임베드 (Leaflet)

프론트매터에 `locations` 배열 추가 시 본문 상단에 지도 자동 표시.
여러 마커 추가 시 `fitBounds()`로 자동 비율 조정.

```yaml
locations:
  - lat: 37.5665
    lng: 126.9780
    label: "장소 A"
  - lat: 35.1796
    lng: 129.0756
    label: "장소 B"
```

### 관련 포스트 자동 추천

같은 카테고리 내 태그 공통점·시리즈·저자 기준으로 점수 계산,
상위 3개를 글 하단에 자동 표시. 별도 설정 불필요.

---

## 기존 생활정보 포스트 목록

| 파일명 | 제목 | 발행일 |
|--------|------|--------|
| `kpass-vs-climate-card.md` | K-패스 vs 기후동행카드 비교 | 2026-04-07 |
| `high-oil-price-support-fund-2026.md` | 고유가 피해지원금 총정리 | 2026-04-07 |
| `youth-future-savings-2026.md` | 청년미래적금 완벽 가이드 | 2026-04-09 |
| `gangdong-heritage-xi-subscription.md` | 강동 헤리티지 자이 줍줍 가이드 | 2026-04-09 |
| `how-to-apply-for-housing-subscription.md` | 청약 신청방법 총정리 | 2026-04-10 |
| `comprehensive-income-tax-guide-2026.md` | 종합소득세 신고 완벽 가이드 | 2026-04-13 |
| `earned-income-tax-credit-2026.md` | 근로장려금 신청 완벽 가이드 | 2026-04-14 |

---

## 커밋 컨벤션

```bash
git add src/content/blog/파일명.md
git commit -m "feat: 포스트 제목 요약

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

푸시 전 사용자 승인 필수.
