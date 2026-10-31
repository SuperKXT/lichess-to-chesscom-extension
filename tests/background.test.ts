import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { beforeEach, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import background from '../entrypoints/background';

const game = 'https://lichess.org/7WuuzbB4';
const elsewhere = 'https://example.com/';

beforeEach(() => {
  vi.restoreAllMocks();
  fakeBrowser.reset();
});

/** Stubs what `fakeBrowser` leaves unmocked, with lichess.org access as given. */
function stubBrowser(access: boolean) {
  // The callback overload is the one `spyOn` infers; we only use the promise.
  const contains = (
    vi.spyOn(browser.permissions, 'contains') as unknown as MockInstance<
      () => Promise<boolean>
    >
  ).mockResolvedValue(access);
  const onAdded = vi
    .spyOn(browser.permissions.onAdded, 'addListener')
    .mockReturnValue(undefined);
  const onRemoved = vi
    .spyOn(browser.permissions.onRemoved, 'addListener')
    .mockReturnValue(undefined);
  const enable = vi
    .spyOn(browser.action, 'enable')
    .mockResolvedValue(undefined);
  const disable = vi
    .spyOn(browser.action, 'disable')
    .mockResolvedValue(undefined);
  return { contains, onAdded, onRemoved, enable, disable };
}

async function openTab(url: string): Promise<number> {
  const tab = await browser.tabs.create({ url });
  if (tab.id === undefined) throw new Error('The fake tab has no id.');
  return tab.id;
}

it('greys the button out everywhere but Lichess while it has lichess.org access', async () => {
  const lichessTab = await openTab(game);
  const otherTab = await openTab(elsewhere);
  const { enable, disable } = stubBrowser(true);

  background.main();

  await vi.waitFor(() => {
    expect(disable).toHaveBeenCalledWith();
    expect(enable).toHaveBeenCalledWith(lichessTab);
    expect(disable).toHaveBeenCalledWith(otherTab);
  });
});

it('keeps the button enabled everywhere without lichess.org access', async () => {
  const otherTab = await openTab(elsewhere);
  const { enable, disable } = stubBrowser(false);

  background.main();

  await vi.waitFor(() => {
    expect(enable).toHaveBeenCalledWith();
    expect(enable).toHaveBeenCalledWith(otherTab);
  });
  expect(disable).not.toHaveBeenCalled();
});

it('follows a tab as it navigates off Lichess', async () => {
  const tab = await openTab(game);
  const { disable } = stubBrowser(true);
  background.main();

  await browser.tabs.update(tab, { url: elsewhere });

  await vi.waitFor(() => {
    expect(disable).toHaveBeenCalledWith(tab);
  });
});

it('enables every tab once lichess.org access is revoked', async () => {
  const otherTab = await openTab(elsewhere);
  const { contains, onRemoved, enable } = stubBrowser(true);
  background.main();
  const [[onAccessRemoved] = []] = onRemoved.mock.calls;

  contains.mockResolvedValue(false);
  onAccessRemoved?.({ origins: ['https://lichess.org/*'] });

  await vi.waitFor(() => {
    expect(enable).toHaveBeenCalledWith(otherTab);
  });
});
