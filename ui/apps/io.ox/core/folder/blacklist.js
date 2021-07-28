/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/folder/blacklist', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'settings!io.ox/files'
], function (ext, settings, fileSettings) {

    'use strict';

    var point = ext.point('io.ox/core/folder/filter'),
        hash = settings.get('folder/blacklist', {}),
        localBlacklist = {},
        ids = _(hash).keys().sort();

    if (ox.debug && ids.length > 0) console.info('Blacklisted folders:', ids);

    point.extend(
        {
            id: 'blacklist',
            index: 100,
            visible: function (baton) {
                var data = baton.data, id = String(data.id);
                // work with fresh hash (esp. for testing)
                hash = _.extend(settings.get('folder/blacklist', {}), localBlacklist);
                return !hash[id];
            }
        },
        {
            id: 'dot-folders',
            index: 200,
            visible: function (baton) {
                // not in drive app?
                if (baton.data.module !== 'infostore') return true;
                // filter not enabled?
                if (fileSettings.get('showHidden', false) === true) return true;
                // check that title doesn't start with a dot
                return !(/^\./.test(baton.data.title));
            }
        }
    );

    // utility function
    function reduce(memo, visible) {
        return memo && !!visible;
    }

    return {

        // direct access
        hash: hash,

        // returns true if a folder is visible
        // returns false if a folder is blacklisted
        filter: function (data) {
            var baton = ext.Baton({ data: data });
            return point
                .invoke('visible', null, baton)
                .reduce(reduce, true)
                .value();
        },

        // convenience
        visible: function (data) {
            return this.filter(data);
        },

        // filter array of folders
        apply: function (array) {
            return _(array).filter(this.filter, this);
        },

        add: function (id) {
            localBlacklist[id] = true;
        }
    };
});
