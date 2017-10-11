const codecept = require('codeceptjs');

module.exports = function (id) {

    const config = codecept.config.get(),
        webDriver = config.helpers['WebDriverIO'];

    this.executeAsyncScript(function (id, timeout, done) {
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
                app.folder.set(model.get('id')).always(done);
            }, done);
        });
    }, id, webDriver.waitForTimeout);

};
