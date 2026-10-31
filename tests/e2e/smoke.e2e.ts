import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext, Worker } from '@playwright/test';
import { join } from 'node:path';
import type { WxtBrowser } from 'wxt/browser';

// The callbacks passed to `background.evaluate` run inside the service
// worker, where Chrome 148+ exposes `browser` natively.
declare const browser: WxtBrowser;

const extensionPath = join(import.meta.dirname, '../../.output/chrome-mv3');

let context: BrowserContext;
let background: Worker;

test.beforeAll(async () => {
  // The `chromium` channel is the new headless mode, which loads extensions;
  // the default headless shell does not.
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  background =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
});

test.afterAll(async () => {
  await context.close();
});

test('the built extension loads and its background starts', async () => {
  expect(background.url()).toMatch(
    /^chrome-extension:\/\/[a-p]{32}\/background\.js$/,
  );
  const name = await background.evaluate(
    () => browser.runtime.getManifest().name,
  );
  expect(name).toBe('Lichess to Chess.com Review');
});

test('the toolbar action starts disabled', async () => {
  const enabled = await background.evaluate(() => browser.action.isEnabled());
  expect(enabled).toBe(false);
});
