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

define('io.ox/office/editor/view',
    ['io.ox/office/apphelper',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/toolbar',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/fontchooser',
     'io.ox/office/tk/dropdown/gridsizer',
     'gettext!io.ox/office/main'
    ], function (AppHelper, Utils, ToolBar, Button, FontChooser, GridSizer, gt) {

    'use strict';

    // class TableSizeChooser =================================================

    var TableSizeChooser = Button.extend({ constructor: function (buttonOptions, sizerOptions) {

        var finalSizerOptions = AppHelper.extendOptions({
                tooltip: gt('Select table size'),
                defaultSize: { width: 5, height: 3 },
                maxSize: { width: 15, height: 15 }
            }, sizerOptions);

        // base constructor ---------------------------------------------------

        // create the default button (set value to default size, will be returned by click handler)
        Button.call(this, AppHelper.extendOptions(buttonOptions, { value: finalSizerOptions.defaultSize }));
        // create the grid sizer
        GridSizer.extend(this, finalSizerOptions);

    }});

    // class View =============================================================

    function View(controller) {

        var // the top-level tool pane container
            toolPane = $('<div>').addClass('io-ox-toolpane top'),

            // the top-level tab bar to select tool bars
            tabBar = new ToolBar(),

            // the tab buttons to select the tool bars
            radioGroup = tabBar.addRadioGroup('view/toolbars/show', { type: 'list', autoExpand: true }),

            // all registered tool bars, mapped by tool bar key
            toolBars = {},

            // bottom tool pane for debug output
            debugPane = $('<div>').addClass('io-ox-toolpane bottom'),

            // table element containing the debug mode elements
            debugTable = $('<table>').addClass('debug-table').appendTo(debugPane),

            // options for the 'insert table' control
            insertTableOptions = { icon: 'icon-io-ox-table', tooltip: gt('Insert table') };

        // private methods ----------------------------------------------------

        function createToolBar(key, label) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[key] = new ToolBar();

            // create common controls present in all tool bars
            toolBar
                .addButton('action/undo', { icon: 'icon-io-ox-undo', tooltip: gt('Revert last operation') })
                .addButton('action/redo', { icon: 'icon-io-ox-redo', tooltip: gt('Restore last operation') });

            // add a tool bar tab, add the tool bar to the pane, and register it at the controller
            radioGroup.addButton(key, { label: label });
            toolPane.append(toolBar.getNode().hide());
            controller.registerViewComponent(toolBar);

            return toolBar;
        }

        function showToolBar(key) {
            if (key in toolBars) {
                toolPane.children().slice(1).hide();
                toolBars[key].getNode().show();
            }
        }

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
            _(toolBars).invoke('destroy');
            tabBar.destroy();
            toolPane = tabBar = radioGroup = toolBars = debugPane = debugTable = null;
        };

        // initialization -----------------------------------------------------

        // insert the tool bar selector and a separator line into the tool pane
        tabBar.getNode().addClass('tabs').children().first().append(
            $('<span>').addClass('separator left'),
            $('<span>').addClass('separator right')
        );
        toolPane.append(tabBar.getNode());

        // create the tool bars
        createToolBar('insert', gt('Insert'))
            .addGroup('insert/table', new TableSizeChooser(insertTableOptions));

        createToolBar('format', gt('Format'))
            .addGroup('format/character/font/family', new FontChooser())
            .addButton('format/character/font/bold',      { icon: 'icon-io-ox-bold',      tooltip: gt('Bold'),      toggle: true })
            .addButton('format/character/font/italic',    { icon: 'icon-io-ox-italic',    tooltip: gt('Italic'),    toggle: true })
            .addButton('format/character/font/underline', { icon: 'icon-io-ox-underline', tooltip: gt('Underline'), toggle: true })
            .addRadioGroup('format/paragraph/alignment', { type: 'dropdown', columns: 2, autoExpand: true, icon: 'icon-align-left', tooltip: gt('Paragraph alignment') })
                .addButton('left',    { icon: 'icon-align-left',    tooltip: gt('Left') })
                .addButton('center',  { icon: 'icon-align-center',  tooltip: gt('Center') })
                .addButton('right',   { icon: 'icon-align-right',   tooltip: gt('Right') })
                .addButton('justify', { icon: 'icon-align-justify', tooltip: gt('Justify') })
            .end();

        createToolBar('table', gt('Table'))
            .addGroup('insert/table', new TableSizeChooser(insertTableOptions));

        createToolBar('debug', gt('Debug'))
            .addButton('debug/toggle', { icon: 'icon-eye-open', tooltip: 'Debug mode', toggle: true });

        // prepare controller
        controller
            // create a controller item for tool bar handling
            .addDefinitions({ 'view/toolbars/show': { set: showToolBar } })
            // register the tab bar at the controller
            .registerViewComponent(tabBar)
            // make the format tool bar visible
            .change('view/toolbars/show', 'format');

        // build debug table for plain-text editor and operations output console
        debugTable.append($('<colgroup>').append(
            $('<col>', { width: '50%' }),
            $('<col>', { width: '50%' })
        ));

    } // class View

    // exports ================================================================

    return View;

});
