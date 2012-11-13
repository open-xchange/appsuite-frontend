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
     'io.ox/office/editor/view/controls',
     'io.ox/office/editor/format/lineheight',
     'gettext!io.ox/office/main'
    ], function (Utils, Config, Fonts, TextField, RadioGroup, ToolPane, Controls, LineHeight, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class EditorView =======================================================

    function EditorView(appWindow, editor, controller) {

        var // all nodes of the application window
            nodes = appWindow.nodes,

            // tool pane containing all tool bars
            toolPane = new ToolPane(appWindow, controller),

            // old value of the search query field
            oldSearchQuery = '',

            // output element for operations log
            opsNode = null,

            // output elements for other debug information
            infoNode = null, syncCell = null, selTypeCell = null, selStartCell = null, selEndCell = null;

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
            if (selTypeCell) { selTypeCell.text(selection.getSelectionType()); }
            if (selStartCell) { selStartCell.text(selection.getStartPosition()); }
            if (selEndCell) { selEndCell.text(selection.getEndPosition()); }
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
            if (syncCell) { syncCell.text(state); }
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
                .addOptionButton('left',    { icon: 'icon-io-ox-align-left',    label: gt('Left') })
                .addOptionButton('center',  { icon: 'icon-io-ox-align-center',  label: gt('Center') })
                .addOptionButton('right',   { icon: 'icon-io-ox-align-right',   label: gt('Right') })
                .addOptionButton('justify', { icon: 'icon-io-ox-align-justify', label: gt('Justify') }))
            .addSeparator()
            .addGroup('paragraph/lineheight', new RadioGroup({ icon: 'icon-io-ox-line-spacing-1', tooltip: gt('Line Spacing'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton(LineHeight.SINGLE,   { icon: 'icon-io-ox-line-spacing-1',   label: gt('Single') })
                .addOptionButton(LineHeight.ONE_HALF, { icon: 'icon-io-ox-line-spacing-1-5', label: gt('One and a Half') })
                .addOptionButton(LineHeight.DOUBLE,   { icon: 'icon-io-ox-line-spacing-2',   label: gt('Double') }))
            .addSeparator()
            .addGroup('paragraph/fillcolor', new Controls.ColorChooser(editor, 'fill', { icon: 'icon-tint', tooltip: gt('Paragraph Fill Color') }))
            .addSeparator()
            .addButton('paragraph/list/bullets',   { icon: 'icon-io-ox-bullets',        tooltip: gt('Bullets On/Off'),   toggle: true })
            .addButton('paragraph/list/numbering', { icon: 'icon-io-ox-numbering',      tooltip: gt('Numbering On/Off'), toggle: true })
            .addButton('paragraph/list/decindent', { icon: 'icon-io-ox-num-dec-indent', tooltip: gt('Demote One Level') })
            .addButton('paragraph/list/incindent', { icon: 'icon-io-ox-num-inc-indent', tooltip: gt('Promote One Level') })
            .addSeparator();

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
            .addButton('drawing/delete', { icon: 'icon-io-ox-image-delete', tooltip: gt('Delete Drawing') })
            .addSeparator()
            .addGroup('drawing/floatmode', new RadioGroup({ icon: 'icon-io-ox-image-inline', tooltip: gt('Drawing Position'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton('inline',       { icon: 'icon-io-ox-image-inline',      label: gt('Inline With Text') })
                .addOptionButton('leftFloated',  { icon: 'icon-io-ox-image-float-left',  label: gt('Float Left') })
                .addOptionButton('rightFloated', { icon: 'icon-io-ox-image-float-right', label: gt('Float Right') })
                .addOptionButton('noneFloated',  { icon: 'icon-io-ox-image-center',      label: gt('Center') }));

        // additions for debug mode
        if (Config.isDebugAvailable()) {

            opsNode = $('<table>');

            infoNode = $('<table>').css('table-layout', 'fixed').append(
                $('<colgroup>').append($('<col>', { width: '40px' }), $('<col>')),
                $('<tr>').append($('<th>', { colspan: 2 }).text('Editor')),
                $('<tr>').append($('<td>').text('state'), syncCell = $('<td>')),
                $('<tr>').append($('<th>', { colspan: 2 }).text('Selection')),
                $('<tr>').append($('<td>').text('type'), selTypeCell = $('<td>')),
                $('<tr>').append($('<td>').text('start'), selStartCell = $('<td>')),
                $('<tr>').append($('<td>').text('end'), selEndCell = $('<td>'))
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
                .addButton('character/hyperlink', { icon: 'icon-eye-open', tooltip : 'Insert Hyperlink' })
                .addSeparator()
                .addButton('document/cut',   { label: 'Cut',   tooltip: 'Cut To Clipboard' })
                .addButton('document/copy',  { label: 'Copy',  tooltip: 'Copy To Clipboard' })
                .addButton('document/paste', { label: 'Paste', tooltip: 'Paste From Clipboard' })
                .addSeparator()
                .addGroup('character/language', new Controls.LanguageChooser())
                .addSeparator()
                .addGroup('paragraph/borders', new RadioGroup({ icon: 'icon-io-ox-para-border-outside', tooltip: gt('Pargraph Border'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                    .addOptionButton('none',      { icon: 'icon-io-ox-para-border-none',      label: gt('No border') })
                    .addOptionButton('leftright', { icon: 'icon-io-ox-para-border-leftright', label: gt('Border left and right') })
                    .addOptionButton('topbottom', { icon: 'icon-io-ox-para-border-topbottom', label: gt('Border top and bottom') })
                    .addOptionButton('outside',   { icon: 'icon-io-ox-para-border-outside',   label: gt('Border outside') })
                    .addOptionButton('full',      { icon: 'icon-io-ox-para-border-full',      label: gt('Border outside and inside') })
                    .addOptionButton('left',      { icon: 'icon-io-ox-para-border-left',      label: gt('Border left') })
                    .addOptionButton('right',     { icon: 'icon-io-ox-para-border-right',     label: gt('Border right') })
                    .addOptionButton('top',       { icon: 'icon-io-ox-para-border-top',       label: gt('Border top') })
                    .addOptionButton('bottom',    { icon: 'icon-io-ox-para-border-bottom',    label: gt('Border bottom') })
                    .addOptionButton('inside',    { icon: 'icon-io-ox-image-center-inside',   label: gt('Border inside') }));
        }

        // make the format tool bar visible
        toolPane.showToolBar('format');

        // add application status label to tab bar
        toolPane.getTabBar()
            .addSeparator()
            .addLabel('file/connection/state', { css: { minWidth: 115 } });

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

    } // class EditorView

    // exports ================================================================

    return EditorView;

});
