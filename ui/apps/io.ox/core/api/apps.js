/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/api/apps', [
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (ext, manifests, capabilities, settings) {

    'use strict';

    var defaultList = [
        'io.ox/mail', 'io.ox/calendar', 'io.ox/contacts',
        'io.ox/files', 'io.ox/portal', 'io.ox/tasks',
        'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation'
    ];

    // move app to defaultList, once it is out of prototype state
    if (ox.debug) defaultList.push('io.ox/notes');

    if (_.device('smartphone')) defaultList.push('io.ox/search');
    if (!_.device('smartphone')) defaultList.push('io.ox/chat');

    function validApp(app) { return app && !this.blacklist[app.id]; }

    var AppID = Backbone.Model.extend({
        constructor: function AppID(id, options) {
            Backbone.Model.call(this, { id: id }, options);
        }
    });

    var LauncherCollection = Backbone.Collection.extend({ model: AppID });

    var AppsCollection = Backbone.Collection.extend({
        initialize: function () {
            this.blacklist = _.reduce(
                settings.get('apps/blacklist', '').split(','),
                function (memo, id) { memo[id] = true; return memo; },
                {});
            this.launcher = new LauncherCollection(defaultList);
            if (settings.contains('apps/list')) {
                var list = settings.get('apps/list').split(',');
                if (_.device('smartphone') && !_(list).contains('io.ox/search')) list.push('io.ox/search');
                if (!_.device('smartphone') && !_(list).contains('io.ox/chat')) list.push('io.ox/chat');
                this._launcher = new LauncherCollection(list);
            } else {
                this._launcher = this.launcher;
            }
            this._launcher.on('all', function () {
                var args = Array.prototype.slice.call(arguments);
                args[0] = 'launcher:' + args[0];
                this.trigger.apply(this, args);
            }, this);
        },
        getByCID: function (cid) {
            return _.findWhere(this.models, { cid: cid });
        },
        forLauncher: function getAppsForLauncher() {
            return _.filter(this._launcher.map(this.get.bind(this)), validApp, this);
        }
    });

    ox.ui.apps = new AppsCollection();

    return ox.ui.apps;
});
