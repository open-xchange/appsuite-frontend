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

define('io.ox/core/main/registry', [
    'settings!io.ox/core'
], function (settings) {
    (function () {

        var hash = {
            'mail-compose': 'io.ox/mail/compose/main',
            // used by savepoints
            'io.ox/mail/compose': 'io.ox/mail/compose/main',
            'io.ox/calendar/edit': 'io.ox/calendar/edit/main',
            'io.ox/calendar/freetime': 'io.ox/calendar/freetime/main',
            'io.ox/contacts/distrib': 'io.ox/contacts/distrib/main',
            'io.ox/contacts/edit': 'io.ox/contacts/edit/main',
            'io.ox/editor': 'io.ox/editor/main',
            'io.ox/tasks/edit': 'io.ox/tasks/edit/main'
        };

        var custom = {};

        ox.registry = {
            set: function (id, path) {
                custom[id] = path;
            },
            get: function (id) {
                return custom[id] || settings.get('registry/' + id) || hash[id];
            },
            call: function (id, name) {
                var dep = this.get(id),
                    args = _(arguments).toArray().slice(2);
                return ox.load([dep]).then(function (m) {
                    // non-apps
                    if (m.run && _.isFunction(m.run)) return m.run.apply(m, args);
                    if (!m.reuse || !m.getApp) return;
                    // app
                    if (m.reuse(name, args[0])) return;
                    return m.getApp().launch().then(function () {
                        return this[name].apply(this, args);
                    });
                });
            }
        };

    }());

});
