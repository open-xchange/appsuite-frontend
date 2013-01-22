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
     'io.ox/office/tk/applauncher',
     'io.ox/office/preview/model',
     'io.ox/office/preview/controller',
     'io.ox/office/preview/view',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, Application, ApplicationLauncher, PreviewModel, PreviewController, PreviewView, gt) {

    'use strict';

    // class PreviewApplication ===============================================

    /**
     * @constructor
     * @extends Application
     */
    var PreviewApplication = Application.extend({ constructor: function (launchOptions) {

        var // self reference
            self = this,

            // the previewer model
            model = null,

            // controller as single connection point between model and view elements
            controller = null,

            // view, contains panes, tool bars, etc.
            view = null,

            // the unique job identifier to be used for page requests
            jobId = null,

            // the total page count of the document
            pageCount = 0,

            // current page index (one-based!)
            page = 0;

        // private methods ----------------------------------------------------

        function showPage(newPage) {

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > pageCount)) {
                return;
            }
            page = newPage;

            // load the requested page
            self.getWindow().busy();
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
                model.renderPage(html);
            })
            .fail(function () {
                view.showLoadError();
            })
            .always(function () {
                self.trigger('show:page', page);
                self.getWindow().idle();
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
         *  The promise of a deferred that reflects the result of the load
         *  operation.
         */
        function loadAndShow(newPage) {

            var // the deferred to be returned
                def = $.Deferred();

            // show application window
            self.getWindow().show(function () {
                self.getWindow().busy();

                // do not try to load, if file descriptor is missing
                if (self.hasFileDescriptor()) {
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
                        def.resolve();
                    })
                    .fail(function () {
                        def.reject();
                    });

                } else {
                    // no file descriptor (restored from save point): just show an empty application
                    def.resolve();
                }
            });

            // initialize the deferred
            return def
                .always(function () {
                    self.getWindow().idle();
                })
                .done(function () {
                    showPage(newPage || 1);
                })
                .fail(function () {
                    view.showLoadError();
                })
                .promise();
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

            // disable dropping event in view-mode
            view.getWindowMainNode().on('drop dragstart dragover', false);

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

            self.sendFilterRequest({
                params: {
                    action: 'importdocument',
                    filter_format: 'html',
                    filter_action: 'endconvert',
                    job_id: jobId
                }
            });

            self.destroy();
            return $.when();
        }

        // base constructor ---------------------------------------------------

        Application.call(this, launchOptions);

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
            return { module: self.getName(), point: { file: this.getFileDescriptor(), page: page } };
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

    }}); // class PreviewApplication

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (launchOptions) {
            return ApplicationLauncher.getOrCreateApplication('io.ox/office/preview', PreviewApplication, launchOptions);
        }
    };

});
