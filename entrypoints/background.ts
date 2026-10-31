import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

import { lichessOrigin, toolbarEnabled } from '../lib/toolbar';

// Runs as a service worker in Chrome and an event page in Firefox: no
// `window`, no DOM. Its only job is greying the toolbar button; the popup
// does the work of a click.
export default defineBackground({
  type: 'module',
  main() {
    browser.tabs.onUpdated.addListener((tabId, change, tab) => {
      // Off Lichess `change.url` is hidden from us, but a navigation still
      // reports `loading`.
      if (change.status !== 'loading' && change.url === undefined) return;
      void hasLichessAccess().then((access) =>
        setTabEnabled(tabId, toolbarEnabled(tab.url, access)),
      );
    });
    browser.permissions.onAdded.addListener(() => void syncAllTabs());
    browser.permissions.onRemoved.addListener(() => void syncAllTabs());
    // Firefox has no manifest key for an initially disabled action.
    void syncAllTabs();
  },
});

function hasLichessAccess(): Promise<boolean> {
  return browser.permissions.contains({ origins: [lichessOrigin] });
}

async function syncAllTabs(): Promise<void> {
  const access = await hasLichessAccess();
  await (access ? browser.action.disable() : browser.action.enable());
  const tabs = await browser.tabs.query({});
  await Promise.all(
    tabs.flatMap(({ id, url }) =>
      id === undefined ? [] : [setTabEnabled(id, toolbarEnabled(url, access))],
    ),
  );
}

function setTabEnabled(tabId: number, enabled: boolean): Promise<void> {
  return enabled ? browser.action.enable(tabId) : browser.action.disable(tabId);
}
