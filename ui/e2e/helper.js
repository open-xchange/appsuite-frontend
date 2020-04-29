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

}

module.exports = MyHelper;
