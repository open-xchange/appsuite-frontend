/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/conversations/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links'
    ], function (ext, links) {

    'use strict';

    // actions

    ext.point('io.ox/conversations/actions/create').extend({
        index: 100,
        id: 'create',
        action: function () {
            require(['io.ox/conversations/api'], function (api) {
                api.create('');
            });
        }
    });

    // links

    ext.point('io.ox/conversations/links/toolbar').extend(new links.Button({
        index: 100,
        id: 'create',
        label: 'Start new conversation',
        cssClasses: 'btn btn-primary',
        ref: 'io.ox/conversations/actions/create'
    }));

});
