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
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/fonts',
     'io.ox/office/tk/toolbar',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/control/combofield',
     'io.ox/office/tk/dropdown/gridsizer',
     'io.ox/office/editor/editor',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, ToolBar, Button, TextField, ComboField, GridSizer, Editor, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class FontFamilyChooser ================================================

    var FontFamilyChooser = ComboField.extend({ constructor: function () {

        var options = {
                width: 150,
                icon: 'icon-font',
                tooltip: gt('Font Name'),
                sorted: true,
                typeAhead: true
            };

        // base constructor ---------------------------------------------------

        ComboField.call(this, options);

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getRegisteredFontNames()).each(function (fontName) {
            this.addListEntry(fontName, { labelCss: { fontFamily: Fonts.getCssFontFamily(fontName), fontSize: '115%' } });
        }, this);

    }}); // class FontFamilyChooser

    // class FontHeightChooser ================================================

    var FontHeightChooser = ComboField.extend({ constructor: function () {

        var options = {
                width: 30,
                icon: 'icon-io-ox-font-height',
                tooltip: gt('Font Size'),
                css: { textAlign: 'right' },
                validator: new TextField.IntegerValidator({ min: 1, max: 999 })
            };

        // base constructor ---------------------------------------------------

        ComboField.call(this, options);

        // initialization -----------------------------------------------------

        _([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]).each(function (size) {
            this.addListEntry(size);
        }, this);

    }}); // class FontHeightChooser

    // class TableSizeChooser =================================================

    var TableSizeChooser = Button.extend({ constructor: function () {

        var options = {
                icon: 'icon-io-ox-table',
                tooltip: gt('Insert Table'),
                defaultSize: { width: 5, height: 3 },
                maxSize: { width: 15, height: 15 }
            };

        // base constructor ---------------------------------------------------

        // create the default button (set value to default size, will be returned by click handler)
        Button.call(this, Utils.extendOptions(options, { value: options.defaultSize }));
        // create the grid sizer
        GridSizer.extend(this, Utils.extendOptions(options, { icon: undefined, label: undefined }));

    }}); // class TableSizeChooser

    // class View =============================================================

    function View(win, controller, editors) {

        var // the top-level tab bar to select tool bars
            tabBar = new ToolBar(win),

            // the tab buttons to select the tool bars
            radioGroup = tabBar.addRadioGroup('view/toolbars/show', { type: 'list', autoExpand: true }),

            // all registered tool bars, mapped by tool bar key
            toolBars = {},

            // key of the tool bar currently visible
            visibleToolBar = '';

        // private methods ----------------------------------------------------

        /**
         * Creates a new tool bar object and registers it at the tab bar.
         *
         * @param {String} key
         *  The unique key of the tool bar. Will be used as value in the
         *  'view/toolbars/show' controller events.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new tab in the
         *  tab bar representing the tool bar. Supports all options for buttons
         *  in radio groups (see method RadioGroup.addButton() for details).
         */
        function createToolBar(key, options) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[key] = new ToolBar(win);

            // create common controls present in all tool bars
            toolBar
                .startCollapseGroups()
                .addButton('action/undo', { icon: 'icon-io-ox-undo', tooltip: gt('Revert Last Operation') })
                .addButton('action/redo', { icon: 'icon-io-ox-redo', tooltip: gt('Restore Last Operation') })
                .endCollapseGroups();

            // add a tool bar tab, add the tool bar to the pane, and register it at the controller
            radioGroup.addButton(key, options);
            win.nodes.toolPane.append(toolBar.getNode().hide());
            controller.registerViewComponent(toolBar);

            return toolBar;
        }

        /**
         * Returns the key of the tool bar currently visible.
         */
        function getVisibleToolBarKey() {
            return visibleToolBar;
        }

        /**
         * Activates the tool bar with the specified key.
         */
        function showToolBar(key) {
            if (visibleToolBar in toolBars) {
            }
            if (key in toolBars) {
                visibleToolBar = key;
                win.nodes.toolPane.children().slice(1).hide();
                toolBars[key].getNode().show();
            }
        }

        /**
         * Handles keyboard events in the quick-search text field.
         */
        function searchKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.ENTER:
                if (keyup) { controller.change('action/search', $(this).val()); }
                return false;
            case KeyCodes.ESCAPE:
                if (keyup) { $(this).val(''); controller.cancel(); }
                return false;
            }
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            _(toolBars).invoke('destroy');
            tabBar.destroy();
            tabBar = radioGroup = toolBars = null;
        };

        // initialization -----------------------------------------------------

        // create the tool panes and append them to the window main node
        win.nodes.main.addClass('io-ox-office-main').append(
            win.nodes.toolPane = $('<div>').addClass('io-ox-toolpane top'),
            win.nodes.appPane = $('<div>').addClass('io-ox-office-apppane'),
            win.nodes.debugPane = $('<div>').addClass('io-ox-toolpane bottom')
        );

        // insert editor into the app pane
        win.nodes.appPane.append(editors[Editor.TextMode.RICH].getNode());

        // table element containing the debug mode elements
        win.nodes.debugPane.append($('<table>').addClass('debug-table').append(
            $('<colgroup>').append(
                $('<col>', { width: '50%' }),
                $('<col>', { width: '50%' })
            ),
            $('<tr>').append(
                // add plain-text editor and operations output console to debug table
                $('<td>').append(editors[Editor.TextMode.PLAIN].getNode()),
                $('<td>').append(editors.output.getNode())
            )
        ));


        // insert the tool bar selector and a separator line into the tool pane
        tabBar.getNode().addClass('tabs').children().first().append(
            $('<span>').addClass('separator left'),
            $('<span>').addClass('separator right')
        );
        win.nodes.toolPane.append(tabBar.getNode());

        // create the tool bars
        createToolBar('insert', { label: gt('Insert') })
            .addGroup('insert/table', new TableSizeChooser());

        createToolBar('format', { label: gt('Format') })
            .addGroup('format/character/font/family', new FontFamilyChooser())
            .addGroup('format/character/font/height', new FontHeightChooser())
            .startCollapseGroups()
            .addButton('format/character/font/bold',      { icon: 'icon-io-ox-bold',      tooltip: gt('Bold'),      toggle: true })
            .addButton('format/character/font/italic',    { icon: 'icon-io-ox-italic',    tooltip: gt('Italic'),    toggle: true })
            .addButton('format/character/font/underline', { icon: 'icon-io-ox-underline', tooltip: gt('Underline'), toggle: true })
            .endCollapseGroups()
            .addRadioGroup('format/paragraph/alignment', { type: 'dropdown', columns: 2, autoExpand: true, icon: 'icon-align-left', tooltip: gt('Paragraph Alignment') })
                .addButton('left',    { icon: 'icon-align-left',    tooltip: gt('Left') })
                .addButton('center',  { icon: 'icon-align-center',  tooltip: gt('Center') })
                .addButton('right',   { icon: 'icon-align-right',   tooltip: gt('Right') })
                .addButton('justify', { icon: 'icon-align-justify', tooltip: gt('Justify') })
                .end();

        createToolBar('table', { label: gt('Table') })
            .addGroup('insert/table', new TableSizeChooser())
            .startCollapseGroups()
            .addButton('table/insert/row', { label: gt('Insert Row'), tooltip: gt('Insert Row') })
            .addButton('table/insert/column', { label: gt('Insert Column'), tooltip: gt('Insert Column') })
            .addButton('table/delete/row', { label: gt('Delete Row'), tooltip: gt('Delete Row') })
            .addButton('table/delete/column', { label: gt('Delete Column'), tooltip: gt('Delete Column') })
            .endCollapseGroups();

        createToolBar('debug', { label: gt('Debug') })
            .addButton('debug/toggle', { icon: 'icon-eye-open', tooltip: 'Debug Mode', toggle: true });

        // prepare controller
        controller
            // create a controller item for tool bar handling
            .addDefinitions({ 'view/toolbars/show': { get: getVisibleToolBarKey, set: showToolBar } })
            // register the tab bar at the controller
            .registerViewComponent(tabBar)
            // make the format tool bar visible
            .change('view/toolbars/show', 'format');

        // override the limited functionality of the quick-search button
        win.nodes.search.off('keydown search change').on('keydown keypress keyup', searchKeyHandler);

    } // class View

    // exports ================================================================

    return View;

});
