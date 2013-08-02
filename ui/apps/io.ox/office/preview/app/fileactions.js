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
     'io.ox/office/preview/app/actionshelper',
     'gettext!io.ox/office/main'
    ], function (ext, links, ActionsHelper, gt) {

    'use strict';

    ActionsHelper.createViewerAction('io.ox/files/actions/office/view', function (baton) {
        // directly return the data object created by OX Files as file descriptor
        return baton.data;
    });

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'office_view',
        index: 100,
        prio: 'hi',
        label: gt('View'),
        ref: 'io.ox/files/actions/office/view'
    }));

    // disable default 'Open' action defined by OX Files
    ActionsHelper.disableActionForViewable('io.ox/files/actions/open');

});
