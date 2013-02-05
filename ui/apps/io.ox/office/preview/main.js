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

        OfficeApplication.call(this, PreviewModel, PreviewView, PreviewController, importDocument, launchOptions);

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
            self.sendDocumentConverterRequest({
                params: {
                    action: 'convertdocument',
                    job_id: jobId,
                    convert_format: 'html',
                    convert_action: 'getpage',
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
                self.getView().showError(gt('Load Error'), gt('An error occurred while loading the page.'), { closeable: true });
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
         * Loads the first page of the document described in the current file
         * descriptor.
         *
         * @param {Object} [point]
         *  The save point if called from fail-restore.
         *
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved when the
         *  initial data of the preview document has been loaded; or rejected
         *  when an error has occurred.
         */
        function importDocument(point) {

            // disable drop events
            self.getWindowNode().on('drop dragstart dragover', false);

            // disable FF spell checking
            $('body').attr('spellcheck', false);

            // wait for unload events and send notification to server
            self.registerEventHandler(window, 'unload', sendCloseNotification);

            // load the file
            return self.sendDocumentConverterRequest({
                params: {
                    action: 'convertdocument',
                    convert_format: 'html',
                    convert_action: 'beginconvert'
                },
                resultFilter: function (data) {
                    // check required entries, returning undefined will reject this request
                    return (_.isNumber(data.JobID) && (data.JobID > 0) && _.isNumber(data.PageCount) && (data.PageCount > 0)) ? data : undefined;
                }
            })
            .done(function (data) {

                // show a page of the document
                jobId = data.JobID;
                pageCount = data.PageCount;
                page = 0;
                showPage(Utils.getIntegerOption(point, 'page', 1));
            })
            .promise();
        }

        /**
         * Sends a close notification to the server, when the application has
         * been closed.
         */
        function sendCloseNotification() {
            if (jobId) {
                self.sendDocumentConverterRequest({
                    params: {
                        action: 'convertdocument',
                        convert_format: 'html',
                        convert_action: 'endconvert',
                        job_id: jobId
                    }
                });
            }
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

        // initialization -----------------------------------------------------

        // fail-save handler returns data needed to restore the application after browser refresh
        this.registerFailSaveHandler(function () { return { page: page }; });

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
