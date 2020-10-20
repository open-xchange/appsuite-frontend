/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/apps', [
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (ext, manifests, capabilities, settings) {

    'use strict';
    var defaultList = ['io.ox/mail', 'io.ox/calendar', 'io.ox/contacts',
        'io.ox/files', 'io.ox/portal', 'io.ox/tasks',
        'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation'
    ];

    // move app to defaultList, once it is out of prototype state
    if (ox.debug) defaultList.push('io.ox/notes');

    if (_.device('smartphone')) defaultList.push('io.ox/search');

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
