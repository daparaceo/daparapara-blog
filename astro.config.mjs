// astro.config.mjs
// Astro 블로그 설정 파일
// GitHub Pages 배포 + 커스텀 도메인 대비 구성

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // -------------------------------------------------------
  // 배포 URL 설정
  // 커스텀 도메인 사용 시: 'https://yourdomain.com'
  // GitHub Pages 기본 URL 사용 시: 'https://username.github.io'
  // -------------------------------------------------------
  site: 'https://daparaceo.github.io',

  // GitHub Pages 하위 경로 배포 시 base 설정 (커스텀 도메인이면 주석 처리)
  // GitHub Pages 하위 경로 배포 (커스텀 도메인 연결 시 이 줄 주석 처리)
  base: '/GitpageBlog',

  integrations: [
    tailwind(),
    sitemap({
      // sitemap에 포함할 페이지 필터링 (선택 사항)
      // filter: (page) => page !== 'https://yourdomain.com/private/',
    }),
  ],

  // 마크다운 설정
  markdown: {
    // 코드 블록 신택스 하이라이팅 테마
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
