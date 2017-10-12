
'use strict';

class WebDriverIOExtension extends Helper {

    waitForFocus(selector, timeout, interval) {
        let wdio = this.helpers['WebDriverIO'],
            browser = wdio.browser,
            options = wdio.options;
        timeout = timeout || options.waitForTimeout;
        return browser.waitUntil(() => {
            return browser.hasFocus(selector);
        }, timeout * 1000, `element ${selector} still has no focus after ${timeout} seconds`, interval);
    }

}

module.exports = WebDriverIOExtension;
