/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/wizards/firstStart/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (Stage, ext, settings) {

    'use strict';

    new Stage('io.ox/core/stages', {
        id: 'firstStartWizard',
        index: 550,
        run: function () {
            if (ox.manifests.pluginsFor('io.ox/wizards/firstStart').length === 0 ||
                settings.get('wizards/firstStart/finished', false)) {
                return $.when();
            }
            var def = $.Deferred(),
                topbar = $('#io-ox-topbar');

            topbar.hide();
            ox.idle();
            ox.manifests.loadPluginsFor('io.ox/wizards/firstStart')
                .then(function () {
                    return require(['io.ox/core/tk/wizard']);
                })
                .then(function (Tour) {
                    return Tour.registry.get('firstStartWizard').get('run')();
                })
                .done(function () {
                    settings.set('wizards/firstStart/finished', true).save();
                    topbar.show();
                    ox.busy();
                    def.resolve();
                })
                .fail(function () {
                    require('io.ox/core/main').logout();
                    def.reject();
                });

            return def;
        }
    });

    return {
    };
});
