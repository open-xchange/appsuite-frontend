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

    function isViewable(e) {
        return e.collection.has('one', 'read') && ExtensionRegistry.isViewable(e.context.filename);
    }

    new links.Action('io.ox/files/actions/office/view', {
        requires: isViewable,
        filter: function (data) {
            return ExtensionRegistry.isViewable(data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/preview/main', { action: 'load', file: baton.data });
        }
    });

    // disable default 'Open' action defined by OX Files
    new links.Action('io.ox/files/actions/open', {
        id: 'disable_open',
        index: 'first',
        requires: function (e) {
            if (isViewable(e)) {
                e.stopPropagation();
                return false;
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
