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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define("io.ox/office/preview/main",
    ["io.ox/office/preview/preview",
     "io.ox/office/tk/toolbar",
     "io.ox/office/tk/controller",
     "gettext!io.ox/office/main",
     "less!io.ox/office/preview/style.css"
    ], function (Preview, ToolBar, Controller, gt) {

    'use strict';

    var MODULE_NAME = 'io.ox/office/preview';

    // createApplication() ====================================================

    function createApplication(options) {

        var app = ox.ui.createApp({ name: MODULE_NAME }),

            win = null,

            file = _.isObject(options) ? options.file : null,

            toolPane = $('<div>').addClass('io-ox-pane'),

            toolBar = new ToolBar()
                .addButton('first', { icon: 'icon-fast-backward', tooltip: gt('First page') })
                .addButton('previous', { icon: 'icon-step-backward', tooltip: gt('Previous page') })
                .addLabel('page', { tooltip: gt('Page number') })
                .addButton('next', { icon: 'icon-step-forward', tooltip: gt('Next page') })
                .addButton('last', { icon: 'icon-fast-forward', tooltip: gt('Last page') }),

            controller = new Controller({
                page: {
                    enable: function () { return preview.getPageCount() > 0; },
                    get: function () {
                        // the gettext comments MUST be directly before gt(),
                        // but 'return' cannot be the last token in a line
                        // -> use a temporary variable to store the result
                        var msg =
                            //#. %1$s is the current page index in office document preview
                            //#. %2$s is the number of pages in office document preview
                            //#, c-format
                            gt('%1$s of %2$s', preview.getPage(), preview.getPageCount());
                        return msg;
                    }
                },
                first: {
                    enable: function () { return preview.firstAvail(); },
                    set: function () { preview.firstPage(); }
                },
                previous: {
                    enable: function () { return preview.previousAvail(); },
                    set: function () { preview.previousPage(); }
                },
                next: {
                    enable: function () { return preview.nextAvail(); },
                    set: function () { preview.nextPage(); }
                },
                last: {
                    enable: function () { return preview.lastAvail(); },
                    set: function () { preview.lastPage(); }
                }
            }),

            preview = new Preview();

        // ---------------------
        // - private functions -
        // ---------------------

        /**
         * Shows a closable error message above the preview.
         *
         * @param {String} message
         *  The message text.
         *
         * @param {String} [title='Error']
         *  The title of the error message. Defaults to 'Error'.
         */
        function showError(message, title) {
            win.nodes.main
                .find('.alert').remove().end()
                .prepend($.alert(title || gt('Error'), message));
        }

        /**
         * Shows an error message extracted from the error object returned by
         * a jQuery AJAX call.
         *
         * @param {Object} response
         *  Response object returned by the failed AJAX call.
         */
        function showAjaxError(response) {
            showError(response.responseText, gt('AJAX Error'));
        }

        /**
         * Shows an error message for an unhandled exception.
         *
         * @param exception
         *  The exception to be reported.
         */
        function showExceptionError(exception) {
            showError('Exception caught: ' + exception, 'Internal Error');
        }

        /**
         * Sets application title (launcher) and window title according to the
         * current file name.
         */
        function updateTitles() {
            var fileName = (file && file.filename) ? file.filename : gt('Unnamed');
            app.setTitle(fileName);
            win.setTitle(gt('OX OfficePreview') + ' - ' + fileName);
        }

        /**
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         */
        function launchHandler() {

            // create the application window
            win = ox.ui.createWindow({
                name: MODULE_NAME,
                close: true,
                search: false,
                toolbar: true
            });

            app.setWindow(win);

            win.nodes.main
                .addClass("io-ox-office-preview-main")
                .append(preview.getNode());

            // The toolkit will clear the toolbar area and insert extension
            // point links everytime the window is shown. Therefore it is
            // needed to -insert the own toolbar into the toolbar node of the
            // window in the 'show' event, and to detach it in the 'hide' event
            // (otherwise, removing the toolbar will destroy all listeners).
            win.on('show', function () {
                win.nodes.toolbar.append(toolPane);
            })
            .on('hide', function () {
                toolPane.detach();
            });

            // disable FF spell checking
            $('body').attr('spellcheck', false);
        }

        /**
         * The handler function that will be called when the application shuts
         * down.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that will be resolved if the application can be closed
         *  (either if it is unchanged, or the user has chosen to save or lose
         *  the changes), or will be rejected if the application must remain
         *  alive (user has cancelled the dialog, save operation failed).
         */
        function quitHandler() {
            var def = $.Deferred().done(app.destroy);
            def.resolve();

            return def;
        }

        /**
         * Returns the URL passed to the AJAX calls used to convert a document
         * file into an HTML document.
         */
        function getFilterUrl(action) {
            return file && (ox.apiRoot +
                '/oxodocumentfilter' +
                '?action=' + action +
                '&id=' + file.id +
                '&folder_id=' + file.folder_id +
                '&version=' + file.version +
                '&filename=' + file.filename +
                '&session=' + ox.session) +
                '&filter_format=html';
        }

        /**
         * loading the document from the filestore as HTML
         */
        function importHTML(response) {

            var def = $.Deferred();

            // big try/catch, exception handler will reject the deferred with the exception
            try {

                // check that the passed AJAX result is an object
                if (!_.isObject(response)) {
                    throw 'Missing AJAX result.';
                }

                // convert JSON result string to object (may throw)
                if (_.isString(response.data)) {
                    response.data = JSON.parse(response.data);
                }

                // check that a result object exists and contains an operations array
                if (!_.isObject(response.data) || !_.isString(response.data.HTMLPages)) {
                    throw 'Missing AJAX result data.';
                }
            } catch (ex) {
                // reject deferred on error
                return def.reject(ex);
            }

            // resolve the deferred with the preview document
            return def.resolve(response.data);
        }

        // methods ============================================================

        /**
         * Returns the infostore file descriptor of the edited document.
         */
        app.getFileDescriptor = function () {
            return file;
        };

        /**
         * Returns the preview instance.
         */
        app.getPreview = function () {
            return preview;
        };

        /**
         * Shows the application window and activates the preview.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that is resolved if the application has been made
         *  visible, or rejected if the application is in an invalid state.
         */
        app.show = function () {
            var def = $.Deferred();

            if (win && preview) {
                win.show();
                updateTitles();
                def.resolve();
            } else {
                def.reject();
            }

            return def;
        };

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the load operation.
         */
        app.load = function () {
            var def = null;

            // do not load twice (may be called repeatedly from app launcher)
            app.load = app.show;

            // do not try to load, if file descriptor is missing
            if (!file) {
                return app.show();
            }

            // show application window
            win.show().busy();
            updateTitles();

            // initialize the deferred to be returned
            def = $.Deferred().always(function () {
                win.idle();
            });

            // load the file
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument'),
                dataType: 'json'
            })
            .done(function (response) {
                importHTML(response)
                .done(function (previewDocument) {
                    preview.setPreviewDocument(previewDocument.HTMLPages);
                    def.resolve();
                })
                .fail(function (ex) {
                    showExceptionError(ex);
                    preview.setPreviewDocument(null);
                    def.reject();
                });
            })
            .fail(function (response) {
                showAjaxError(response);
                preview.setPreviewDocument(null);
                def.reject();
            });

            return def;
        };

        app.failSave = function () {
            return { module: MODULE_NAME, point: { file: file } };
        };

        app.failRestore = function (point) {
            file = _.isObject(point) ? point.file : null;
            return app.load();
        };

        /**
         * Destructs the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        app.destroy = function () {
            controller.destroy();
            toolBar.destroy();
            preview.destroy();
            app = win = preview = toolBar = controller = null;
        };

        // ------------------------------------------------
        // - initialization of createApplication function -
        // ------------------------------------------------

        toolPane.css('background', 'none').append(toolBar.getNode());

        // register view components at the controller
        controller.registerViewComponent(toolBar);

        // listen to 'showpage' events and update controller
        preview.on('showpage', function () { controller.update(); });

        return app.setLauncher(launchHandler).setQuit(quitHandler);

    } // createApplication()

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {

            var // get file descriptor from options
                file = _.isObject(options) ? options.file : null,

                // find running preview application
                running = _.isObject(file) ? ox.ui.App.get(MODULE_NAME).filter(function (app) {
                    var appFile = app.getFileDescriptor();
                    // TODO: check file version too?
                    return _.isObject(appFile) &&
                        (file.id === appFile.id) &&
                        (file.folder_id === appFile.folder_id);
                }) : [];

            return running.length ? running[0] : createApplication(options);
        }
    };

});
