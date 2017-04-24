/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/core/windowManager', [
], function () {
    'use strict';

    if (ox.windowManager) return true;

    ox.windowManager = {
        collection: new Backbone.Collection(),
        openAppInWindow: function (options) {
            options = options || {};
            options.appName = options.appName || 'app';
            var id = _.uniqueId(options.appName + '_'),
                model = this.collection.add({
                    appName: options.appName,
                    id: id,
                    window: window.open(ox.base + '/minimalset.html', id, options.windowAttributes)
                });
            // remove model from collection on window close
            model.get('window').onunload = function () {
                // firefox fix , there is one unload before the window is fully opened on firefox (firefox always loads blank page first then switches the location. this triggers a too early unload event)
                if (this.location.href !== 'about:blank') {
                    ox.windowManager.collection.remove(model);
                }
            };
            return model;
        }
    };

    ox.windowManager.main = ox.windowManager.collection.add({
        appName: 'main',
        id: 'main',
        window: window
    });

    ox.windowManager.main.on('message', function (message) {
        console.log(message);
    });

    ox.windowManager.collection.on('add', function (newModel) {
        console.log('new window opened', newModel.id);
    });
    ox.windowManager.collection.on('remove', function (newModel) {
        console.log('window closed', newModel.id);
    });

    return true;
});
