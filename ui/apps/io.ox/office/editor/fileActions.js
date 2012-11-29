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

define('io.ox/office/editor/fileActions',
    ['io.ox/files/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/config',
     'gettext!io.ox/files',
     'settings!io.ox/files'], function (api, ext, links, OfficeConfig, gt, settings) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,

        POINT = 'io.ox/files';

    new Action('io.ox/files/actions/office/newdocument', {
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'new', folder_id: baton.app.folder.get() });
        }
    });
/*
    // editor
    new Action('io.ox/files/actions/editor', {
        requires: function (e) {
            var pattern = OfficeConfig.isODFSupported() ? /\.(odt|docx)$/i : /\.(docx)$/i;
            return e.collection.has('one') && pattern.test(e.context.data.filename);
        },
        filter: function (e) {
            var pattern = OfficeConfig.isODFSupported() ? /\.(odt|docx)$/i : /\.(docx)$/i;
            return e.collection.has('one') && pattern.test(e.context.data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'load', file: baton.data });
        }
    });
*/

    new Action('io.ox/files/actions/office/editor', {
        requires: function (e) {
            var pattern = OfficeConfig.isODFSupported() ? /\.(odt|docx)$/i : /\.(docx)$/i;
            return e.collection.has('one') && pattern.test(e.context.data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'load', file: baton.data });
        }
    });

    new Action('io.ox/files/actions/office/editasnew', {
        requires: function (e) {
            var pattern = OfficeConfig.isODFSupported() ? /\.(odt|docx)$/i : /\.(docx)$/i;
            return e.collection.has('one') && pattern.test(e.context.data.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'new', folder_id: baton.data.folder_id, template: baton.data });
        }
    });

    // groups
    new ActionLink(POINT + '/links/toolbar/default', {
        index: 200,
        id: "officenew",
        label: gt("New office document"),
        ref: "io.ox/files/actions/office/newdocument"
    });

    // INLINE

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officeeditor",
        index: 60,
        prio: 'hi',
        label: gt("Edit"),
        ref: "io.ox/files/actions/office/editor"
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officeeditasnew",
        index: 700,
        label: gt("Edit as new"),
        ref: "io.ox/files/actions/office/editasnew"
    }));
});
