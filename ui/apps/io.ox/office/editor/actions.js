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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (ext, links, Utils, gt) {

    'use strict';

    var POINT = 'io.ox/office/editor';

    // static class Actions ===================================================

    var Actions = { MODULE_NAME: POINT };

    // extension points =======================================================

    // close application ------------------------------------------------------

    new links.Action(POINT + '/actions/close', {
        id: 'close',
        action: function (baton) {
            baton.app.quit();
        }
    });

    new links.ActionGroup(POINT + '/links/toolbar', {
        id: 'close',
        index: 100,
        icon: function () { return Utils.createIcon('icon-remove'); }
    });

    new links.ActionLink(POINT + '/links/toolbar/close', {
        id: 'close',
        index: 100,
        label: gt('Close'),
        ref: POINT + '/actions/close'
    });

    // download file ----------------------------------------------------------

    new links.Action(POINT + '/actions/download', {
        id: 'download',
        action: function (baton) {
            baton.app.download();
        }
    });

    new links.ActionGroup(POINT + '/links/toolbar', {
        id: 'download',
        index: 200,
        icon: function () { return Utils.createIcon('icon-download-alt'); }
    });

    new links.ActionLink(POINT + '/links/toolbar/download', {
        id: 'download',
        index: 100,
        label: gt('Download'),
        ref: POINT + '/actions/download'
    });

    // print document ---------------------------------------------------------

    new links.Action(POINT + '/actions/print', {
        id: 'print',
        action: function (baton) {
            baton.app.print();
        }
    });

    new links.ActionGroup(POINT + '/links/toolbar', {
        id: 'print',
        index: 300,
        icon: function () { return Utils.createIcon('icon-print'); }
    });

    new links.ActionLink(POINT + '/links/toolbar/print', {
        id: 'print',
        index: 100,
        label: gt('Print'),
        ref: POINT + '/actions/print'
    });

    // exports ================================================================

    return Actions;

});
