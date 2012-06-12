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
     'io.ox/core/tk/model',
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

        var // file/document options
            appOptions = $.extend({
                filename: gt('Unnamed')
            }, options),

            // application object
            app = ox.ui.createApp({ name: 'io.ox/office', title: appOptions.filename }),

            // application window
            win = null,

            // default window title
            winBaseTitle = gt('OX Office'),

            // main application container
            container = $('<div>').addClass('container abs'),

            // the iframe representing the edited document
            iframe = $('<iframe>').addClass('io-ox-office-iframe'),

            model = new Model(),

            view = new View({ model: model, node: container }),

            filterUrl = ox.apiRoot + '/oxodocumentfilter?action=importdocument&id=' + appOptions.id + '&session=' + ox.session;

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

        var updateTitles = function () {
            app.setTitle(appOptions.filename);
            if (win) {
                win.setTitle(winBaseTitle + ' - ' + appOptions.filename);
            }
        };

        /*
         * Returns a deferred that reflects whether initialization of the
         * editor succeeded. On first call, initializes the editor iframe and
         * creates a new instance of the Editor class. On subsequent calls,
         * returns the same deferred object again without initialization.
         */
        var getEditor = function () {
            // the return value
            var def = $.Deferred();

            // put the code to manipulate the embedded document into a timeout
            setTimeout(function () {
                var // the embedded document, wrapped in a jQuery object
                    contents = iframe.contents(),
                    // the head element of the document embedded in the iframe
                    frameHead = $('head', contents),
                    // the body element of the document embedded in the iframe
                    frameBody = $('body', contents),
                    // the content window of the iframe document
                    frameWindow = iframe.length && iframe.get(0).contentWindow;

                // check that all components of the embedded document are valid
                if (frameHead.length && frameBody.length && frameWindow) {
                    // add a link to the editor.css file
                    frameHead.append($('<link>').attr('rel', 'stylesheet').attr('href', ox.base + '/apps/io.ox/office/editor.css'));
                    // set body of the document to edit mode
                    frameBody.attr('contenteditable', true);
                    // append some text to play with, TODO: remove that
                    frameBody.append('<p>normal <span style="font-weight: bold">bold</span> normal <span style="font-style: italic">italic</span> normal</p>');
                    // resolve the deferred with a new editor instance
                    def.resolve(new Editor(frameBody, frameWindow));
                } else {
                    // creation of the iframe failed: reject the deferred
                    showInternalError('Cannot instantiate editor.');
                    def.reject();
                }
            });

            // on subsequent calls, just return the deferred
            getEditor = function () { return def; };
            return def;
        };

        var createOperationsList = function (result) {

            var operations = [];
            var value = JSON.parse(result.data);

            if (_(value).isArray()) {
                // iterating over the list of JSON objects
                _(value).each(function (json, j) {
                    if (_(json).isObject()) {
                        operations.push(json);  // the value has already the correct object notation, if it was sent as JSONObject from Java code
                        // window.console.log('Operation ' + j + ': ' + JSON.stringify(json));
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
                title: winBaseTitle,
                close: true,
                search: false,
                toolbar: true
            });
            app.setWindow(win);

            // we are using an iframe
            win.detachable = false;

            // initialize global application structure
            updateTitles();
            win.nodes.main.addClass('io-ox-office-main').append(container.append(iframe));
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
            getEditor().done(function (editor) {
                win.busy();
                $.ajax({
                    type: 'GET',
                    url: filterUrl,
                    dataType: 'json'
                })
                .done(function (response) {
                    editor.applyOperations(createOperationsList(response), false);
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
            getEditor().done(function (editor) {
                win.busy();
                var allOperations = editor.getOperations();
                // var operations = convertAllOperations(allOperations);
                var operations = {"Operations": ["{name:insertParagraph, para:0}", "{name:insertText, para:0, pos:3, text:hallo}", "{name:insertText, para:1, pos:6, text:Welt}"]};
                $.ajax({
                    type: 'POST',
                    url: ox.apiRoot + "/oxodocumentfilter?action=exportdocument&id=" + appOptions.id + "&session=" + ox.session,  // URL needs to be specified
                    dataType: 'json',
                    data: operations,
                    beforeSend: function (xhr) {
                        if (xhr && xhr.overrideMimeType) {
                            xhr.overrideMimeType("application/j-son;charset=UTF-8");
                        }
                    }
                })
                .done(function (response) {
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
         */
        app.setQuit(function () {
            var def = null;
            getEditor().done(function (editor) {
                if (editor.isModified()) {
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                        .text(gt('Do you really want to cancel editing this document?'))
                        .addPrimaryButton('delete', gt('Lose changes'))
                        .addAlternativeButton('save', gt('Save'))
                        .addButton('cancel', gt('Cancel'))
                        .on('delete', function () { def = $.Deferred().resolve(); })
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
            app = win = container = iframe = model = view = null;
        };

        return app;
    }

    return {
        getApp: createInstance
    };
});
