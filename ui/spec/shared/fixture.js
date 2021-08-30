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

/* eslint requirejs/no-object-define: 0 */
define('fixture', {
    load: function (name, parentRequire, load) {
        if (name.substr(-5, 5) === '.json') {
            return $.getJSON('/base/spec/fixtures/' + name).then(
                load,
                function fail() {
                    // this simple line might save life time
                    console.log('Cannot load/parse fixture', name, arguments);
                    load.error.apply(load, arguments);
                }
            );
        }
        if (name.substr(-4, 4) === '.txt') {
            return $.get('/base/spec/fixtures/' + name).then(load, load.error);
        }
        return require(['/base/spec/fixtures/' + name], load, load.error);
    }
});
