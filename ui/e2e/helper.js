const Helper = require('@open-xchange/codecept-helper').helper,
    axe = require('axe-core');
const { util } = require('@open-xchange/codecept-helper');

function assertElementExists(res, locator, prefixMessage = 'Element', postfixMessage = 'was not found by text|CSS|XPath') {
    if (!res || res.length === 0) {
        if (typeof locator === 'object') locator = locator.toString();
        throw new Error(`${prefixMessage} "${locator}" ${postfixMessage}`);
    }
}
class MyHelper extends Helper {

    // will hopefully be removed when codecept 2.0 works as expected
    async grabHTMlFrom2(locator) {

        let wdio = this.helpers['WebDriver'];

        const elems = await wdio._locate(locator, true);
        assertElementExists(elems, locator);
        const html = Promise.all(elems.map(async elem => elem.getHTML()));
        this.debugSection('Grab', html);
        return html;

    }

    // This needs to be a helper, as actors are too verbose in this case
    async grabAxeReport(context, options) {
        let wdio = this.helpers['WebDriver'],
            browser = wdio.browser;
        if (typeof options === 'undefined') options = {};
        if (typeof context === 'undefined') context = '';
        const report = await browser.executeAsync(function (axeSource, context, options, done) {
            if (typeof axe === 'undefined') {
                // eslint-disable-next-line no-eval
                window.eval(axeSource);
            }
            // Arity needs to be correct here so we need to compact arguments
            window.axe.run.apply(this, _.compact([context || $('html'), options])).then(function (report) {
                try {
                    var nodes = [];
                    for (const violation of report.violations) {
                        for (const node of violation.nodes) {
                            nodes.push(node.target);
                            for (const combinedNodes of [node.all, node.any, node.none]) {
                                if (!_.isEmpty(combinedNodes)) {
                                    for (const any of combinedNodes) {
                                        for (const relatedNode of any.relatedNodes) {
                                            nodes.push(relatedNode.target);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    $(nodes.join(',')).css('border', '2px solid red');
                } catch (err) {
                    done(err.message);
                }
                done(report);
            });
        }, axe.source, context, options);
        if (typeof report === 'string') throw report;
        return report;
    }

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
        let wdio = this.helpers['WebDriver'],
            browser = wdio.browser,
            options = wdio.options;

        const error = await browser.executeAsync((id, timeout, done) => {
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
        }, id, options.waitForTimeout * 1000);

        if (error) throw error;
    }

}

module.exports = MyHelper;
