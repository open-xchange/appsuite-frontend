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
     'io.ox/office/tk/app/officeapplication',
     'io.ox/office/tk/app/applauncher',
     'io.ox/office/preview/model',
     'io.ox/office/preview/view',
     'io.ox/office/preview/controller',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, OfficeApplication, ApplicationLauncher, PreviewModel, PreviewView, PreviewController, gt) {

    'use strict';

    // class PreviewApplication ===============================================

    /**
     * The Preview application used to view any Office documents.
     *
     * @constructor
     *
     * @extends OfficeApplication
     */
    var PreviewApplication = OfficeApplication.extend({ constructor: function (launchOptions) {

        var // self reference
            self = this,

            // the unique job identifier to be used for page requests
            jobId = null,

            // the total page count of the document
            pageCount = 0,

            // current page index (one-based!)
            page = 0;

        // base constructor ---------------------------------------------------

        OfficeApplication.call(this, PreviewModel, PreviewView, PreviewController, launchOptions);

        // private methods ----------------------------------------------------

        function showPage(newPage) {

            var // a timeout for the window busy call
                busyTimeout = null;

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > pageCount)) {
                return;
            }
            page = newPage;

            // switch window to busy state after a short delay
            busyTimeout = window.setTimeout(function () {
                self.getWindow().busy();
                busyTimeout = null;
            }, 500);

            // load the requested page
            self.sendFilterRequest({
                params: {
                    action: 'importdocument',
                    job_id: jobId,
                    filter_format: 'html',
                    filter_action: 'getpage',
                    page_number: page
                },
                resultFilter: function (data) {
                    // extract HTML source, returning undefined will reject the entire request
                    return Utils.getStringOption(data, 'HTMLPages');
                }
            })
            .done(function (html) {
                self.getModel().renderPage(html);
            })
            .fail(function () {
                self.getView().showLoadError();
            })
            .always(function () {
                self.getController().update();
                if (busyTimeout) {
                    window.clearTimeout(busyTimeout);
                } else {
                    self.getWindow().idle();
                }
            });
        }

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @param {Number} [newPage=1]
         *  The index of the page shown after loading the document.
         *
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved always (when
         *  the initial data of the preview document has been loaded, or when
         *  an error has occurred).
         */
        function loadAndShow(newPage) {

            var // the deferred to be returned
                def = $.Deferred(),
                // the application window
                win = self.getWindow();

            // show application window
            win.show(function () {

                // no file descriptor (e.g. restored from save point): just show an empty application
                if (!self.hasFileDescriptor()) {
                    def.resolve();
                    return;
                }

                // set window to busy state
                win.busy();

                // load the file
                self.sendFilterRequest({
                    params: {
                        action: 'importdocument',
                        filter_format: 'html',
                        filter_action: 'beginconvert'
                    },
                    resultFilter: function (data) {
                        // check required entries, returning undefined will reject this request
                        return (_.isNumber(data.JobID) && (data.JobID > 0) && _.isNumber(data.PageCount) && (data.PageCount > 0)) ? data : undefined;
                    }
                })
                .done(function (data) {
                    jobId = data.JobID;
                    pageCount = data.PageCount;
                    page = 0;
                    showPage(newPage || 1);
                })
                .fail(function () {
                    self.getView().showLoadError();
                })
                .always(function () {
                    win.idle();
                    // always resolve the Deferred, as expected by ox.launch() and app.failRestore()
                    def.resolve();
                });
            });

            return def.promise();
        }

        /**
         * Sends a close notification to the server.
         */
        function sendCloseNotification() {
            if (jobId) {
                self.sendFilterRequest({
                    params: {
                        action: 'importdocument',
                        filter_format: 'html',
                        filter_action: 'endconvert',
                        job_id: jobId
                    }
                });
            }
        }

        /**
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         *
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved always (when
         *  the initial data of the preview document has been loaded, or when
         *  an error has occurred).
         */
        function launchHandler() {

            // disable dropping event in view-mode
            self.getWindowNode().on('drop dragstart dragover', false);
            // disable FF spell checking
            $('body').attr('spellcheck', false);

            // load the file
            return loadAndShow();
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the one-based index of the page currently shown.
         */
        this.getPage = function () {
            return page;
        };

        /**
         * Returns the total number of pages contained by the current document.
         */
        this.getPageCount = function () {
            return pageCount;
        };

        /**
         * Shows the first page of the current document.
         */
        this.firstPage = function () {
            showPage(1);
        };

        /**
         * Shows the previous page of the current document.
         */
        this.previousPage = function () {
            showPage(page - 1);
        };

        /**
         * Shows the next page of the current document.
         */
        this.nextPage = function () {
            showPage(page + 1);
        };

        /**
         * Shows the last page of the current document.
         */
        this.lastPage = function () {
            showPage(pageCount);
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
            return {
                module: self.getName(),
                point: { file: this.getFileDescriptor(), page: page }
            };
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
            return loadAndShow(Utils.getIntegerOption(point, 'page'));
        };

        // initialization -----------------------------------------------------

        // set launch handler
        this.registerLaunchHandler(launchHandler);

        // send notification to server on quit
        this.on('docs:quit', sendCloseNotification);

    }}); // class PreviewApplication

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (launchOptions) {
            return ApplicationLauncher.getOrCreateApplication('io.ox/office/preview', PreviewApplication, launchOptions);
        }
    };

});
