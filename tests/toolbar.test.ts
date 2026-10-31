import { expect, it } from 'vitest';

import { toolbarEnabled } from '../lib/toolbar';

it.each([
  ['https://lichess.org/7WuuzbB4', true],
  ['https://lichess.org/', true],
  ['https://example.com/', false],
  ['https://lichess.org.example.com/', false],
  [undefined, false],
])('with lichess.org access, %s is %s', (url, enabled) => {
  expect(toolbarEnabled(url, true)).toBe(enabled);
});

it.each(['https://lichess.org/7WuuzbB4', 'https://example.com/', undefined])(
  'without lichess.org access, %s is enabled',
  (url) => {
    expect(toolbarEnabled(url, false)).toBe(true);
  },
);
