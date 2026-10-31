import { defineConfig } from '@playwright/test';

// Chromium only: Playwright cannot load an extension into Firefox. Firefox is
// covered by `web-ext lint`, the reproducibility diff and the manual release
// check.
export default defineConfig({
  testDir: 'tests/e2e',
  // `.e2e.ts`, not `.test.ts`, so Vitest's default glob never picks these up.
  testMatch: '*.e2e.ts',
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
});
