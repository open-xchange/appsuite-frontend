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

define('io.ox/office/view',
    ['io.ox/office/tk/toolbar',
     'gettext!io.ox/office/main'
    ], function (ToolBar, gt) {

    'use strict';

    // static class View ======================================================

    var View = {};

    // static methods ---------------------------------------------------------

    /**
     * Creates and returns a new instance of the main tool bar.
     */
    View.createMainToolBar = function () {
        return new ToolBar()
            .addButtonGroup()
                .addButton('action/undo', { icon: 'icon-io-ox-undo', tooltip: gt('Revert last operation') })
                .addButton('action/redo', { icon: 'icon-io-ox-redo', tooltip: gt('Restore last operation') })
            .end()
            .addButtonGroup()
                .addButton('character/font/bold',      { icon: 'icon-io-ox-bold',      tooltip: gt('Bold'),      toggle: true })
                .addButton('character/font/italic',    { icon: 'icon-io-ox-italic',    tooltip: gt('Italic'),    toggle: true })
                .addButton('character/font/underline', { icon: 'icon-io-ox-underline', tooltip: gt('Underline'), toggle: true })
            .end()
            .addRadioGroup('paragraph/alignment', { type: 'auto', columns: 2, tooltip: gt('Paragraph alignment') })
                .addButton('left',    { icon: 'icon-align-left',    tooltip: gt('Left') })
                .addButton('center',  { icon: 'icon-align-center',  tooltip: gt('Center') })
                .addButton('right',   { icon: 'icon-align-right',   tooltip: gt('Right') })
                .addButton('justify', { icon: 'icon-align-justify', tooltip: gt('Justify') })
            .end()
            .addSizeChooser('insert/table', {
                icon: 'icon-io-ox-table',
                tooltip: gt('Insert table'),
                split: true,
                caretTooltip: gt('Select table size'),
                maxSize: { width: 15, height: 15 },
                defaultValue: { width: 5, height: 3 }
            })
            .addButton('debug/toggle', { icon: 'icon-eye-open', tooltip: 'Debug mode', toggle: true });
    };

    // exports ================================================================

    return View;

});
