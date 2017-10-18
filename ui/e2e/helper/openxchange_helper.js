
class OpenxchangeHelper extends Helper {

    clickToolbar(selector, timeout, interval) {
        let wdio = this.helpers['WebDriverIO'],
            browser = wdio.browser,
            options = wdio.options;
        timeout = timeout || options.waitForTimeout;
        return wdio._locateClickable(selector).then(firstResult => {
            return browser.pause(500).then(() => firstResult);
        }).then(firstResult => {
            return browser.waitUntil(() => {
                return wdio._locateClickable(selector).then(secondResult => {
                    if (!!firstResult && !!secondResult && firstResult.length === 1 && secondResult.length === 1 && firstResult[0].ELEMENT === secondResult[0].ELEMENT) return true;
                    console.log('first result: ', firstResult);
                    console.log('second result: ', secondResult);
                    firstResult = secondResult;
                    return false;
                });
            }, timeout * 1000, `element ${selector} in toolbar is not clickable after ${timeout} seconds`, interval);
        }).then(() => {
            return wdio.click(selector);
        });
    }

    selectFolder(id) {
        let wdio = this.helpers['WebDriverIO'],
            browser = wdio.browser,
            options = wdio.options;

        browser.executeAsync((id, timeout, done) => {
            require(['io.ox/core/folder/api'], function (folderAPI) {
                function repeatUntil(cb, interval, timeout) {
                    var start = _.now(),
                        def = new $.Deferred(),
                        iterate = function () {
                            var result = cb();
                            if (!!result) return def.resolve(result);
                            if (_.now() - start < timeout) return _.delay(iterate, interval);
                            def.reject();
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
                    app.folder.set(model.get('id')).always(function () {
                        done();
                    });
                }, done);
            });
        }, id, options.waitForTimeout);
    }

    setSetting(module, name, value) {
        let wdio = this.helpers['WebDriverIO'],
            browser = wdio.browser;

        return browser.executeAsync((module, name, valueStr, done) => {
            require(['settings!' + module], function (settings) {
                settings.set(name, JSON.parse(valueStr));
                done();
            });
        }, module, name, JSON.stringify(value));
    }

}

module.exports = OpenxchangeHelper;
