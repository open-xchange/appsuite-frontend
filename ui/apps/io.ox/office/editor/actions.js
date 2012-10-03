/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/config',
     'gettext!io.ox/office/main'
    ], function (ext, links, Config, gt) {

    'use strict';

    var // shortcuts for classes
        Action = links.Action,
        ButtonGroup = links.ButtonGroup,
        Button = links.Button,

        // debug mode
        debug = Config.isDebugAvailable();

    // global functions =======================================================

    /**
     * Creates a links.Action object that triggers a specific controller action
     * item of the editor application.
     *
     * @param {String} key
     *  The unique key of the controller item that will be triggered by this
     *  action.
     *
     * @param {String} [value]
     *  The string value passed to the controller item.
     */
    function registerControllerAction(key, value) {

        var // the unique identifier of the action, containing key and value
            id = 'io.ox/office/editor/actions/' + key + (_.isString(value) ? ('/' + value) : '');

        new Action(id, {
            requires: true,
            action: function (app) {
                app.getController().change(key, value);
            }
        });
    }

    // registration ===========================================================

    new ButtonGroup('io.ox/office/editor/links/toolbar', {
        id: 'file',
        index: 100,
        label: gt('File')
    });

    registerControllerAction('file/download');
    ext.point('io.ox/office/editor/links/toolbar/file').extend(new Button({
        index: 100,
        id: 'download',
        label: gt('Download'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/file/download'
    }));

    registerControllerAction('file/print');
    ext.point('io.ox/office/editor/links/toolbar/file').extend(new Button({
        index: 200,
        id: 'print',
        label: gt('Print'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/file/print'
    }));

    // show tool bar radio group ----------------------------------------------

    new ButtonGroup('io.ox/office/editor/links/toolbar', {
        id: 'show',
        index: 200,
        radio: true,
        label: gt('Show Tool Bar')
    });

    registerControllerAction('view/toolbars/show', 'insert');
    ext.point('io.ox/office/editor/links/toolbar/show').extend(new Button({
        index: 100,
        id: 'insert',
        label: gt('Insert'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/view/toolbars/show/insert'
    }));

    registerControllerAction('view/toolbars/show', 'format');
    ext.point('io.ox/office/editor/links/toolbar/show').extend(new Button({
        index: 200,
        id: 'format',
        label: gt('Format'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/view/toolbars/show/format'
    }));

    registerControllerAction('view/toolbars/show', 'table');
    ext.point('io.ox/office/editor/links/toolbar/show').extend(new Button({
        index: 300,
        id: 'table',
        label: gt('Table'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/view/toolbars/show/table'
    }));

    registerControllerAction('view/toolbars/show', 'image');
    ext.point('io.ox/office/editor/links/toolbar/show').extend(new Button({
        index: 400,
        id: 'image',
        label: gt('Image'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/editor/actions/view/toolbars/show/image'
    }));

    if (debug) {
        registerControllerAction('view/toolbars/show', 'debug');
        ext.point('io.ox/office/editor/links/toolbar/show').extend(new Button({
            index: 9999,
            id: 'debug',
            label: gt('Debug'),
            cssClasses: 'btn btn-inverse',
            ref: 'io.ox/office/editor/actions/view/toolbars/show/debug'
        }));
    }

});
