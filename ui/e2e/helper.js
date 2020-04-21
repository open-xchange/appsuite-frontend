const Helper = require('@open-xchange/codecept-helper').helper;
const { util } = require('@open-xchange/codecept-helper');

class MyHelper extends Helper {

    async haveLockedFile(data, options) {
        const { httpClient, session } = await util.getSessionForUser(options);
        const response = await httpClient.put('/appsuite/api/files', data, {
            params: {
                action: 'lock',
                id: data.id,
                folder: data.folder_id,
                session
            }
        });
        return response.data;
    }

    async allowClipboardRead() {
        const { browser, config } = this.helpers['Puppeteer'];
        const context = browser.defaultBrowserContext();
        context.overridePermissions(config.url.replace(/\/appsuite\//, ''), ['clipboard-read']);
    }

    // TODO Can be removed as soon as this is fixed in codecept
    async pressKeys(key) {
        if (this.helpers['WebDriver']) {
            return this.helpers['WebDriver'].pressKey(key);
        }
        if (this.helpers['Puppeteer']) {
            return [...key].forEach(k => this.helpers['Puppeteer'].pressKey(k));
        }
    }

    /*
     * Overwrite native puppeteer d&d, because it does not work for every case
     * Maybe this is going to be fixed in the future by puppeteer, then this can be removed.
     * Note that this does not work on MacOS, as there the "page.mouse.move" will always move the cursor to the screen position of the users mouse
     */
    async dragAndDrop(srcSelector, targetSelector) {
        const wdio = this.helpers['WebDriver'];
        if (wdio) return wdio.dragAndDrop.apply(wdio, arguments);

        const helper = this.helpers['Puppeteer'];
        const { page } = helper;

        const [src] = await helper._locate(srcSelector);
        const [target] = await helper._locate(targetSelector);
        const srcBB = await src.boundingBox();
        const targetBB = await target.boundingBox();

        const startX = srcBB.x + srcBB.width / 2;
        const startY = srcBB.y + srcBB.height / 2;
        const endX = targetBB.x + targetBB.width / 2;
        const endY = targetBB.y + targetBB.height / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY);
        await page.mouse.up();
    }
    // Expose some puppeteer functionality
    amUsingPuppeteer() {
        const helper = this.helpers['Puppeteer'];
        return !!helper;
    }
    /*
     * Wait for the file chooser dialog to appear
     * FIXME: With the chromium version included in codeceptjs
     *   the puppeteer API interacting with file choosers apparently
     *   does not work. 
     */
    async waitForFileChooser(timeout) {
        if (!timeout) {
            timeout = 2;
        }
        const helper = this.helpers['Puppeteer'];
        helper.ox = helper.ox || {};
        const { page } = helper;
        helper.ox.fileChooser = await page.waitForFileChooser({ timeout: timeout * 1000 });
    }

    /*
     * Cancel the file chooser dialog
     */
    async cancelFileChooser() {
        const helper = this.helpers['Puppeteer'];
        if (helper.ox && helper.ox.fileChooser) {
            await helper.ox.fileChooser.fileChooser.cancel();
            delete helper.ox.fileChooser;
        } else {
            // Error out!
            helper.fail('There is no file chooser I can work on. Have you captured one using I.waitForFileChooser?');
        }
    }
}

module.exports = MyHelper;
