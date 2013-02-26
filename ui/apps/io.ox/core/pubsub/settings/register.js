/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/pubsub/settings/register',
       ['io.ox/core/extensions',
        'gettext!io.ox/core/pubsub'], function (ext, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'io.ox/core/pubsub',
        title: gt('Publications and Subscriptions'),
        ref: 'io.ox/core/pubsub'
    });
});
