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

    // class View =============================================================

    function View() {

        var // the tool bar selector
            toolBarTabs = $('<div>'),

            // the main tool bar
            mainToolBar = new ToolBar(),

            // the top-level tool pane container
            toolPane = $('<div>').addClass('io-ox-pane top').append(/*toolBarTabs, */mainToolBar.getNode()),

            // table element containing the debug mode elements
            debugTable = $('<table>').addClass('debug-table'),

            // bottom pane for debug output
            debugPane = $('<div>').addClass('io-ox-pane bottom').append(debugTable);

        // methods ------------------------------------------------------------

        /**
         * Returns the tool pane on top of the editor window, containing the
         * tool bars and the tool bar selector.
         *
         * @returns {jQuery}
         */
        this.getToolPane = function () {
            return toolPane;
        };

        /**
         * Returns the main tool bar.
         *
         * @returns {ToolBar}
         */
        this.getMainToolBar = function () {
            return mainToolBar;
        };

        /**
         * Returns the debug pane below the editor window, containing the plain
         * text editor and the operations output console.
         *
         * @returns {jQuery}
         */
        this.getDebugPane = function () {
            return debugPane;
        };

        /**
         * Returns the table element contained in the debug pane.
         *
         * @returns {jQuery}
         */
        this.getDebugTable = function () {
            return debugTable;
        };

        this.destroy = function () {
            mainToolBar.destroy();
            mainToolBar = toolPane = null;
        };

        // initialization -----------------------------------------------------

        toolBarTabs.css('text-align', 'center').append(
            $('<a>', { href: '#' }).text('Insert'),
            $('<a>', { href: '#' }).text('Format'),
            $('<a>', { href: '#' }).text('Table')
        );

        mainToolBar
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

        // build debug table for plain-text editor and operations output console
        debugTable.append($('<colgroup>').append(
            $('<col>', { width: '50%' }),
            $('<col>', { width: '50%' })
        ));

    } // class View

    // exports ================================================================

    return View;

});
