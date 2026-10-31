import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

// Runs as a service worker in Chrome and an event page in Firefox: no
// `window`, no DOM.
export default defineBackground({
  type: 'module',
  main() {
    // Firefox has no manifest key for an initially disabled action.
    void browser.action.disable();
  },
});
