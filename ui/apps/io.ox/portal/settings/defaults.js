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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('io.ox/portal/settings/defaults', [], function () {

    'use strict';

    var settingsDefaults = {
        'pluginSettings': [
            {id: 'mail', active: true, index: 100},
            {id: 'twitter', active: true, index: 200},
            {id: 'linkedIn', active: true, index: 300},
            {id: 'facebook', active: true, index: 800},
            {id: 'tasks', active: true, index: 500},
            {id: 'appointments', active: true, index: 600},
            {id: 'flickr', active: true, index: 700},
            {id: 'tumblr', active: true, index: 400}
//            {id: 'rss', active: true, index: 700}
        ]
    };

    return settingsDefaults;
});
