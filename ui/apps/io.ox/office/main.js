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
     'io.ox/office/model',
     'io.ox/core/tk/view',
     'io.ox/office/editor',
     'gettext!io.ox/office/main',
     'less!io.ox/office/main.css',
     'io.ox/office/actions'
    ], function (api, Model, View, Editor, gt) {

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

            // main application container
            container = $('<div>').addClass('container abs'),

            model = new Model(),

            view = new View({ model: model, node: container });

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
         * Shows an internal error message with the specified message text.
         */
        var showInternalError = function (message) {
            showError(message, gt('Internal Error'));
        };

        /*
         * Shows an error message extracted from the error object returned by
         * a jQuery AJAX call.
         */
        var showAjaxError = function (data) {
            showError(data.responseText);
        };

        var getFilterUrl = function (action) {
            return ox.apiRoot + '/oxodocumentfilter?action=' + action + '&id=' + docOptions.id + '&session=' + ox.session;
        };

        var updateTitles = function () {
            app.setTitle(docOptions.filename || baseTitle);
            if (win) {
                win.setTitle(baseTitle + (docOptions.filename ? (' - ' + docOptions.filename) : ''));
            }
        };

        /*
         * Returns a deferred that reflects whether initialization of the
         * editor succeeded. On first call, initializes the editor iframe and
         * creates a new instance of the Editor class. On subsequent calls,
         * returns the same deferred object again without initialization.
         *
         * @param textMode
         *  One of the constants defined in Editor.TextMode (office/editor.js).
         */
        var getEditor = (function () {

            // local cache, maps existing deferreds by text mode
            var deferreds = {};

            // create the function and return it, will be assigned the getEditor variable
            return function (textMode) {
                var def, iframe;

                // return cached deferred
                if (textMode in deferreds) {
                    return deferreds[textMode];
                }

                // craete a deferred and a new iframe
                def = deferreds[textMode] = $.Deferred();
                iframe = $('<iframe>').addClass('io-ox-office-iframe-' + textMode).appendTo(container);

                /*
                 * Put the code to manipulate the embedded document into a timeout.
                 * This is needed to give the browser time to create the embedded
                 * HTML document inside the iframe.
                 */
                setTimeout(function () {

                    var // the content window of the iframe document
                        frameWindow = iframe.length && iframe.get(0).contentWindow,
                        // the content window of the iframe document
                        frameDocument = iframe.length && iframe.get(0).contentDocument,
                        // the head element of the document embedded in the iframe
                        frameHead = $('head', frameDocument),
                        // the body element of the document embedded in the iframe
                        frameBody = $('body', frameDocument);

                    // check that all components of the embedded document are valid
                    if (frameWindow && frameHead.length && frameBody.length) {
                        // add a link to the editor.css file
                        frameHead.append($('<link>').attr('rel', 'stylesheet').attr('href', ox.base + '/apps/io.ox/office/editor.css'));
                        // set body of the document to edit mode
                        frameBody.addClass(textMode).attr('contenteditable', true);
                        // append some text to play with, TODO: remove that
                        frameBody.append('<p>normal <span style="font-weight: bold">bold</span> normal <span style="font-style: italic">italic</span> normal</p>');
                        // resolve the deferred with a new editor instance
                        def.resolve(new Editor(frameBody, frameWindow, textMode));
                    } else {
                        // creation of the iframe failed: reject the deferred
                        showInternalError('Cannot instantiate editor for text mode "' + textMode + '".');
                        def.reject();
                    }
                });

                return def;
            };
        }());

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

            // we are using an iframe
            win.detachable = false;

            // initialize global application structure
            updateTitles();
            win.nodes.main.addClass('io-ox-office-main').append(container);
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
            win.show();
            $.when(
                getEditor(Editor.TextMode.RICH),
                getEditor(Editor.TextMode.PLAIN)
            )
            .done(function (editor) {
                win.busy();
                $.ajax({
                    type: 'GET',
                    url: getFilterUrl('importdocument'),
                    dataType: 'json'
                })
                .done(function (response) {
                    // editor.applyOperations(createOperationsList(response), false);
                    editor.applyOperations(createOperationsList(response), true);  // only for testing reasons "true"
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
            });
        };

        /*
         * Saves the document to its origin.
         *
         * @returns
         *  A deferred that reflects the result of the save operation.
         */
        app.save = function () {
            var def = $.Deferred();
            getEditor(Editor.TextMode.RICH).done(function (editor) {
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
            getEditor(Editor.TextMode.RICH).done(function (editor) {
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
                    def = $.Deferred().resolve();
                }
            });
            return def;
        });

        app.destroy = function () {
            view.destroy();
            app = win = container = model = view = null;
        };

        return app;
    }

    return {
        getApp: createInstance
    };
});
