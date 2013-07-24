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
        'io.ox/core/capabilities',
        'gettext!io.ox/core/pubsub'], function (ext, capabilities, gt) {

    'use strict';

    var point = ext.point('io.ox/settings/pane'), id = 'io.ox/core/pubsub';

    point.extend({
        id: id,
        title: gt('Publications and Subscriptions'),
        ref: 'io.ox/core/pubsub'
    });

    if (!capabilities.has('publication') & !capabilities.has('subscription'))
        point.disable(id);
    else if (!capabilities.has('publication'))
        point.replace({
            id: id,
            title: gt('Subscriptions')
        });
    else if (!capabilities.has('subscription'))
        point.replace({
            id: id,
            title: gt('Publications')
        });
});
