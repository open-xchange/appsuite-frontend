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

define('io.ox/office/preview/app/fileactions', ['io.ox/office/preview/app/actionshelper'], function (ActionsHelper) {

    'use strict';

    var // the identifier of the 'View' action
        ACTION_ID = 'io.ox/files/actions/office/view';

    // global initialization ==================================================

    // create the action to view the file in OX Viewer
    ActionsHelper.createViewerAction(ACTION_ID, function (baton) {
        // directly return the data object created by OX Files as file descriptor
        return baton.data;
    });

    // create a link in the attachment drop-down menu
    ActionsHelper.createViewerLink('io.ox/files/links/inline', ACTION_ID, { prio: 'hi' });

    // disable default 'Open' action defined by OX Files
    ActionsHelper.disableActionForViewable('io.ox/files/actions/open');

    // exports ================================================================

    return;

});
