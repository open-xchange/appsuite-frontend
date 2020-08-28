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

    async clearFolders(folders, options) {
        const { httpClient, session } = await util.getSessionForUser(options);
        return httpClient.put('appsuite/api/folders', [].concat.apply(this, [folders]), {
            params: {
                action: 'clear',
                session: session
            }
        });
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

    // implementation based on https://github.com/puppeteer/puppeteer/issues/1376
    // helper for dropzones, works with single file(string) or multiple files(array of strings)
    async dropFiles(filePath, dropZoneSelector) {

        const { page } = this.helpers['Puppeteer'];

        // prepare temp file input
        await page.evaluate(function (filePath, dropZoneSelector) {
            document.body.appendChild(Object.assign(
                document.createElement('input'),
                {
                    id: 'temp-dropzone-helper',
                    type: 'file',
                    multiple: 'multiple',
                    onchange: e => {
                        // use file input to create a fake drop event on the dropzone
                        document.querySelector(dropZoneSelector).dispatchEvent(Object.assign(
                            new Event('drop'),
                            { dataTransfer: { files: e.target.files } }
                        ));
                    }
                }
            ));
        }, filePath, dropZoneSelector);

        // upload file
        const fileInput = await page.$('#temp-dropzone-helper');
        // string = single file, array = multiple files
        await typeof filePath === 'string' ? fileInput.uploadFile(filePath) : fileInput.uploadFile.apply(fileInput, filePath);

        // cleanup
        await page.evaluate(function () {
            document.getElementById('temp-dropzone-helper').remove();
        });
    }

    async throttleNetwork(networkConfig) {

        // some network speed presets
        const presets = {
            OFFLINE: {
                'offline': true,
                'downloadThroughput': 0,
                'uploadThroughput': 0,
                'latency': 0
            },
            GPRS: {
                'offline': false,
                'downloadThroughput': 50 * 1024 / 8,
                'uploadThroughput': 20 * 1024 / 8,
                'latency': 500
            },
            '2G': {
                'offline': false,
                'downloadThroughput': 250 * 1024 / 8,
                'uploadThroughput': 50 * 1024 / 8,
                'latency': 300
            },
            '3G': {
                'offline': false,
                'downloadThroughput': 750 * 1024 / 8,
                'uploadThroughput': 250 * 1024 / 8,
                'latency': 100
            },
            '4G': {
                'offline': false,
                'downloadThroughput': 4 * 1024 * 1024 / 8,
                'uploadThroughput': 3 * 1024 * 1024 / 8,
                'latency': 20
            },
            DSL: {
                'offline': false,
                'downloadThroughput': 2 * 1024 * 1024 / 8,
                'uploadThroughput': 1 * 1024 * 1024 / 8,
                'latency': 5
            },
            // no throttling, use this to reset the connection
            ONLINE: {
                'offline': false,
                'downloadThroughput': -1,
                'uploadThroughput': -1,
                'latency': 0
            }
        };

        const { page } = this.helpers['Puppeteer'];

        // get Chrome DevTools session
        const devTools = await page.target().createCDPSession();

        // Set network speed, use preset if its there
        await devTools.send('Network.emulateNetworkConditions', presets[networkConfig.toUpperCase()] || networkConfig);
    }

    // emulate other devices
    // use this before login, otherwise your session is lost (user agent change)
    async emulateDevice(device) {

        // add some presets
        // Todo: list is just some examples at this point, we need to check which devices are needed here
        const presets = {
            'APPLE IPHONE 4': {
                width: 320,
                height: 480,
                deviceScaleFactor: 2,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5'
            },
            'APPLE IPHONE 5': {
                width: 320,
                height: 568,
                deviceScaleFactor: 2,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53'
            },
            'APPLE IPHONE X': {
                width: 375,
                height: 812,
                deviceScaleFactor: 3,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
            },
            'GOOGLE NEXUS 4': {
                width: 384,
                height: 640,
                deviceScaleFactor: 2,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 4 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
            },
            'GOOGLE NEXUS 5': {
                width: 360,
                height: 640,
                deviceScaleFactor: 3,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19'
            },
            'GOOGLE NEXUS S': {
                width: 320,
                height: 533,
                deviceScaleFactor: 1.5,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; Nexus S Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
            },
            'SAMSUNG GALAXY S10': {
                width:  360,
                height: 740,
                deviceScaleFactor: 4,
                touch: { enabled: true },
                mobile: true,
                userAgent: 'Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G973F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.0 Chrome/67.0.3396.87 Mobile Safari/537.36'
            }
        };

        const { page } = this.helpers['Puppeteer'];

        // get Chrome DevTools session
        const devTools = await page.target().createCDPSession();
        // Override UserAgent
        await devTools.send('Emulation.setUserAgentOverride', (presets[device.toUpperCase()] || device));
        // Enable Touch events
        await devTools.send('Emulation.setTouchEmulationEnabled', (presets[device.toUpperCase()] || device).touch);
        // Override DeviceMetrics
        await devTools.send('Emulation.setDeviceMetricsOverride', (presets[device.toUpperCase()] || device));
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
        await page.evaluate(async (ss, X, Y) => {
            ss.dispatchEvent(new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                screenX: X,
                screenY: Y,
                clientX: X,
                clientY: Y
            }));
        }, src, startX, startY);
        await page.mouse.move(endX, endY);
        await page.evaluate(async (ts, X, Y) => {
            ts.dispatchEvent(new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true,
                screenX: X,
                screenY: Y,
                clientX: X,
                clientY: Y
            }));
            ts.dispatchEvent(new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                screenX: X,
                screenY: Y,
                clientX: X,
                clientY: Y
            }));
        }, target, endX, endY);
        await page.mouse.up();
        await page.evaluate(async (ss, X, Y) => {
            ss.dispatchEvent(new DragEvent('dragend', {
                bubbles: true,
                cancelable: true,
                screenX: X,
                screenY: Y,
                clientX: X,
                clientY: Y
            }));
            ss.dispatchEvent(new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                screenX: X,
                screenY: Y,
                clientX: X,
                clientY: Y
            }));
        }, src, endX, endY);
    }

    async grabFocusFrom(selector) {
        const driver = this.helpers['Puppeteer'],
            { page } = driver;

        const el = await driver._locate(selector);
        if (!el) return false;
        return !!(await page.accessibility.snapshot({ root: el[0], interestingOnly: false })).focused;
    }

    async haveFocus(selector) {
        const driver = this.helpers['Puppeteer'],
            { page } = driver;

        const el = await driver._locate(selector);
        if (!el) return false;
        return !!(await page.accessibility.snapshot({ root: el[0], interestingOnly: false })).focused;
    }


    dontHaveFocus(selector) {
        return !this.haveFocus(selector);
    }

    async seeTabbable(selector) {
        const driver = this.helpers['Puppeteer'],
            { page } = driver;

        const el = await driver._locate(selector);
        if (!el) return false;
        const [{ role }, tabindex] = await Promise.all([
            page.accessibility.snapshot({ root: el[0], interestingOnly: false }),
            driver.grabAttributeFrom(selector, 'tabindex')
        ]);
        if (tabindex < 0) return false;
        return /^(button|searchbox|combobox|menuitem|menuitemcheckbox|textbox|link|checkbox)|$/.test(role);
    }

    dontSeeTabbable(selector) {
        return !this.seeTabbable(selector);
    }

    async seeFocusable(selector) {
        const driver = this.helpers['Puppeteer'],
            { page } = driver;

        const el = await driver._locate(selector);
        if (!el) return false;
        const [{ role }, tabindex] = await Promise.all([
            page.accessibility.snapshot({ root: el[0], interestingOnly: false }),
            driver.grabAttributeFrom(selector, 'tabindex')
        ]);
        if (tabindex) return true;
        return /^(button|searchbox|combobox|menuitem|menuitemcheckbox|textbox|link|checkbox)|$/.test(role);
    }

    dontSeeFocusable(selector) {
        return !this.seeFocusable(selector);
    }

    // When we need to click slower than puppeteer
    // Click on target with mouse down and release after delay
    async slowClick(targetSelector, delay = 100) {
        const helper = this.helpers['Puppeteer'];
        const { page } = helper;

        const [target] = await helper._locate(targetSelector);
        const targetBB = await target.boundingBox();

        const targetX = targetBB.x + targetBB.width / 2;
        const targetY = targetBB.y + targetBB.height / 2;

        await page.mouse.move(targetX, targetY);
        await page.mouse.down();
        await page.waitFor(delay);
        await page.mouse.up();

    }

}

module.exports = MyHelper;
