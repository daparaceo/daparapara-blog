#!/usr/bin/env node
/**
 * 생활정보 자동 포스트 생성 스크립트
 * - scripts/auto-post-topics.json 에서 첫 번째 토픽을 꺼내 Claude API로 본문 생성
 * - 결과 파일을 src/content/blog/{slug}.md 에 저장
 * - 마지막 줄에 "GENERATED:경로" 출력 (GitHub Actions에서 파싱)
 * - 토픽이 없으면 "NO_TOPIC" 출력 후 종료
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

// ── 경로 설정 ──────────────────────────────────────────────
const QUEUE_PATH = path.join(ROOT, 'scripts', 'auto-post-topics.json');
const GUIDE_PATH = path.join(ROOT, '.private', 'life-info-guide.md');
const POSTS_DIR  = path.join(ROOT, 'src', 'content', 'blog');

// ── 토픽 큐 로드 ───────────────────────────────────────────
let queue;
try {
  queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
} catch (e) {
  console.error('[generate-post] 토픽 큐 읽기 실패:', e.message);
  process.exit(1);
}

if (!Array.isArray(queue.pending) || queue.pending.length === 0) {
  console.log('NO_TOPIC');
  process.exit(0);
}

const topic = queue.pending.shift();
console.error(`[generate-post] 주제: ${topic.title}`);
console.error(`[generate-post] 슬러그: ${topic.slug}`);

// ── 날짜 (KST 기준) ────────────────────────────────────────
const now     = new Date();
const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const dateStr = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD

// ── 가이드 파일 로드 ───────────────────────────────────────
let guide = '';
try {
  guide = fs.readFileSync(GUIDE_PATH, 'utf-8');
} catch (e) {
  console.error('[generate-post] 가이드 파일 없음, 기본 설정으로 진행');
}

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

아래 주제로 생활정보 블로그 포스트를 작성해주세요.

주제: ${topic.title}
${topic.keywords ? `핵심 키워드: ${topic.keywords.join(', ')}` : ''}

출력 형식 — 아래 마크다운을 그대로 시작하세요. 다른 설명이나 코드 펜스 없이 파일 내용만 출력하세요.

---
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

// ── 파일 저장 ──────────────────────────────────────────────
const filename = `${topic.slug}.md`;
const filepath = path.join(POSTS_DIR, filename);

// 이미 같은 슬러그 파일이 있으면 날짜 접미사 추가
const finalFilepath = fs.existsSync(filepath)
  ? path.join(POSTS_DIR, `${topic.slug}-${dateStr}.md`)
  : filepath;

fs.writeFileSync(finalFilepath, textContent, 'utf-8');
const relPath = path.relative(ROOT, finalFilepath).replace(/\\/g, '/');
console.error(`[generate-post] 파일 저장: ${relPath}`);

// ── 큐 업데이트 ────────────────────────────────────────────
if (!Array.isArray(queue.completed)) queue.completed = [];
queue.completed.unshift({ ...topic, completedAt: dateStr });
fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n', 'utf-8');
console.error('[generate-post] 토픽 큐 업데이트 완료');

// ── 워크플로우용 결과 출력 ─────────────────────────────────
console.log(`GENERATED:${relPath}`);
