// src/content/config.ts
// Astro Content Collections 스키마 정의
// 블로그 글의 프론트매터(front matter) 구조를 타입 안전하게 관리합니다

import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',  // 마크다운/MDX 콘텐츠
  schema: z.object({
    // 글 제목 (필수)
    title: z.string(),

    // 글 요약/설명 (SEO 및 목록 페이지에 표시)
    description: z.string().optional(),

    // 발행일 (필수)
    publishedAt: z.date(),

    // 태그 목록 (선택)
    tags: z.array(z.string()).optional().default([]),

    // OG 이미지 URL (선택, Cloudinary URL 권장)
    // 미설정 시 BaseLayout의 기본 OG 이미지 사용
    ogImage: z.string().optional(),

    // 초안 여부 (true이면 빌드에서 제외)
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
