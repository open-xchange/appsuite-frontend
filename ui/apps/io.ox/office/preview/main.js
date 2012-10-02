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
     'io.ox/office/tk/component/topbar',
     'io.ox/office/preview/preview',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, AppHelper, Controller, TopBar, Preview, gt) {

    'use strict';

    var MODULE_NAME = 'io.ox/office/preview';

    // class Application ======================================================

    function Application(options) {

        var // self reference
            self = this,

            win = null,

            preview = new Preview(),

            topBar = null,

            controller = new Controller({
                page: {
                    enable: function () { return preview.getPageCount() > 0; },
                    get: function () {
                        // the gettext comments MUST be located directly before
                        // gt(), but 'return' cannot be the last token in a line
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
            win.setTitle(gt('Preview') + ' - ' + fileName);
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
            self.setWindow(win);

            win.nodes.main
                .addClass('io-ox-office-preview-main')
                .append(preview.getNode());

            // create the top tool bar
            topBar = new TopBar(win)
                .addButton('first', { icon: 'icon-fast-backward', whiteIcon: true, tooltip: gt('First page') })
                .addButton('previous', { icon: 'icon-step-backward', whiteIcon: true, tooltip: gt('Previous page') })
                .addLabel('page', { tooltip: gt('Page number') })
                .addButton('next', { icon: 'icon-step-forward', whiteIcon: true, tooltip: gt('Next page') })
                .addButton('last', { icon: 'icon-fast-forward', whiteIcon: true, tooltip: gt('Last page') });

            // register view components at the controller
            controller.registerViewComponent(topBar);

            // disable FF spell checking
            $('body').attr('spellcheck', false);
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
         * Shows the application window and activates the preview.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that is resolved if the application has been made
         *  visible, or rejected if the application is in an invalid state.
         */
        this.show = function () {

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
        this.load = function () {

            var def = null;

            // do not load twice (may be called repeatedly from app launcher)
            this.load = this.show;

            // do not try to load, if file descriptor is missing
            if (!this.hasFileDescriptor()) {
                return this.show();
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
                url: this.getDocumentFilterUrl('importdocument', { filter_format: 'html' }),
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

            return def;
        };

        this.failSave = function () {
            return { module: MODULE_NAME, point: { file: this.getFileDescriptor() } };
        };

        this.failRestore = function (point) {
            this.setFileDescriptor(Utils.getObjectOption(point, 'file'));
            return this.load();
        };

        /**
         * Destroys the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        this.destroy = function () {
            controller.destroy();
            topBar.destroy();
            preview.destroy();
            win = preview = topBar = controller = null;
        };

        // initialization -----------------------------------------------------

        // listen to 'showpage' events and update controller
        preview.on('showpage', function () { controller.update(); });

        // set launch and quit handlers
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class Application

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return AppHelper.getOrCreateApplication(MODULE_NAME, Application, options);
        }
    };

});
