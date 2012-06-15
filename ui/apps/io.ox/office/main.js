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
     'io.ox/office/editor',
     'gettext!io.ox/office/main',
     'io.ox/office/actions',
     'less!io.ox/office/main.css'
    ], function (api, ToolBar, Editor, gt) {

    'use strict';

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

            // main tool bar
            toolbar = new ToolBar(),

            // main application container
            container = $('<div>').addClass('container'),

            // primary editor used in save, quit, etc.
            editor = null;

        // initialization code, in local namespace for temporary variables
        (function () {

            var // root nodes of all editors
                nodes = {},
                // editors mapped by text mode
                editors = {};

            // create the rich-text and plain-text editor
            _(Editor.TextMode).each(function (textMode) {
                nodes[textMode] = $('<div>')
                    .addClass('io-ox-office-editor user-select-text ' + textMode)
                    .attr('contenteditable', true);
                editors[textMode] = new Editor(nodes[textMode], textMode);
            });

            // primary editor for save operation
            editor = editors[Editor.TextMode.RICH];

            // operations output console
            nodes.output = $('<div>').addClass('io-ox-office-editor user-select-text output');
            editors.output = {
                _node: nodes.output,
                on: function () {},
                applyOperation: function (operation) {
                    this._node.append($('<p>').text(JSON.stringify(operation)));
                    this._node.scrollTop(this._node.get(0).scrollHeight);
                }
            };

            // build table for temporary plain-text editor and operations output console
            container
                .append(nodes[Editor.TextMode.RICH])
                .append($('<table>')
                    .append('<colgroup><col width="50%"><col width="50%"></colgroup>')
                    .append($('<tr>')
                        .append($('<td>').append(nodes[Editor.TextMode.PLAIN]))
                        .append($('<td>').append(nodes.output))));

            // listen to operations and deliver them to editors and output console
            _(editors).each(function (editor) {
                editor.on('operation', function (event, operation) {
                    var source = this;
                    _(editors).each(function (editor) {
                        if (source !== editor) {
                            editor.applyOperation(operation);
                        }
                    });
                });
            });

            toolbar
                .createButtonGroup('fontAttr')
                    .addButton('bold',      { label: 'B', 'class': 'btn-iconlike', css: { fontWeight: 'bold' } })
                    .addButton('italic',    { label: 'I', 'class': 'btn-iconlike', css: { fontStyle: 'italic' } })
                    .addButton('underline', { label: 'U', 'class': 'btn-iconlike', css: { textDecoration: 'underline' } })
                    .click(function (event, id) {
                        editor.setAttribute(id);
                        editor.focus();
                    })
                    .poll(function (id) {
                        return editor.getAttribute(id);
                    }, 200)
                .end()
                .createButtonGroup('paraAlign', { radio: true })
                    .addButton('left',    { icon: 'align-left' })
                    .addButton('center',  { icon: 'align-center' })
                    .addButton('right',   { icon: 'align-right' })
                    .addButton('justify', { icon: 'align-justify' })
                .end()
                .createButtonGroup('debug')
                    .addButton('highlight', { icon: 'eye-open', toggle: true })
                    .click(function (event, id, state) {
                        _(nodes).each(function (node) {
                            node.toggleClass('debug-highlight', state);
                        });
                        editor.focus();
                    })
                .end();

        }()); // end of local namespace

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
            container.find('.alert').remove();
            container.prepend($.alert(title || gt('Error'), message));
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
            return ox.apiRoot + '/oxodocumentfilter?action=' + action + '&id=' + docOptions.id + '&session=' + ox.session;
        };

        var updateTitles = function () {
            app.setTitle(docOptions.filename || baseTitle);
            if (win) {
                win.setTitle(baseTitle + (docOptions.filename ? (' - ' + docOptions.filename) : ''));
            }
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

        /*
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
            win.nodes.main.addClass('io-ox-office-main').append(toolbar.getNode(), container);
        });

        /*
         * Loads the document described in the options map passed in the
         * constructor of this application, and shows the application window.
         *
         * @returns
         *  A deferred that reflects the result of the load operation.
         */
        app.load = function () {
            var def = $.Deferred();
            win.show().busy();
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument'),
                dataType: 'json'
            })
            .done(function (response) {
                var operations = createOperationsList(response);
                editor.applyOperations(operations, false, true);
                editor.focus(true);
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

        /*
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
                editor.focus();
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

        /*
         * The handler function that will be called when the application shuts
         * down. If the edited document has unsaved changes, a dialog will be
         * shown asking whether to save or drop the changes.
         *
         * @returns
         *  A deferred that will be resolved if the application can be closed
         *  (either if it is unchanged, or the user has chosen to save or lose
         *  the changes), or will be rejected if the application must remain
         *  alive (user has cancelled the dialog).
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
            return def;
        });

        app.destroy = function () {
            app = win = toolbar = container = editor = null;
        };

        return app;
    }

    return {
        getApp: createInstance
    };
});
