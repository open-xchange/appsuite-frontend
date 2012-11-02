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

define('io.ox/office/editor/view/view',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/config',
     'io.ox/office/tk/fonts',
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/control/radiogroup',
     'io.ox/office/tk/component/toolpane',
     'io.ox/office/tk/component/appwindowtoolbar',
     'io.ox/office/editor/view/controls',
     'io.ox/office/editor/format/lineheight',
     'gettext!io.ox/office/main'
    ], function (Utils, Config, Fonts, TextField, RadioGroup, ToolPane, AppWindowToolBar, Controls, LineHeight, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class View =============================================================

    function View(appWindow, controller, editor) {

        var // all nodes of the application window
            nodes = appWindow.nodes,

            // tool pane containing all tool bars
            toolPane = new ToolPane(appWindow, controller),

            // old value of the search query field
            oldSearchQuery = '',

            // output element for operations log
            opsNode = null,

            // output element for other debug information
            infoNode = null;

        // private methods ----------------------------------------------------

        /**
         * Creates a new tool bar in the tool pane and inserts common controls.
         *
         * @param {String} id
         *  The unique identifier of the tool bar.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new tab in the
         *  tab bar representing the tool bar. Supports all options for buttons
         *  in radio groups (see method RadioGroup.addOptionButton() for
         *  details).
         */
        function createToolBar(id, options) {
            // create common controls present in all tool bars
            return toolPane.createToolBar(id, options)
                .addButton('document/undo', { icon: 'icon-io-ox-undo', tooltip: gt('Revert Last Operation') })
                .addButton('document/redo', { icon: 'icon-io-ox-redo', tooltip: gt('Restore Last Operation') })
                .addSeparator();
        }

        /**
         * Handles resize events of the browser window, and adjusts the left
         * positions of all tool bars in the tool pane according to the current
         * position of the editor node.
         */
        function windowResizeHandler(event) {

            var // the left position of the editor node
                editorLeft = Math.floor(editor.getNode().offset().left);

            // set a left padding to the tool pane to align the tool bars with the editor node
            toolPane.getNode().css('padding-left', Math.max(editorLeft, 13) + 'px');
        }

        /**
         * Handles keyboard events in the quick-search text field.
         */
        function searchKeyHandler(event) {

            var // the quick-search text field
                searchField = $(this),
                // ESCAPE key returns to editor
                escape = (event.type === 'keyup') && (event.keyCode === KeyCodes.ESCAPE),
                // current value of the search query
                searchQuery = null,
                // any matches found in document
                matches = false;

            // ESCAPE key clears the quick-search text field
            if (escape) { searchField.val(''); }

            // always refresh search results if edit fields receives focus
            searchQuery = searchField.val();
            if ((event.type === 'focus') || (oldSearchQuery !== searchQuery)) {
                controller.change('document/quicksearch', searchQuery);
                oldSearchQuery = searchQuery;
                matches = !searchQuery.length || controller.get('document/quicksearch');
                searchField.css('background-color', matches ? '' : '#ffcfcf');
            }

            // ESCAPE key returns to editor
            if (escape) { controller.cancel(); }
        }

        /**
         * Shows a modal dialog to get the new filename
         */
        function renameDocumentHandler() {

            var filename = controller.get('file/rename') || gt('Unnamed'),
                extensionPos = filename.lastIndexOf('.'),
                displayName = (extensionPos !== -1 && extensionPos > 0) ? filename.substring(0, extensionPos) : filename,
                extension = (displayName.length !== filename.length) ? filename.substring(extensionPos) : '';

            require(['io.ox/office/tk/dialogs'], function (Dialogs) {

                Dialogs.showTextDialog({
                    title: gt('Rename Document'),
                    value: displayName,
                    placeholder: gt('Document name'),
                    okLabel: gt('Rename')
                }).done(function (newName) {

                    // defer controller action after dialog has been closed to
                    // be able to focus the editor. TODO: better solution?
                    newName = newName.trim();
                    window.setTimeout(function () {
                        if (newName.length > 0) {
                            controller.change('file/rename', newName + extension);
                        } else {
                            controller.cancel();
                        }
                    }, 0);
                });
            });
        }

        /**
         * Logs the passed operation in the operations output console.
         */
        function logOperation(operation) {
            var name = operation.name;
            if (opsNode) {
                operation = _.clone(operation);
                delete operation.name;
                operation = JSON.stringify(operation).replace(/^\{(.*)\}$/, '$1');
                opsNode.append($('<tr>').append(
                    $('<td>').text(opsNode.find('tr').length + 1),
                    $('<td>').text(name),
                    $('<td>').text(operation)));
                opsNode.parent().scrollTop(opsNode.parent().get(0).scrollHeight);
            }
        }

        /**
         * Logs the passed selection to the info output console.
         */
        function logSelection(selection) {
            if (infoNode) {
                infoNode.find('tr').eq(1).children('td').eq(1).text((selection && selection.startPaM) ? selection.startPaM : '- empty -');
                infoNode.find('tr').eq(2).children('td').eq(1).text((selection && selection.endPaM) ? selection.endPaM : '- empty -');
            }
        }

        // methods ------------------------------------------------------------

        this.getToolPane = function () {
            return toolPane;
        };

        /**
         * Logs the passed operations in the operations output console.
         *
         * @param {Object[]} operations
         *  An array of operations.
         */
        this.logOperations = function (operations) {
            _(operations).each(logOperation);
            return this;
        };

        /**
         * Logs the passed state of the operations buffer.
         *
         * @param {String} state
         *  The state of the operations buffer.
         */
        this.logSyncState = function (state) {
            if (infoNode) {
                infoNode.find('tr').eq(0).children('td').eq(1).text(state);
            }
            return this;
        };

        this.destroy = function () {
            toolPane.destroy();
            toolPane = null;
        };

        // initialization -----------------------------------------------------

        // create all panes
        nodes.main.addClass('io-ox-office-main').append(
            nodes.toolPane = toolPane.getNode(),
            nodes.appPane = $('<div>').addClass('io-ox-pane apppane').append(editor.getNode())
        );

        // create the tool bars
/*
        createToolBar('insert', { label: gt('Insert') })
            .addGroup('table/insert', new TableSizeChooser())
            .addSeparator()
            .addButton('image/insert/file', { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert Image File') })
            .addButton('image/insert/url',  { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert Image URL') });
*/

        createToolBar('format', { label: gt('Format') })
            .addGroup('paragraph/stylesheet', new Controls.ParagraphStyleChooser(editor))
            .addSeparator()
            .addGroup('character/fontname', new Controls.FontFamilyChooser())
            .addSeparator()
            .addGroup('character/fontsize', new Controls.FontHeightChooser())
            .addSeparator()
            .addButton('character/bold',      { icon: 'icon-io-ox-bold',      tooltip: gt('Bold'),      toggle: true })
            .addButton('character/italic',    { icon: 'icon-io-ox-italic',    tooltip: gt('Italic'),    toggle: true })
            .addButton('character/underline', { icon: 'icon-io-ox-underline', tooltip: gt('Underline'), toggle: true })
            .addSeparator()
            .addGroup('character/fillcolor', new Controls.ColorChooser(editor, 'fill', { label: 'ab', tooltip: gt('Text Fill Color') }))
            .addSeparator()
            .addGroup('character/color', new Controls.ColorChooser(editor, 'text', { icon: 'icon-font', tooltip: gt('Text Color') }))
            .addSeparator()
            .addGroup('paragraph/alignment', new RadioGroup({ icon: 'icon-io-ox-align-left', tooltip: gt('Paragraph Alignment'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton('left',    { icon: 'icon-io-ox-align-left',    tooltip: gt('Left') })
                .addOptionButton('center',  { icon: 'icon-io-ox-align-center',  tooltip: gt('Center') })
                .addOptionButton('right',   { icon: 'icon-io-ox-align-right',   tooltip: gt('Right') })
                .addOptionButton('justify', { icon: 'icon-io-ox-align-justify', tooltip: gt('Justify') }))
            .addSeparator()
            .addGroup('paragraph/lineheight', new RadioGroup({ icon: 'icon-io-ox-line-spacing-1', tooltip: gt('Line Spacing'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton(LineHeight.SINGLE,   { icon: 'icon-io-ox-line-spacing-1',   tooltip: gt('Single') })
                .addOptionButton(LineHeight.ONE_HALF, { icon: 'icon-io-ox-line-spacing-1-5', tooltip: gt('One and a Half') })
                .addOptionButton(LineHeight.DOUBLE,   { icon: 'icon-io-ox-line-spacing-2',   tooltip: gt('Double') }))
            .addSeparator()
            .addGroup('paragraph/fillcolor', new Controls.ColorChooser(editor, 'fill', { icon: 'icon-tint', tooltip: gt('Paragraph Fill Color') }))
            .addSeparator()
            .addButton('paragraph/list/bullets',   { icon: 'icon-io-ox-bullets',        tooltip: gt('Bullets On/Off'),   toggle: true })
            .addButton('paragraph/list/numbering', { icon: 'icon-io-ox-numbering',      tooltip: gt('Numbering On/Off'), toggle: true })
            .addButton('paragraph/list/decindent', { icon: 'icon-io-ox-num-dec-indent', tooltip: gt('Demote One Level') })
            .addButton('paragraph/list/incindent', { icon: 'icon-io-ox-num-inc-indent', tooltip: gt('Promote One Level') });

        createToolBar('table', { label: gt('Table') })
            .addGroup('table/insert', new Controls.TableSizeChooser())
            .addSeparator()
            .addButton('table/insert/row',    { icon: 'icon-io-ox-table-insert-row',    tooltip: gt('Insert Row') })
            .addButton('table/insert/column', { icon: 'icon-io-ox-table-insert-column', tooltip: gt('Insert Column') })
            .addButton('table/delete/row',    { icon: 'icon-io-ox-table-delete-row',    tooltip: gt('Delete Rows') })
            .addButton('table/delete/column', { icon: 'icon-io-ox-table-delete-column', tooltip: gt('Delete Columns') });

        createToolBar('image', { label: gt('Image') })
            .addButton('image/insert/file', { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert Image File') })
            .addButton('image/insert/url',  { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert Image URL') })
            .addSeparator()
            .addButton('image/delete', { icon: 'icon-io-ox-image-delete', tooltip: gt('Delete Image') })
            .addSeparator()
            .addGroup('image/floatmode', new RadioGroup({ icon: 'icon-io-ox-image-inline', tooltip: gt('Image Position'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton('inline',       { icon: 'icon-io-ox-image-inline',      tooltip: gt('Inline') })
                .addOptionButton('leftFloated',  { icon: 'icon-io-ox-image-float-left',  tooltip: gt('Float Left') })
                .addOptionButton('rightFloated', { icon: 'icon-io-ox-image-float-right', tooltip: gt('Float Right') })
                .addOptionButton('noneFloated',  { icon: 'icon-io-ox-image-center',      tooltip: gt('Center') }));

        // additions for debug mode
        if (Config.isDebugAvailable()) {

            opsNode = $('<table>');

            infoNode = $('<table>').css('table-layout', 'fixed').append(
                $('<colgroup>').append($('<col>', { width: '40px' })),
                $('<tr>').append($('<td>').text('state'), $('<td>')),
                $('<tr>').append($('<td>').text('start'), $('<td>')),
                $('<tr>').append($('<td>').text('end'), $('<td>'))
            );

            nodes.debugPane = $('<div>').addClass('io-ox-pane bottom debug user-select-text').append(
                $('<table>').append(
                    $('<colgroup>').append($('<col>', { width: '70%' })),
                    $('<tr>').append(
                        $('<td>').append($('<div>').append(opsNode)),
                        $('<td>').append($('<div>').append(infoNode))
                    )
                )
            ).appendTo(nodes.main);

            editor.on('operation', function (event, operation) { logOperation(operation); })
                .on('selection', function (event, selection) { logSelection(selection); });

            createToolBar('debug', { label: gt('Debug') })
                .addButton('debug/toggle',     { icon: 'icon-eye-open',   tooltip: 'Debug Mode',               toggle: true })
                .addButton('debug/sync',       { icon: 'icon-refresh',    tooltip: 'Synchronize With Backend', toggle: true })
                .addSeparator()
                .addButton('file/editrights', { icon: 'icon-pencil',    tooltip: 'Acquire Edit Rights' })
                .addButton('file/flush',      { icon: 'icon-share-alt', tooltip: 'Flush Operations' })
                .addSeparator()
                .addGroup('document/quicksearch', new TextField({ tooltip: 'Quick Search' }))
                .addSeparator()
                .addButton('character/tab', { icon: 'icon-io-ox-num-inc-indent', tooltip : 'Tab'})
                .addSeparator()
                .addButton('document/cut', { label: 'Cut' })
                .addButton('document/copy', { label: 'Copy' })
                .addButton('document/paste', { label: 'Paste' });
        }

        // register a component that updates the window header tool bar
        controller.registerViewComponent(new AppWindowToolBar(appWindow));

        // make the format tool bar visible
        toolPane.showToolBar('format');

        // listen to browser window resize events when the OX window is visible
        Utils.registerWindowResizeHandler(appWindow, windowResizeHandler);

        // add 'rename document' functionality to title field
        nodes.title.addClass('io-ox-office-title').click(renameDocumentHandler);
        Utils.setControlTooltip(nodes.title, gt('Rename Document'), 'bottom');

        // override the limited functionality of the quick-search text field
        nodes.search
            .off('keydown search change')
            .on('input keydown keypress keyup focus', searchKeyHandler)
            .data('tooltip', null); // remove old tooltip

        // set the quick-search tooltip
        Utils.setControlTooltip(nodes.search, gt('Quick Search'), 'bottom');

        // update all view components every time the window will be shown
        appWindow.on('show', function () { controller.update(); });

    } // class View

    // exports ================================================================

    return View;

});
