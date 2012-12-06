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
        ActionLink = links.ActionLink;

    /**
     * Returns whether the passed file name is a text file supported by the OX
     * Text application.
     */
    var isSupportedTextFile = (function () {

        var // all extensions of supported text files
            FILE_EXTENSIONS = ['docx', 'docm'].concat(OfficeConfig.isODFSupported() ? ['odt'] : []),

            // regular expression pattern matching supported text files
            FILE_PATTERN = new RegExp('\\.(' + FILE_EXTENSIONS.join('|') + ')$', 'i');

        return function (fileName) {
            return _.isString(fileName) && FILE_PATTERN.test(fileName);
        };
    }());

    new Action('io.ox/files/actions/office/newdocument', {
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'new', folder_id: baton.app.folder.get() });
        }
    });

    new Action('io.ox/files/actions/office/editor', {
        requires: function (e) {
            return e.collection.has('one') && isSupportedTextFile(e.context.data.filename);
        },
        filter: function (obj) {
            return isSupportedTextFile(obj.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'load', file: baton.data });
        }
    });

    new Action('io.ox/files/actions/office/editasnew', {
        requires: function (e) {
            return e.collection.has('one') && isSupportedTextFile(e.context.data.filename);
        },
        filter: function (obj) {
            return isSupportedTextFile(obj.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { action: 'new', folder_id: baton.data.folder_id, template: baton.data });
        }
    });

    // groups
    new ActionLink('io.ox/files/links/toolbar/default', {
        index: 200,
        id: "officenew",
        label: gt("New office document"),
        ref: "io.ox/files/actions/office/newdocument"
    });

    // INLINE

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officeeditor",
        index: 110,
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
