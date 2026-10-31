import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { beforeEach, expect, it, vi } from 'vitest';

import background from '../entrypoints/background';

beforeEach(() => {
  fakeBrowser.reset();
});

it('starts with the toolbar action disabled', () => {
  const disable = vi
    .spyOn(browser.action, 'disable')
    .mockResolvedValue(undefined);

  background.main();

  expect(disable).toHaveBeenCalledWith();
});
