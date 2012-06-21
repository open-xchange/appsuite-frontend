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

define('io.ox/office/main',
    ['io.ox/files/api',
     'io.ox/office/toolbar',
     'io.ox/office/controller',
     'io.ox/office/editor',
     'gettext!io.ox/office/main',
     'io.ox/office/actions',
     'less!io.ox/office/main.css'
    ], function (api, ToolBar, Controller, Editor, gt) {

    'use strict';

    // class MainToolBar ======================================================

    /**
     * Creates and returns a new instance of the main editor tool bar.
     */
    var MainToolBar = ToolBar.extend({

        constructor: function () {

            // call base constructor
            ToolBar.call(this);

            // add all tool bar controls
            this
            .createButtonGroup()
                .addButton('action/undo', { label: 'Undo' })
                .addButton('action/redo', { label: 'Redo' })
            .end()
            .createButtonGroup()
                .addButton('font/bold',      { label: 'B', 'class': 'btn-iconlike', css: { fontWeight: 'bold' },          tooltip: gt('Bold'),      toggle: true })
                .addButton('font/italic',    { label: 'I', 'class': 'btn-iconlike', css: { fontStyle: 'italic' },         tooltip: gt('Italic'),    toggle: true })
                .addButton('font/underline', { label: 'U', 'class': 'btn-iconlike', css: { textDecoration: 'underline' }, tooltip: gt('Underline'), toggle: true })
            .end()
            .createRadioGroup('paragraph/align')
                .addButton('left',    { icon: 'align-left',    tooltip: gt('Left') })
                .addButton('center',  { icon: 'align-center',  tooltip: gt('Center') })
                .addButton('right',   { icon: 'align-right',   tooltip: gt('Right') })
                .addButton('justify', { icon: 'align-justify', tooltip: gt('Justify') })
            .end()
            .createRadioDropDown('paragraph/align', { columns: 2 })
                .addButton('left',    { icon: 'align-left',    tooltip: gt('Left') })
                .addButton('center',  { icon: 'align-center',  tooltip: gt('Center') })
                .addButton('right',   { icon: 'align-right',   tooltip: gt('Right') })
                .addButton('justify', { icon: 'align-justify', tooltip: gt('Justify') })
            .end()
            .createButton('action/debug', { icon: 'eye-open', tooltip: gt('Debug Mode'), toggle: true });

        } // end of constructor

    });

    // class EditorController =================================================

    var EditorController = Controller.extend({

        constructor: function (app) {

            var // current editor having the focus
                editor = null;

            // base constructor -----------------------------------------------

            Controller.call(this, {

                'action/undo': {
                    get: function () { return editor.hasUndo(1); },
                    set: function (list) { editor.undo(1); editor.grabFocus(); }
                },
                'action/redo': {
                    get: function () { return editor.hasRedo(); },
                    set: function (list) { editor.redo(1); editor.grabFocus(); }
                },
                'action/debug': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); editor.grabFocus(); }
                },

                'font/bold': {
                    get: function () { return editor.getAttribute('bold'); },
                    set: function (state) { editor.setAttribute('bold', state); editor.grabFocus(); },
                    poll: true
                },
                'font/italic': {
                    get: function () { return editor.getAttribute('italic'); },
                    set: function (state) { editor.setAttribute('italic', state); editor.grabFocus(); },
                    poll: true
                },
                'font/underline': {
                    get: function () { return editor.getAttribute('underline'); },
                    set: function (state) { editor.setAttribute('underline', state); editor.grabFocus(); },
                    poll: true
                },

                'paragraph/align': {
                    set: function (value) { editor.grabFocus(); }
                }

            });

            // methods --------------------------------------------------------

            /**
             * Registers a new editor instance. If the editor has the browser
             * focus, this controller will use it as target for item actions
             * triggered by any registered view component.
             */
            this.registerEditor = function (newEditor, supportedItems) {
                newEditor.on('focus', _.bind(function (event, focused) {
                    if (focused && (editor !== newEditor)) {
                        // set as current editor
                        editor = newEditor;
                        // update view components
                        this.enableAndDisable(supportedItems);
                    }
                }, this));
                return this;
            };

        } // end of constructor

    });

    // create application instance ============================================

    // multi-instance pattern: on each call, create a new application
    // TODO: return open application per file
    function createInstance(options) {

        var // document options
            docOptions = $.extend({
                filename: gt('Unnamed')
            }, options),

            // default title for launcher and window
            baseTitle = gt('OX Office'),

            // application object
            app = ox.ui.createApp({ name: 'io.ox/office', title: baseTitle }),

            // application window
            win = null,

            // top pane for tool bars
            toolPane = $('<div>').addClass('io-ox-office-tool-pane'),

            // main application container
            appPane = $('<div>').addClass('container'),

            // bottom pane for debug output
            debugPane = $('<div>').addClass('io-ox-office-debug-pane'),

            // main tool bar
            toolbar = new MainToolBar(),

            // primary editor used in save, quit, etc.
            editor = null,

            // controller as single connection point between editors and view elements
            controller = new EditorController(app),

            debugMode = null;

        /*
         * Shows a closable error message above the editor.
         *
         * @param message
         *  The message text.
         *
         * @param title
         *  (optional) The title of the error message. Defaults to 'Error'.
         */
        var showError = function (message, title) {
            appPane.find('.alert').remove();
            appPane.prepend($.alert(title || gt('Error'), message));
        };

        /*
         * Shows an error message extracted from the error object returned by
         * a jQuery AJAX call.
         */
        var showAjaxError = function (data) {
            showError(data.responseText);
        };

        /*
         * Returns the URL passed to the AJAX calls used to convert a document
         * file from and to an operations list.
         */
        var getFilterUrl = function (action) {
            return ox.apiRoot + '/oxodocumentfilter?action=' + action +
                '&id=' + docOptions.id +
                '&version=' + docOptions.version +
                '&filename=' + docOptions.filename +
                '&session=' + ox.session +
                '';
        };

        var updateTitles = function () {
            app.setTitle(docOptions.filename || baseTitle);
            win.setTitle(baseTitle + (docOptions.filename ? (' - ' + docOptions.filename) : ''));
        };

        /**
         * Recalculates the size of the editor frame according to the current
         * view port size.
         */
        var updateWindowSize = function () {
            var debugHeight = debugMode ? debugPane.outerHeight() : 0;
            appPane.height(window.innerHeight - appPane.offset().top - debugHeight);
        };

        var getOperationsCount = function (result) {

            // The result is a JSONObject
            if (_(result).isObject()) {
                window.console.log("Number of operations received by the server: " + result.data.count);
            }

        };

        var createOperationsList = function (result) {

            var operations = [];
            var value = result.data.operations;

            if (_(value).isArray()) {
                _(value).each(function (json, j) {
                    if (_(json).isObject()) {
                        operations.push(json);  // the value has already the correct object notation, if it was sent as JSONObject from Java code
                    }
                });
            }

            return operations;
        };

        /**
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         */
        app.setLauncher(function () {
            // create the application window
            win = ox.ui.createWindow({
                name: 'io.ox/office',
                title: baseTitle,
                close: true,
                search: false,
                toolbar: true
            });
            app.setWindow(win);

            // initialize global application structure
            updateTitles();
            win.nodes.main.addClass('io-ox-office-main').append(toolPane, appPane, debugPane);

            // update editor 'div' on window size change
            $(window).resize(updateWindowSize);
            win.on('show', updateWindowSize);
        });

        /**
         * Loads the document described in the options map passed in the
         * constructor of this application, and shows the application window.
         *
         * @returns
         *  A deferred that reflects the result of the load operation.
         */
        app.load = function () {
            var def = $.Deferred();
            win.show().busy();
            $(window).resize();
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument'),
                dataType: 'json'
            })
            .done(function (response) {
                var operations = createOperationsList(response);
                editor.applyOperations(operations, false, true);
                editor.setModified(false);
                editor.grabFocus(true);
                win.idle();
                def.resolve();
            })
            .fail(function (response) {
                showAjaxError(response);
                win.idle();
                def.reject();
            });
            return def;
        };

        /**
         * Saves the document to its origin.
         *
         * @returns
         *  A deferred that reflects the result of the save operation.
         */
        app.save = function () {
            var def = $.Deferred();
            win.busy();
            var allOperations = editor.getOperations();
            var dataObject = {"operations": JSON.stringify(allOperations)};

            $.ajax({
                type: 'POST',
                url: getFilterUrl('exportdocument'),
                dataType: 'json',
                data: dataObject,
                beforeSend: function (xhr) {
                    if (xhr && xhr.overrideMimeType) {
                        xhr.overrideMimeType("application/j-son;charset=UTF-8");
                    }
                }
            })
            .done(function (response) {
                getOperationsCount(response);
                editor.setModified(false);
                editor.grabFocus();
                win.idle();
                def.resolve();
            })
            .fail(function (response) {
                showAjaxError(response);
                win.idle();
                def.reject();
            });
            return def;
        };

        /**
         * The handler function that will be called when the application shuts
         * down. If the edited document has unsaved changes, a dialog will be
         * shown asking whether to save or drop the changes.
         *
         * @returns
         *  A deferred that will be resolved if the application can be closed
         *  (either if it is unchanged, or the user has chosen to save or lose
         *  the changes), or will be rejected if the application must remain
         *  alive (user has cancelled the dialog, save operation failed).
         */
        app.setQuit(function () {
            var def = null;
            if (editor.isModified()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                    .text(gt('Do you really want to cancel editing this document?'))
                    .addPrimaryButton('delete', gt('Lose changes'))
                    .addAlternativeButton('save', gt('Save'))
                    .addButton('cancel', gt('Cancel'))
                    .on('delete', function () { def = $.when(); })
                    .on('save', function () { def = app.save(); })
                    .on('cancel', function () { def = $.Deferred().reject(); })
                    .show();
                });
            } else {
                def = $.when();
            }
            return def.done(app.destroy);
        });

        /**
         * Returns whether the application is in debug mode. See method
         * setDebugMode() for details.
         */
        app.isDebugMode = function () {
            return debugMode;
        };

        /**
         * Enables or disables the debug mode. In debug mode, displays colored
         * borders and background for 'p' and 'span' elements in the rich-text
         * editor, and shows a plain-text editor and an output console for
         * processed operations.
         */
        app.setDebugMode = function (state) {
            if (debugMode !== state) {
                debugMode = state;
                editor.getNode().toggleClass('debug-highlight', state);
                toolbar.getNode().toggleClass('debug-highlight', state);
                if (state) { debugPane.show(); } else { debugPane.hide(); }
                updateWindowSize();
            }
        };

        /**
         * Destructs the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        app.destroy = function () {
            $(window).off('resize', updateWindowSize);
            controller.destroy();
            toolbar.destroy();
            app = win = toolbar = appPane = debugPane = controller = editor = null;
        };

        // initialization -----------------------------------------------------

        // initialization code, in local namespace for temporary variables
        (function () {

            var // editors mapped by text mode
                editors = {};

            // create the rich-text and plain-text editor
            _(Editor.TextMode).each(function (textMode) {
                var node = $('<div>')
                        .addClass('io-ox-office-editor user-select-text ' + textMode)
                        .attr('contenteditable', true);
                editors[textMode] = new Editor(controller, node, textMode);
            });

            // register GUI elements and editors at the controller
            controller
                .registerViewComponent(toolbar)
                .registerEditor(editors[Editor.TextMode.RICH])
                .registerEditor(editors[Editor.TextMode.PLAIN], /^action\//);

            // primary editor for global operations (e.g. save)
            editor = editors[Editor.TextMode.RICH];

            // operations output console
            editors.output = {
                node: $('<div>').addClass('io-ox-office-editor user-select-text output'),
                on: function () { return this; },
                applyOperation: function (operation) {
                    this.node.append($('<p>').text(JSON.stringify(operation)));
                    this.node.scrollTop(this.node.get(0).scrollHeight);
                }
            };

            // build debug table for plain-text editor and operations output console
            debugPane.append($('<table>')
                .append('<colgroup><col width="50%"><col width="50%"></colgroup>')
                .append($('<tr>')
                    .append($('<td>').append(editors[Editor.TextMode.PLAIN].getNode()))
                    .append($('<td>').append(editors.output.node))));

            // insert elements into panes
            toolPane.append(toolbar.getNode());
            appPane.append(editor.getNode());

            // listen to operations and deliver them to editors and output console
            _(editors).each(function (editor) {
                editor.on('operation', function (event, operation) {
                    _(editors).each(function (targetEditor) {
                        if (editor !== targetEditor) {
                            targetEditor.applyOperation(operation);
                        }
                    });
                });
            });

            // initially disable debug mode
            app.setDebugMode(false);

        }()); // end of local namespace

        return app;

    } // end of createInstance()

    // exports ================================================================

    return { getApp: createInstance };
});
