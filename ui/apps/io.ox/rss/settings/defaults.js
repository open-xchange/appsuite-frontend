/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('io.ox/rss/settings/defaults', [], function () {

    'use strict';

    var settingsDefaults = {
/*        groups: [
            {groupname: 'News RSS', index: 200, members: [
                {feedname: 'Heise', url: 'http://www.heise.de/newsticker/heise-atom.xml', index: 100},
                {feedname: 'Gizmodo', url: 'http://www.gizmodo.de/feed', index: 200}
            ]},
            ...more groups...
        ]*/
        needsMigration: true
    };

    return settingsDefaults;
});
