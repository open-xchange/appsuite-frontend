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

    var id = opt.id;

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
        .waitForElementVisible('.folder-tree', 2500)
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
        })
        // add some time to start folder change in the application
        .pause(500);

    return this;

};
