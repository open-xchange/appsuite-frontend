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

    async selectFolder(id) {
        let browser, options, funcName;

        if (this.helpers['WebDriver']) {
            let wdio = this.helpers['WebDriver'];
            browser = wdio.browser;
            options = wdio.options;
            funcName = 'executeAsync';
        } else {
            let puppeteer = this.helpers['Puppeteer'];
            browser = puppeteer.page;
            options = puppeteer.options;
            funcName = 'evaluate';
        }

        if (options.waitForTimeout < 1000) options.waitForTimeout = options.waitForTimeout * 1000;

        const error = await browser[funcName]((id, timeout, done) => {
            require(['io.ox/core/folder/api'], function (folderAPI) {
                function repeatUntil(cb, interval, timeout) {
                    var start = _.now(),
                        def = new $.Deferred(),
                        iterate = function () {
                            var result = cb();
                            if (result) return def.resolve(result);
                            if (_.now() - start < timeout) return _.delay(iterate, interval);
                            def.reject({ message: 'Folder API could not resolve folder after ' + timeout / 1000 + ' seconds' });
                        };
                    iterate();
                    return def;
                }

                repeatUntil(function () {
                    var model = _(folderAPI.pool.models).find(function (m) {
                        return m.get('title') === id || m.get('id') === id || m.get('display_title') === id;
                    });
                    return model;
                }, 100, timeout).then(function (model) {
                    var app = ox.ui.App.getCurrentApp();
                    // special handling for virtual folders
                    if (model.get('id').indexOf('virtual/') === 0) {
                        var body = app.getWindow().nodes.body;
                        if (body) {
                            var view = body.find('.folder-tree').data('view');
                            if (view) {
                                view.trigger('virtual', model.get('id'));
                            }
                        }
                    }
                    app.folder.set(model.get('id')).then(function () {
                        done();
                    }, done);
                }, function fail(error) {
                    done(error);
                });
            });
        }, id, options.waitForTimeout);

        if (error) throw error;
    }

    /*
     * Overwrite native puppeteer d&d, because it does not work for every case
     * Maybe this is going to be fixed in the future by puppeteer, then this can be removed.
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
