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
        'io.ox/office/portal/text', 'io.ox/office/portal/spreadsheet', 'io.ox/office/portal/presentation',
        'io.ox/notes'
    ];

    function createIndexMap() {
        var list = settings.get('apps/list', defaultList.join(',')).split(','),
            blacklist = settings.get('apps/blacklist', '').split(',');
        return list.reduce(function (acc, id, index) {
            acc[id] = _(blacklist).contains(id) ? -1 : index;
            return acc;
        }, {});
    }

    var AppsCollection = Backbone.Collection.extend({
        initialize: function () {
            this._indexMap = createIndexMap();
        },
        forLauncher: function getAppsForLauncher() {
            return this.filter(function (a) {
                return this._indexOf(a) >= 0;
            }.bind(this));
        },
        _indexOf: function indexOf(app) {
            var index = this._indexMap[app.id];
            return typeof index === 'number' ? index : -1;
        },
        comparator: function (a, b) {
            return this._indexOf(a) - this._indexOf(b);
        }
    });

    ox.ui.apps = new AppsCollection();

    return ox.ui.apps;
});
