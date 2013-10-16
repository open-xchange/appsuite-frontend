/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
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
     'gettext!io.ox/core/pubsub'
    ], function (ext, capabilities, gt) {

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
