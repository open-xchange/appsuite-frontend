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

define('io.ox/officepreview/main',
    ['io.ox/files/api',
     'io.ox/officepreview/preview',
     'gettext!io.ox/office/main',
     'less!io.ox/officepreview/style.css'
    ], function (FilesApi, Preview, gt) {

    'use strict';

    var MODULE_NAME = 'io.ox/officepreview';

    // createApplication() ====================================================

    function createApplication(options) {

        var // OX application object
            app = ox.ui.createApp({ name: MODULE_NAME }),

            // application window
            win = null,

            // connection to infostore file
            file = null,

            // primary preview used in actions.
            preview = null;
           
        // private functions --------------------------------------------------

        function initializeApp(options) {
            file = _.isObject(options) ? options.file : null;
        }

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
            win.nodes.appPane
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

            // do not detach when hiding to keep edit selection alive
            win.detachable = true;

            // create panes and attach them to the main window
            win.nodes.main.addClass('io-ox-officepreview-main').append(
                // top pane for tool bars
                win.nodes.toolPane = $('<div>').addClass('io-ox-officepreview-page-indicator').append("<div>").text("Toolpane"),
                // main application container
                win.nodes.appPane = $('<div>').addClass('io-ox-officepreview-page').append(preview.getNode())
            );

            // update preview 'div' on window size change
            $(window).resize(windowResizeHandler);

            // trigger all window resize handlers on 'show' events
            win.on('show', function () {
                $(window).resize();
                // disable FF spell checking. TODO: better solution...
                $('body').attr('spellcheck', false);
            });
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
         * Recalculates the size of the preview frame according to the current
         * view port size.
         */
        function windowResizeHandler() {
            win.nodes.appPane.height(window.innerHeight - win.nodes.appPane.offset().top);
        }
        
        /**
         * loading the document from the filestore as HTML
         */
        function importHTML(response) {

            var // the deferred return value
                def = $.Deferred();

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
                if (!_.isObject(response.data) || !_.isArray(response.data.operations)) {
                    throw 'Missing AJAX result data.';
                }

                // check all operation objects in the array
                /*_(response.data.operations).each(function (operation) {
                    if (!_.isObject(operation) || !_.isString(operation.name)) {
                        throw 'Invalid element in operations list.';
                    }
                });
                */

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
                '&format=html';
        }
        
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
            $(window).resize();
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
                    preview.setPreviewDocument(previewDocument);
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
                preview.initDocument();
                def.reject();
            });

            return def;
        };

        app.failSave = function () {
            return { module: MODULE_NAME, point: { file: file } };
        };

        app.failRestore = function (point) {
            initializeApp(point);
            return app.load();
        };

        /**
         * Destructs the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        app.destroy = function () {
            $(window).off('resize', windowResizeHandler);
            app = win = preview = null;
        };

        // initialization -----------------------------------------------------

        // create the preview
        var classes = 'io-ox-officepreview-main',
            node = $('<div>').addClass(classes);
            
        preview = new Preview(node);
        initializeApp(options);

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
