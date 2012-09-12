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
            {groupname: 'Default feeds', index: 100, members: [
                {feedname: 'mail', url: 'http://usaerklaert.wordpress.com/feed', index: 100},
                ...more members...
            ]},
            ...more groups...
        ]*/
        needsMigration: true
    };

    return settingsDefaults;
});
