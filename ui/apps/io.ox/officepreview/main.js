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

define("io.ox/officepreview/main",
    ["io.ox/officepreview/preview",
     "gettext!io.ox/office/main",
     "less!io.ox/officepreview/style.css"
    ], function (OfficePreview, gt) {

    'use strict';

    var MODULE_NAME = 'io.ox/officepreview';

    // createApplication() ====================================================

    function createApplication(options) {

        var app = ox.ui.createApp({ name: MODULE_NAME }),
            
            win = null,
            
            file = null,
        
            preview = null,
            
            pageIndicator = $("<span>").addClass("io-ox-office-preview-page-indicator").text("1"),

            firstButton = $("<button>").addClass("btn btn-primary")
            .append("<i class='icon-white icon-fast-backward'>")
            .attr("id", "firstButton")
            .on("click", function (e) {
                e.preventDefault();
                preview.firstPage();
                updateButtons();
            }),
            
            previousButton = $("<button>").addClass("btn btn-primary")
            .append("<i class='icon-white icon-step-backward'>")
            .attr("id", "previousButton")
            .on("click", function (e) {
                e.preventDefault();
                preview.previousPage();
                updateButtons();
            }),

            nextButton = $("<button>").addClass("btn btn-primary")
                .append("<i class='icon-white icon-step-forward'>")
                .attr("id", "nextButton")
                .on("click", function (e) {
                    e.preventDefault();
                    preview.nextPage();
                    updateButtons();
                }),

            lastButton = $("<button>").addClass("btn btn-primary")
            .append("<i class='icon-white icon-fast-forward'>")
                .attr("id", "lastButton")
                .on("click", function (e) {
                e.preventDefault();
                preview.lastPage();
                updateButtons();
            }),
                
            previewContainer = $('<div>').addClass('abs')
                .css({ overflow: "auto", zIndex: 2 });
        
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
            alert(title || gt('Error'), message);
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
         * Sets the application button status according to the current status
         * of the preview
         */
        function updateButtons() {
            if (preview.firstAvail()) {
                $("#firstButton").removeAttr("disabled");
            }
            else {
                $("#firstButton").attr("disabled", "disabled");
            }

            if (preview.previousAvail()) {
                $("#previousButton").removeAttr("disabled");
            }
            else {
                $("#previousButton").attr("disabled", "disabled");
            }

            if (preview.nextAvail()) {
                $("#nextButton").removeAttr("disabled");
            }
            else {
                $("#nextButton").attr("disabled", "disabled");
            }

            if (preview.lastAvail()) {
                $("#lastButton").removeAttr("disabled");
            }
            else {
                $("#lastButton").attr("disabled", "disabled");
            }
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
                .append(preview.getNode());

            win.nodes.main
                .addClass("io-ox-office-preview-background")
                .append(pageIndicator);

            // trigger all window resize handlers on 'show' events
            win.on('show', function () {
                win.nodes.toolbar
                    .append($("<div>")
                    .append(firstButton, $.txt(' '), previousButton, $.txt(' '), nextButton, $.txt(' '), lastButton))
                    .css({ left: "45%" });
                
                $(window).resize();

                // disable FF spell checking
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
                    preview.setPreviewDocument(previewDocument.HTMLPages);
                    updateButtons();
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
            $(window).off('resize', windowResizeHandler);
            app = win = preview = null;
        };

        // ------------------------------------------------
        // - initialization of createApplication function -
        // ------------------------------------------------

        preview = new OfficePreview(previewContainer);
        file = _.isObject(options) ? options.file : null;

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
