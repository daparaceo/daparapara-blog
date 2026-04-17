#!/usr/bin/env node
/**
 * 생활정보 자동 포스트 생성 스크립트
 * - src/content/blog/ 의 기존 포스트를 스캔해 중복 방지
 * - 오늘 기준 핫한 이슈 중 기존에 없는 주제를 Claude가 직접 선택
 * - 결과 파일을 src/content/blog/{slug}.md 에 저장
 * - 마지막 줄에 "GENERATED:경로" 출력 (GitHub Actions에서 파싱)
 *
 * 사용:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-post.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');

const GUIDE_PATH = path.join(ROOT, '.private', 'life-info-guide.md');
const POSTS_DIR  = path.join(ROOT, 'src', 'content', 'blog');

// ── 날짜 (KST 기준) ────────────────────────────────────────
const now     = new Date();
const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const dateStr = kstDate.toISOString().split('T')[0];

// ── 가이드 파일 로드 ───────────────────────────────────────
let guide = '';
try {
  guide = fs.readFileSync(GUIDE_PATH, 'utf-8');
} catch (e) {
  console.error('[generate-post] 가이드 파일 없음, 기본 설정으로 진행');
}

// ── 기존 포스트 목록 스캔 ──────────────────────────────────
const existingTitles = fs.readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    try {
      const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
      const match = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      return match ? match[1] : f.replace('.md', '');
    } catch {
      return f.replace('.md', '');
    }
  });

console.error(`[generate-post] 기존 포스트 ${existingTitles.length}개 확인`);

// ── Claude API 호출 ────────────────────────────────────────
const client = new Anthropic();

const systemPrompt = `당신은 한국 생활정보 블로그 daparapara.com의 전문 콘텐츠 작성자입니다.
한국 독자를 위한 실용적이고 정확한 생활정보 글을 작성합니다.

${guide ? `아래는 블로그 작업 가이드입니다:\n${guide}` : ''}

글 작성 규칙:
- 이모지 사용 절대 금지
- 표(table)를 적극 활용하여 가독성 향상
- 숫자와 금액은 **볼드** 처리
- 공식 출처 링크 반드시 포함 (홈택스, 복지로, 청약홈 등)
- 변동 가능한 정보는 첫 번째 blockquote에 면책 고지
- 글 길이: 최소 1,500자 이상
- 순수 마크다운 형식으로 작성 (코드 블록 래퍼 없이)`;

const userPrompt = `오늘 날짜: ${dateStr}

아래는 이미 작성된 포스트 목록입니다:
${existingTitles.map((t) => `- ${t}`).join('\n')}

오늘 기준 핫한 이슈 중 기존에 없는 주제로 알아서 골라 써줘.

출력 형식 — 아래 마크다운을 그대로 시작하세요. 다른 설명이나 코드 펜스 없이 파일 내용만 출력하세요.
slug 필드는 파일명으로 사용되므로 반드시 영문 kebab-case로 작성하세요.

---
slug: "영문-kebab-case-슬러그"
title: "제목 — 부제목 (독자가 클릭하고 싶은 SEO 제목)"
description: "150자 이내 요약. 핵심 키워드 포함."
publishedAt: ${dateStr}
category: "life-info"
tags: ["태그1", "태그2", "태그3", "2026"]
ogImage: "https://res.cloudinary.com/dtv8s65sa/image/upload/f_auto,q_auto/daparapara/blog/global/og-default"
---

(본문 — H2 섹션으로 구분, 표 활용, 공식 링크 포함, 최소 1,500자)`;

console.error('[generate-post] Claude API 호출 중...');

let response;
try {
  response = await client.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userPrompt }],
  }).finalMessage();
} catch (e) {
  console.error('[generate-post] API 오류:', e.message);
  process.exit(1);
}

// ── 텍스트 추출 ────────────────────────────────────────────
const textContent = response.content
  .filter((block) => block.type === 'text')
  .map((block) => block.text)
  .join('');

if (!textContent.trim()) {
  console.error('[generate-post] 빈 응답 수신');
  process.exit(1);
}

// ── slug 추출 후 프론트매터에서 제거 ──────────────────────
const slugMatch = textContent.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m);
if (!slugMatch) {
  console.error('[generate-post] slug 필드를 찾을 수 없습니다');
  process.exit(1);
}
const slug = slugMatch[1];
const cleanedContent = textContent.replace(/^slug:.*\n/m, '');

console.error(`[generate-post] 선택된 슬러그: ${slug}`);

// ── 파일 저장 ──────────────────────────────────────────────
const filename      = `${slug}.md`;
const baseFilepath  = path.join(POSTS_DIR, filename);
const finalFilepath = fs.existsSync(baseFilepath)
  ? path.join(POSTS_DIR, `${slug}-${dateStr}.md`)
  : baseFilepath;

fs.writeFileSync(finalFilepath, cleanedContent, 'utf-8');
const relPath = path.relative(ROOT, finalFilepath).replace(/\\/g, '/');
console.error(`[generate-post] 파일 저장: ${relPath}`);

// ── 워크플로우용 결과 출력 ─────────────────────────────────
console.log(`GENERATED:${relPath}`);
