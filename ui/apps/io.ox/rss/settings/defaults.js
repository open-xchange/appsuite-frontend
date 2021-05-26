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

define('io.ox/rss/settings/defaults', function () {

    'use strict';

    var settingsDefaults = {
        /* groups: [
            {groupname: 'News RSS', index: 200, members: [
                {feedname: 'Heise', url: 'http://www.heise.de/newsticker/heise-atom.xml', index: 100 },
                {feedname: 'Gizmodo', url: 'http://www.gizmodo.de/feed', index: 200 }
            ]},
            ...more groups...
        ]*/
        needsMigration: true
    };

    return settingsDefaults;
});
