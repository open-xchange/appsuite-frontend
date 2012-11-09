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

define('io.ox/office/preview/main',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/apphelper',
     'io.ox/office/tk/controller',
     'io.ox/office/tk/component/appwindowtoolbar',
     'io.ox/office/preview/preview',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, AppHelper, Controller, AppWindowToolBar, Preview, gt) {

    'use strict';

    var MODULE_NAME = 'io.ox/office/preview';

    // class Application ======================================================

    function Application(options) {

        var // self reference
            self = this,

            // the application window
            win = null,

            // the previewer (model)
            preview = new Preview(),

            // the controller
            controller = new Controller({

                    'file/quit': {
                        set: function () { window.setTimeout(function () { self.quit(); }); }
                    },

                    'pages/first': {
                        enable: function () { return preview.getPage() > 1; },
                        set: function () { preview.firstPage(); }
                    },
                    'pages/previous': {
                        enable: function () { return preview.getPage() > 1; },
                        set: function () { preview.previousPage(); }
                    },
                    'pages/next': {
                        enable: function () { return preview.getPage() < preview.getPageCount(); },
                        set: function () { preview.nextPage(); }
                    },
                    'pages/last': {
                        enable: function () { return preview.getPage() < preview.getPageCount(); },
                        set: function () { preview.lastPage(); }
                    },

                    'pages/current': {
                        enable: function () { return false; },
                        get: function () {
                            // the gettext comments MUST be located directly before gt(), but
                            // 'return' cannot be the last token in a line
                            // -> use a temporary variable to store the result
                            var label =
                                //#. %1$s is the current page index in office document preview
                                //#. %2$s is the number of pages in office document preview
                                //#, c-format
                                gt('%1$s of %2$s', preview.getPage(), preview.getPageCount());
                            return label;
                        }
                    }

                });

        // private methods ----------------------------------------------------

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
            var file = self.getFileDescriptor(),
                fileName = (file && file.filename) ? file.filename : gt('Unnamed');
            self.setTitle(fileName);
            win.setTitle(fileName);
        }

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred that reflects the result of the load
         *  operation.
         */
        function loadAndShow() {

            var // initialize the deferred to be returned
                def = $.Deferred().always(function () {
                    win.idle();
                });

            // show application window
            // show application window
            win.show(function () {
                win.busy();
                updateTitles();

                // do not try to load, if file descriptor is missing
                if (self.hasFileDescriptor()) {

                    // load the file
                    $.ajax({
                        type: 'GET',
                        url: self.getDocumentFilterUrl('importdocument', { filter_format: 'html' }),
                        dataType: 'json'
                    })
                    .pipe(function (response) {
                        return AppHelper.extractAjaxStringResult(response, 'HTMLPages');
                    })
                    .done(function (previewDocument) {
                        if (_.isString(previewDocument)) {
                            preview.setPreviewDocument(previewDocument);
                            def.resolve();
                        } else {
                            showError(gt('An error occurred while loading the document.'), gt('Load Error'));
                            preview.setPreviewDocument(null);
                            def.reject();
                        }
                    })
                    .fail(function (response) {
                        showAjaxError(response);
                        preview.setPreviewDocument(null);
                        def.reject();
                    });

                } else {
                    // no file descriptor (restored from save point): just show an empty application
                    def.resolve();
                }
            });

            return def.promise();
        }

        /**
         * Handles resize events of the browser window, and adjusts the size of
         * the application pane node.
         */
        function windowResizeHandler(event) {
            win.nodes.appPane.height(window.innerHeight - win.nodes.appPane.offset().top);
        }

        /**
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         */
        function launchHandler() {

            // create the application window
            win = ox.ui.createWindow({
                name: MODULE_NAME,
                classic: true,
                search: false,
                toolbar: true
            });
            self.setWindow(win);

            win.nodes.appPane = $('<div>').addClass('io-ox-pane apppane').append(preview.getNode());
            win.nodes.main.addClass('io-ox-office-preview-main').append(win.nodes.appPane);

            // register a component that updates the window header tool bar
            controller.registerViewComponent(new AppWindowToolBar(win));

            // update all view components every time the window will be shown
            win.on('show', function () { controller.update(); });

            // listen to browser window resize events when the OX window is visible
            Utils.registerWindowResizeHandler(win, windowResizeHandler);

            // disable FF spell checking
            $('body').attr('spellcheck', false);

            // load the file
            return loadAndShow();
        }

        /**
         * The handler function that will be called when the application shuts
         * down.
         */
        function quitHandler() {
            self.destroy();
            return $.when();
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the preview instance.
         */
        this.getPreview = function () {
            return preview;
        };

        /**
         * Returns the controller.
         */
        this.getController = function () {
            return controller;
        };

        /**
         * Will be called automatically from the OX framework to create and
         * return a restore point containing the current state of the
         * application.
         *
         * @return {Object}
         *  The restore point containing the application state.
         */
        this.failSave = function () {
            return { module: MODULE_NAME, point: { file: this.getFileDescriptor() } };
        };

        /**
         * Will be called automatically from the OX framework to restore the
         * state of the application after a browser refresh.
         *
         * @param {Object} point
         *  The restore point containing the application state.
         */
        this.failRestore = function (point) {
            this.setFileDescriptor(Utils.getObjectOption(point, 'file'));
            return loadAndShow();
        };

        /**
         * Destroys the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        this.destroy = function () {
            preview.destroy();
            win = preview = null;
        };

        // initialization -----------------------------------------------------

        // listen to 'showpage' events and update all GUI elements
        preview.on('showpage', function () { controller.update(); });

        // set launch and quit handlers
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class Application

    // global initialization --------------------------------------------------

    AppHelper.configureWindowToolBar(MODULE_NAME)
        .addButtonGroup('pages')
            .addButton('pages/first', { icon: 'icon-fast-backward' })
            .addButton('pages/previous', { icon: 'icon-chevron-left' })
            .addLabel('pages/current', { width: 100 })
            .addButton('pages/next', { icon: 'icon-chevron-right' })
            .addButton('pages/last', { icon: 'icon-fast-forward' })
            .end()
        .addButtonGroup('quit')
            .addButton('file/quit', { label: gt('Close') })
            .end();

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return AppHelper.getOrCreateApplication(MODULE_NAME, Application, options);
        }
    };

});
