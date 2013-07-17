/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/preview/app/fileactions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/framework/app/extensionregistry',
     'gettext!io.ox/office/main'
    ], function (ext, links, ExtensionRegistry, gt) {

    'use strict';

    new links.Action('io.ox/files/actions/office/view', {
        requires: function (e) {
            return e.collection.has('one', 'read') && ExtensionRegistry.isViewable(e.context.filename);
        },
        filter: function (data) {
            return ExtensionRegistry.isViewable(data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/preview/main', { action: 'load', file: baton.data });
        }
    });

    ext.point('io.ox/files/links/inline').extend({
        id: 'disable_open',
        index: 1,
        prio: 'hi',
        ref: 'io.ox/files/actions/open',
        draw: function (baton) {
            if (!_.isArray(baton.data) && ExtensionRegistry.isViewable(baton.data.filename)) {
                baton.disable('io.ox/files/links/inline', 'open');
            }
        }
    });

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'view',
        index: 100,
        prio: 'hi',
        label: gt('View'),
        ref: 'io.ox/files/actions/office/view'
    }));

});
