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
     "io.ox/core/tk/model",
     "io.ox/core/tk/view",
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

            view = new View({ model: model, node: container });

        var showError = function (message, title) {
            container.find('.alert').remove();
            container.prepend($.alert(title || gt('Error'), message));
        };

        var showInternalError = function (message) {
            showError(message, gt("Internal Error"));
        };

        var showFileApiError = function (data) {
            showError(data.error);
        };

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
            var // the embedded document, wrapped in a jQuery object
                contents = iframe.contents(),
                // the head element of the document embedded in the iframe
                head = $('head', contents),
                // the body element of the document embedded in the iframe
                body = $('body', contents),
                // the content window of the iframe document
                window = iframe.length && iframe.get(0).contentWindow,
                // deferred object for user callbacks
                def = $.Deferred();

            // check that all objects are present
            if (head.length && body.length && window) {
                // add a link to the editor.css file
                // hack: append current time to the link to bypass browser cache
                // (some browsers will not refresh iframe contents after reload)
                head.append($('<link>').attr('rel', 'stylesheet').attr('href', 'apps/io.ox/office/editor.css?dummy=' + _.now()));
                // set body of the document to edit mode
                body.attr('contenteditable', true)
                    .append('<p>normal <span style="font-weight: bold">bold</span> normal <span style="font-style: italic">italic</span> normal</p>');
                // resolve the deferred with a new editor instance
                def.resolve(new Editor(body, window));
            } else {
                // creation of the iframe failed: reject the deferred
                def.reject("Cannot instantiate editor.");
            }

            // on subsequent calls, just return the deferred
            getEditor = function () { return def; };
            return def;
        };

        var createOperationsList = function (result) {
            var operations = [];

            _(result).each(function (value) {
                // iterating over the list of JSON objects
                if (_(value).isArray()) {
                    _(value).each(function (json, j) {
                        operations.push(json);  // the value has already the correct object notation, if it was sent as JSONObject from Java code
                        window.console.log('Operation ' + j + ': ' + JSON.stringify(json));
                    });
                }
            });

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
         */
        app.load = function () {
            var def = $.Deferred();
            win.show(function () {
                win.busy();
                $.when(
                    getEditor().fail(showInternalError),
                    api.get(appOptions).fail(showFileApiError),
                    $.ajax({ type: 'GET',
                        url: ox.apiRoot + "/oxodocumentfilter?action=importdocument&id=" + appOptions.id + "&session=" + ox.session,
                        dataType: 'json'}).fail(showAjaxError))
                .done(function (editor, data, response) {
                    editor.setOperations(createOperationsList(response));
                    editor.focus();
                    win.idle();
                    def.resolve();
                })
                .fail(function () {
                    win.idle();
                    def.reject();
                });
            });
            return def;
        };

        /*
         * Saves the document.
         */
        app.save = function () {
            var def = $.Deferred().fail(showInternalError);
            win.busy();
            $.when(
                getEditor())
            .done(function (editor) {
                editor.focus();
                win.idle();
            })
            .fail(function () {
                win.idle();
            });
            def.reject('Saving document not implemented.');
            return def;
        };

        /*
         * The handler function that will be called when the application shuts
         * down. If the edited document has unsaved changes, a dialog will be
         * shown asking whether to save or drop the changes.
         */
        app.setQuit(function () {
            var def = null;
            $.when(getEditor()).done(function (editor) {
                if (editor.isModified()) {
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                        .text(gt("Do you really want to cancel editing this document?"))
                        .addPrimaryButton("delete", gt('Lose changes'))
                        .addAlternativeButton('save', gt('Save'))
                        .addButton("cancel", gt('Cancel'))
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

        return app;
    }

    return {
        getApp: createInstance
    };
});
