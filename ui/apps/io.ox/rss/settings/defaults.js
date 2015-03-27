/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
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
