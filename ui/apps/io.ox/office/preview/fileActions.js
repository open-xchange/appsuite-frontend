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

define('io.ox/office/preview/fileActions',
    ['io.ox/files/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/files',
     'settings!io.ox/files'], function (api, ext, links, gt, settings) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,

        POINT = 'io.ox/files';

    new Action('io.ox/files/actions/office/view', {
        requires: function (e) {
            return e.collection.has('one') && /\.(doc|docx|odt|xls|xlsx|ods|ppt|pptx|odp|odg)$/i.test(e.context.data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/preview/main', { action: 'load', file: baton.data });
        }
    });

    // INLINE

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officepreview",
        index: 65,
        prio: 'hi',
        label: gt("View"),
        ref: "io.ox/files/actions/office/view"
    }));
});
