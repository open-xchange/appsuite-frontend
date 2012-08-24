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

define('plugins/portal/flickr/settings/defaults',
       [], function () {

    'use strict';

    var settingsDefaults = {
            streams: [
                {q: 'open-xchange', method: 'flickr.photos.search', description: 'Open-Xchange'}
            ]
        };

    return settingsDefaults;
});