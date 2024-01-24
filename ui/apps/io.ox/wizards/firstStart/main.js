/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/wizards/firstStart/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (Stage, ext, settings) {

    'use strict';

    new Stage('io.ox/core/stages', {
        id: 'firstStartWizard',
        index: 200,
        run: function (baton) {
            if (ox.manifests.pluginsFor('io.ox/wizards/firstStart').length === 0 ||
                settings.get('wizards/firstStart/finished', false)) {
                return $.when();
            }
            var def = $.Deferred(),
                topbar = $('#io-ox-topbar');

            baton.data.popups.push({ name: 'firstStartWizard' });
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
