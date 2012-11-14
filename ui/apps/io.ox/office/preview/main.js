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
     'io.ox/office/tk/application',
     'io.ox/office/preview/actions',
     'io.ox/office/preview/model',
     'io.ox/office/preview/controller',
     'io.ox/office/preview/view',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, Application, Actions, PreviewModel, PreviewController, PreviewView, gt) {

    'use strict';

    // class PreviewApplication ===============================================

    function PreviewApplication(options) {

        var // self reference
            self = this,

            // the previewer model
            model = null,

            // controller as single connection point between model and view elements
            controller = null,

            // view, contains panes, tool bars, etc.
            view = null;

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
            self.getWindow().nodes.main
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
            self.getWindow().setTitle(fileName);
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
                    self.getWindow().idle();
                });

            // show application window
            self.getWindow().show(function () {
                self.getWindow().busy();
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
                        return Application.extractAjaxStringResult(response, 'HTMLPages');
                    })
                    .done(function (previewDocument) {
                        if (_.isString(previewDocument)) {
                            model.setPreviewDocument(previewDocument);
                            def.resolve();
                        } else {
                            showError(gt('An error occurred while loading the document.'), gt('Load Error'));
                            model.setPreviewDocument(null);
                            def.reject();
                        }
                    })
                    .fail(function (response) {
                        showAjaxError(response);
                        model.setPreviewDocument(null);
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
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         */
        function launchHandler() {

            // create the previewer model
            model = new PreviewModel(self);

            // create the controller
            controller = new PreviewController(self);

            // create the view (creates application window)
            view = new PreviewView(self);

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
         * Returns the previewer model instance of this preview application.
         *
         * @returns {PreviewModel}
         *  The model of this preview application.
         */
        this.getModel = function () {
            return model;
        };

        /**
         * Returns the controller of this preview application.
         *
         * @returns {PreviewController}
         *  The controller of this preview application.
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
            return { module: self.getName(), point: { file: this.getFileDescriptor() } };
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
            controller.destroy();
            model.destroy();
            view.destroy();
            model = controller = view = null;
        };

        // initialization -----------------------------------------------------

        // set launch and quit handlers
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class PreviewApplication

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return Application.getOrCreateApplication(Actions.MODULE_NAME, PreviewApplication, options);
        }
    };

});
