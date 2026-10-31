import { browser } from 'wxt/browser';

import { openOnChessCom } from '../../lib/open';
import {
  errorMessage,
  fetchingMessage,
  refusalMessage,
} from '../../lib/refusal';

// The popup is the toolbar button's only surface, so it does the click's
// work: it closes once Chess.com opens, and stays open to explain otherwise.
const message = document.querySelector('#message');
if (message === null) throw new Error('The popup has no #message element.');
message.textContent = fetchingMessage;

// `activeTab` makes the URL readable here even without lichess.org access.
const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
const outcome = await openOnChessCom(tab?.url ?? '');

if (outcome.kind === 'import') {
  await browser.tabs.create({
    url: outcome.url,
    active: true,
    ...(tab?.id === undefined
      ? {}
      : { index: tab.index + 1, openerTabId: tab.id }),
  });
  window.close();
} else {
  message.textContent =
    outcome.kind === 'error'
      ? errorMessage(outcome.error)
      : refusalMessage(outcome);
}
