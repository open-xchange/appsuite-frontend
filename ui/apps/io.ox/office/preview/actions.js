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

define('io.ox/office/preview/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (ext, links, Utils, gt) {

    'use strict';

    var POINT = 'io.ox/office/preview';

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

    // exports ================================================================

    return Actions;

});
