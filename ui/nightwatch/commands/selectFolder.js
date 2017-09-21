/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

var util = require('util');

/**
 * Selects a folder by id or title.
 * @param opt {object} Must contain exactly one of the following
 * @param opt.id {string} The id of the target folder.
 * @param opt.title {string} The title of the target folder.
 */
exports.command = function (opt) {

    var id = opt.id, windowid;

    // find the id, if only the title is specified
    if (opt.title) {
        // wait until element is in folder pool
        this.waitForStatement(function (title) {
            var folderAPI = require('io.ox/core/folder/api');
            if (!folderAPI) return;
            var model = _(folderAPI.pool.models).find(function (m) {
                return m.get('title') === title;
            });
            return !!model;
        }, [opt.title], 2500, 500, function error() {
            this.assert.fail('not found', 'folder-model', 'Timedout while waiting for folder model');
        });

        // find id for that model
        this.execute(function (title) {
            var folderAPI = require('io.ox/core/folder/api'),
                model = _(folderAPI.pool.models).find(function (m) {
                    return m.get('title') === title;
                });
            return model.get('id');
        }, [opt.title], function (result) {
            if (!result || !result.value) this.assert.fail('not found', 'folder id', util.format('Could not find a folder id for the folder with the title "%s".', opt.title));
            id = result.value;
        });
    }

    this
        .execute(function () {
            var w = ox.ui.App.getCurrentWindow();
            if (!w) return;
            return w.id;
        }, [], function (result) {
            if (!result.value) this.assert.fail('not found', 'current window', 'Could not find a current app window');
            windowid = result.value;
        })
        .execute(function () {
            ox.ui.App.getCurrentApp().folderView.show();
        })
        .perform(function (api, done) {
            api.waitForElementVisible(util.format('#%s .folder-tree', windowid), 2500);
            done();
        })
        .perform(function (api, done) {
            api.executeAsync(function (id, done) {
                var app = ox.ui.App.getCurrentApp();
                // special handling for virtual folders
                if (id.indexOf('virtual/') === 0) {
                    var body = app.getWindow().nodes.body;
                    if (body) {
                        var view = body.find('.folder-tree').data('view');
                        if (view) {
                            view.trigger('virtual', id);
                        }
                    }
                }
                ox.ui.App.getCurrentApp().folder.set(id).always(done);
            }, [id]);
            done();
        });

    return this;

};
