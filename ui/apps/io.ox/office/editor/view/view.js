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
     'io.ox/office/tk/control/label',
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/control/radiogroup',
     'io.ox/office/tk/view/component',
     'io.ox/office/tk/view/pane',
     'io.ox/office/tk/view/toolpane',
     'io.ox/office/tk/view/sidepane',
     'io.ox/office/tk/view/view',
     'io.ox/office/editor/view/controls',
     'io.ox/office/editor/format/lineheight',
     'gettext!io.ox/office/main'
    ], function (Utils, Config, Fonts, Label, TextField, RadioGroup, Component, Pane, ToolPane, SidePane, View, Controls, LineHeight, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class EditorView =======================================================

    /**
     * @constructor
     *
     * @extends View
     */
    function EditorView(app) {

        var // the editor model
            editor = app.getModel(),

            // the application controller
            controller = app.getController(),

            // old value of the search query field
            oldSearchQuery = '',

            // tool pane containing all tool bars
            toolPane = null,

            // side pane containing more controls
            sidePane = null,

            // tool bar hovering at the top border of the application pane
            hoverBar = null,

            // bottom debug pane
            debugPane = null,

            // debug output elements
            debugNodes = null;

        // private methods ----------------------------------------------------

        /**
         * Update handler for the editor status label. Will be called in the
         * context of the status label instance.
         */
        function statusLabelUpdateHandler(value) {

            var // the group instance
                group = this,
                // the root node of the label group instance
                groupNode = group.getNode(),
                // the <label> DOM element
                label = groupNode.find('label'),
                // the new label text
                caption = null,
                // whether to fade out the label
                fadeOut = false,
                // running fade-out timer
                runningTimer = groupNode.data('fade-out-timer');

            function setGroupTimer(timer, delay) {
                groupNode.data('fade-out-timer', _.isFunction(timer) ? window.setTimeout(timer, delay) : null);
            }

            function startFadeOutTimer() {
                var opacity = Math.round(parseFloat(groupNode.css('opacity')) * 100);
                if (opacity >= 10) {
                    groupNode.css('opacity', (opacity - 10) / 100);
                    setGroupTimer(startFadeOutTimer, 50);
                } else {
                    group.hide();
                    setGroupTimer(null);
                }
            }

            // do nothing if state did not change (prevent blinking label after fade-out)
            if (label.attr('data-state') === value) {
                return;
            }

            switch (value) {
            case 'nofile':
                caption = gt('No document');
                break;
            case 'offline':
                caption = gt('Offline');
                break;
            case 'readonly':
                // do not show anything
                // caption = gt('Read-only mode');
                break;
            case 'sending':
                caption = gt('Saving changes');
                break;
            case 'ready':
                caption = gt('All changes saved');
                fadeOut = true;
                break;
            case 'initial':
                // do not show anything
                break;
            default:
                // state must not be undefined/null
                Utils.error('EditorView.statusLabelUpdateHandler(): unknown connection state: ' + value);
            }

            // set caption and data-state attribute (used as CSS selector for formatting)
            groupNode.css('opacity', 1);
            group.toggle(_.isString(caption));
            Utils.setControlCaption(label, { label: caption });
            label.attr('data-state', value);

            // stop running fade-out timer
            if (runningTimer) {
                window.clearTimeout(runningTimer);
                setGroupTimer(null);
            }

            // create a new fade-out timer that starts to fade out after 2 seconds
            if (fadeOut) {
                setGroupTimer(startFadeOutTimer, 2000);
            }
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

            require(['io.ox/office/tk/view/dialogs'], function (Dialogs) {

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
            if (debugNodes) {
                operation = _.clone(operation);
                delete operation.name;
                operation = JSON.stringify(operation).replace(/^\{(.*)\}$/, '$1').replace(/ /g, '\xb7');
                debugNodes.ops.append($('<tr>').append(
                    $('<td>').text(debugNodes.ops.find('tr').length + 1),
                    $('<td>').text(name),
                    $('<td>').text(operation)));
                debugNodes.ops.parent().scrollTop(debugNodes.ops.parent().get(0).scrollHeight);
            }
        }

        /**
         * Logs the passed selection to the info output console.
         */
        function logSelection(selection) {
            if (debugNodes) {
                debugNodes.selType.text(selection.getSelectionType());
                debugNodes.selStart.text(selection.getStartPosition().join(', '));
                debugNodes.selEnd.text(selection.getEndPosition().join(', '));
                debugNodes.selDir.text(selection.isBackwards() ? 'backwards' : 'forwards');
            }
        }

        // base constructor ---------------------------------------------------

        View.call(this, app, { modelPadding: 30 });

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
            if (debugNodes) {
                debugNodes.sync.text(state);
            }
            return this;
        };

        // initialization -----------------------------------------------------

        // create the tool bars
        toolPane = new ToolPane(app);
        this.addPane('toolpane', toolPane, 'top');

        toolPane.createToolBar('format', { label: gt('Format') })
            .addButton('document/undo', { icon: 'icon-io-ox-undo', tooltip: gt('Revert Last Operation') })
            .addButton('document/redo', { icon: 'icon-io-ox-redo', tooltip: gt('Restore Last Operation') })
            .addSeparator()
            .addGroup('paragraph/stylesheet', new Controls.ParagraphStyleChooser(editor))
            .addSeparator()
            .addGroup('character/fontname', new Controls.FontFamilyChooser())
            .addSeparator()
            .addGroup('character/fontsize', new Controls.FontHeightChooser())
            .addSeparator()
            .addButton('character/bold',      { icon: 'icon-io-ox-bold',      tooltip: gt('Bold'),           toggle: true })
            .addButton('character/italic',    { icon: 'icon-io-ox-italic',    tooltip: gt('Italic'),         toggle: true })
            .addButton('character/underline', { icon: 'icon-io-ox-underline', tooltip: gt('Underline'),      toggle: true })
            .addButton('character/strike',    { icon: 'icon-io-ox-strikeout', tooltip: gt('Strike through'), toggle: true })
            .addSeparator()
            .addGroup('character/vertalign', new RadioGroup({ toggleValue: 'baseline' })
                .addOptionButton('sub',      { icon: 'icon-io-ox-subscript',   tooltip: gt('Subscript') })
                .addOptionButton('super',    { icon: 'icon-io-ox-superscript', tooltip: gt('Superscript') }))
            .addSeparator()
            .addGroup('character/fillcolor', new Controls.ColorChooser(editor, 'fill', { label: 'ab', tooltip: gt('Text fill color') }))
            .addSeparator()
            .addGroup('character/color', new Controls.ColorChooser(editor, 'text', { icon: 'icon-font', tooltip: gt('Text color') }))
            .addSeparator()
            .addGroup('paragraph/alignment', new RadioGroup({ icon: 'icon-io-ox-align-left', tooltip: gt('Paragraph alignment'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton('left',    { icon: 'icon-io-ox-align-left',    label: gt('Left') })
                .addOptionButton('center',  { icon: 'icon-io-ox-align-center',  label: gt('Center') })
                .addOptionButton('right',   { icon: 'icon-io-ox-align-right',   label: gt('Right') })
                .addOptionButton('justify', { icon: 'icon-io-ox-align-justify', label: gt('Justify') }))
            .addSeparator()
            .addGroup('paragraph/lineheight', new RadioGroup({ icon: 'icon-io-ox-line-spacing-1', tooltip: gt('Line spacing'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton(LineHeight.SINGLE,   { icon: 'icon-io-ox-line-spacing-1',   label: gt('Single') })
                .addOptionButton(LineHeight.ONE_HALF, { icon: 'icon-io-ox-line-spacing-1-5', label: gt('One and a half') })
                .addOptionButton(LineHeight.DOUBLE,   { icon: 'icon-io-ox-line-spacing-2',   label: gt('Double') }))
            .addSeparator()
            .addGroup('paragraph/fillcolor', new Controls.ColorChooser(editor, 'fill', { icon: 'icon-tint', tooltip: gt('Paragraph Fill Color') }))
            .addSeparator()
            .addButton('character/hyperlink', { icon: 'icon-io-ox-hyperlink', tooltip : 'Hyperlink' })
            .addSeparator()
            .addButton('paragraph/list/bullets',   { icon: 'icon-io-ox-bullets',        tooltip: gt('Bullets on/off'),   toggle: true })
            .addButton('paragraph/list/numbering', { icon: 'icon-io-ox-numbering',      tooltip: gt('Numbering on/off'), toggle: true })
            .addButton('paragraph/list/decindent', { icon: 'icon-io-ox-num-dec-indent', tooltip: gt('Demote one level') })
            .addButton('paragraph/list/incindent', { icon: 'icon-io-ox-num-inc-indent', tooltip: gt('Promote one level') })
            .addSeparator();

        // create the tool boxes
        sidePane = new SidePane(app);
        this.addPane('sidepane', sidePane, 'left');

        sidePane.createToolBox('insert', { label: gt('Insert') })
            .addGroup('table/insert', new Controls.TableSizeChooser())
            .addSeparator()
            .addButton('image/insert/file', { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert image file') })
            .addButton('image/insert/url',  { icon: 'icon-io-ox-image-insert', tooltip: gt('Insert image URL') });

        sidePane.createToolBox('table', { label: gt('Table') })
            .addButton('table/insert/row',    { icon: 'icon-io-ox-table-insert-row',    tooltip: gt('Insert row') })
            .addButton('table/insert/column', { icon: 'icon-io-ox-table-insert-column', tooltip: gt('Insert column') })
            .addButton('table/delete/row',    { icon: 'icon-io-ox-table-delete-row',    tooltip: gt('Delete selected rows') })
            .addButton('table/delete/column', { icon: 'icon-io-ox-table-delete-column', tooltip: gt('Delete selected columns') });

        sidePane.createToolBox('drawing', { label: gt('Drawing') })
            .addButton('drawing/delete', { icon: 'icon-io-ox-image-delete', tooltip: gt('Delete drawing object') })
            .addSeparator()
            .addGroup('drawing/floatmode', new RadioGroup({ icon: 'icon-io-ox-image-inline', tooltip: gt('Drawing position'), dropDown: true, highlight: true, updateCaptionMode: 'icon' })
                .addOptionButton('inline',       { icon: 'icon-io-ox-image-inline',      label: gt('Inline with text') })
                .addOptionButton('leftFloated',  { icon: 'icon-io-ox-image-float-left',  label: gt('Left aligned, text wraps at right side') })
                .addOptionButton('rightFloated', { icon: 'icon-io-ox-image-float-right', label: gt('Right aligned, text wraps at left side') })
                .addOptionButton('noneFloated',  { icon: 'icon-io-ox-image-center',      label: gt('Centered, no text wrapping') }));

        // additions for debug mode
        if (Config.isDebugAvailable()) {

            debugPane = new Pane(app);
            this.addPane('debugpane', debugPane, 'bottom');

            debugNodes = {};
            debugNodes.ops = $('<table>');

            debugNodes.info = $('<table>').css('table-layout', 'fixed').append(
                $('<colgroup>').append($('<col>', { width: '40px' }), $('<col>')),
                $('<tr>').append($('<th>', { colspan: 2 }).text('Editor')),
                $('<tr>').append($('<td>').text('state'), debugNodes.sync = $('<td>')),
                $('<tr>').append($('<th>', { colspan: 2 }).text('Selection')),
                $('<tr>').append($('<td>').text('type'), debugNodes.selType = $('<td>')),
                $('<tr>').append($('<td>').text('start'), debugNodes.selStart = $('<td>')),
                $('<tr>').append($('<td>').text('end'), debugNodes.selEnd = $('<td>')),
                $('<tr>').append($('<td>').text('dir'), debugNodes.selDir = $('<td>'))
            );

            debugPane.getNode().addClass('debug user-select-text').append(
                $('<table>').append(
                    $('<colgroup>').append($('<col>', { width: '70%' })),
                    $('<tr>').append(
                        $('<td>').append($('<div>').append(debugNodes.ops)),
                        $('<td>').append($('<div>').append(debugNodes.info))
                    )
                )
            ).appendTo(app.getWindow().nodes.main);

            editor.on('operation', function (event, operation) { logOperation(operation); })
                .on('selection', function (event, selection) { logSelection(selection); });

            sidePane.createToolBox('debug', { label: gt('Debug') })
                .addButton('debug/toggle', { icon: 'icon-eye-open', tooltip: 'Debug mode',               toggle: true })
                .addButton('debug/sync',   { icon: 'icon-refresh',  tooltip: 'Synchronize with backend', toggle: true })
                .addSeparator()
                .addButton('file/editrights', { icon: 'icon-pencil', tooltip: 'Acquire edit rights' })
                .addSeparator('break')
                .addGroup('document/quicksearch', new TextField({ tooltip: 'Quick search', classes: 'full-width', width: '100%' }))
                .addSeparator('break')
                .addButton('document/cut',   { label: 'Cut',   tooltip: 'Cut to clipboard' })
                .addButton('document/copy',  { label: 'Copy',  tooltip: 'Copy to clipboard' })
                .addButton('document/paste', { label: 'Paste', tooltip: 'Paste from clipboard' })
                .addSeparator('break')
                .addGroup('character/language', new Controls.LanguageChooser({ classes: 'full-width', width: '100%' }))
                .addSeparator('break')
                .addGroup('paragraph/borders', new Controls.ParagraphBorderChooser());
        }

        // create and add the application status label
        hoverBar = new Component(app);
        toolPane.addViewComponent(hoverBar);
        hoverBar.getNode().css({ position: 'absolute', top: '100%', right: '16px' });
        hoverBar.addGroup('file/connection/state', new Label({ classes: 'status-label', updateHandler: statusLabelUpdateHandler }));

        // add 'rename document' functionality to title field
        app.getWindow().nodes.title.addClass('io-ox-office-title').click(renameDocumentHandler);
        Utils.setControlTooltip(app.getWindow().nodes.title, gt('Rename document'), 'bottom');

        // override the limited functionality of the quick-search text field
        app.getWindow().nodes.search
            .off('keydown search change')
            .on('input keydown keypress keyup focus', searchKeyHandler)
            .data('tooltip', null); // remove old tooltip

        // set the quick-search tooltip
        Utils.setControlTooltip(app.getWindow().nodes.search, gt('Quick search'), 'bottom');

    } // class EditorView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: EditorView });

});
