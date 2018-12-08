/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/spreadsheetview', [
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/files/api',
    'settings!io.ox/files',
    'gettext!io.ox/core'
], function (BaseView, Ext, Capabilities, FilesAPI, Settings, gt) {

    'use strict';

    // The delay between invoking show() and launching the Spreadsheet app
    var APP_LAUNCH_DELAY = 500;
    // The delay for the prefetch call to the REST service
    var PREFETCH_DELAY = 1000;
    // The name of the document filter server module.
    var FILTER_MODULE_NAME  = 'oxodocumentfilter';

    /**
     * The spreadsheet file type.
     * Uses OX Spreadsheet to display the spreadsheet preview.
     * Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function prefetch();
     *    function show();
     *    function unload();
     * }
     *
     */
    var SpreadsheetView = BaseView.extend({

        initialize: function (options) {
            _.extend(this, options);

            this.isPrefetched = false;
            this.documentContainer = null;
            this.appLaunchDelayId = null;
            this.spreadsheetApp = null;
            this.tempFileModel = null;

            // bind resize and zoom handler
            this.listenTo(this.viewerEvents, 'viewer:resize', this.onResize);
            this.listenTo(this.viewerEvents, 'viewer:zoom:in', this.onZoomIn);
            this.listenTo(this.viewerEvents, 'viewer:zoom:out', this.onZoomOut);

            // bind stand alone mode handlers
            if (this.app) {
                this.app.getWindow().on('show', this.onPreviewWindowShow.bind(this));
            }
        },

        /**
         * Resize handler of the spreadsheet view.
         */
        onResize: function () {
            if (!this.spreadsheetApp || !_.isFunction(this.spreadsheetApp.getImportFinishPromise) || !this.isVisible()) { return; }

            this.spreadsheetApp.getImportFinishPromise().done(function () {
                this.spreadsheetApp.getView().refreshPaneLayout();
            }.bind(this));
        },

        /**
         * Handles zoom-in event.
         */
        onZoomIn: function () {
            if (!this.spreadsheetApp || !this.isVisible()) { return; }

            this.spreadsheetApp.getImportFinishPromise().done(function () {
                this.spreadsheetApp.getController().executeItem('view/zoom/inc');
            }.bind(this));
        },

        /**
         * Handles zoom-out event.
         */
        onZoomOut: function () {
            if (!this.spreadsheetApp || !this.isVisible()) { return; }

            this.spreadsheetApp.getImportFinishPromise().done(function () {
                this.spreadsheetApp.getController().executeItem('view/zoom/dec');
            }.bind(this));
        },

        /**
         * Handles the Preview App window show event.
         *
         * OX App Suite handles one active application and one active window.
         * In case of stand alone pcOpt SpreadsheetView consists of two active applications.
         * The preview app and the plugged spreadsheet app. It needs to be assured that
         * the Spreadsheet app window is shown along with the Preview app window.
         */
        onPreviewWindowShow: function () {
            if (this.spreadsheetApp && !this.disposed) {
                this.spreadsheetApp.getWindow().show(null, true);
            }
        },

        /**
         * Handles the Spreadsheet App window hide event.
         *
         * OX App Suite handles one active application and one active window.
         * In case of stand alone mode SpreadsheetView consists of two active applications.
         * The preview app and the plugged spreadsheet app. It needs to be assured that
         * the Preview app window is hidden along with the Spreadsheet app window.
         */
        onSpreadsheetWindowHide: function () {
            if (this.app && !this.disposed) {
                this.app.getWindow().hide();
            }
        },

        /**
         * Make sure the resulting file model is located in Drive.
         * Mail or PIM attachments are copied to a Drive temp folder.
         * Drive files are used as they are.
         *
         * @param {Object} model
         *  A Drive file, or Mail or PIM attachment model.
         *
         * @returns {jQuery.Promise}
         *  A Promise that will resolve with the resulting Drive model.
         */
        assureDriveFile: function (model) {
            return (model.isFile() ? $.when(model) : this.saveAttachmentToTempFolder(model));
        },

        /**
         * Saves a Mail or PIM attachment to a Drive temp folder
         * and returns a Promise with the model of that temp file.
         *
         * @param {Object} model
         *  A Drive file, or Mail or PIM attachment model.
         *
         * @returns {jQuery.Promise}
         *  A Promise that will resolve with the resulting Drive model.
         */
        saveAttachmentToTempFolder: function (model) {
            // the id of the target folder in Drive
            var targetFolderId = String(Settings.get('folder/trash'));
            var self = this;
            var promise = null;

            if (model.isPIMAttachment()) {
                // lazy load attachment API
                promise = require(['io.ox/core/api/attachment']);

                // save attachment to Drive temp folder
                promise = promise.then(function (AttachmentAPI) {
                    return (self.disposed) ? $.Deferred().reject() : AttachmentAPI.save(model.get('origData'), targetFolderId);
                });

                // get complete model data
                promise = promise.then(function (fileId) {
                    return FilesAPI.get({ id: fileId, folder_id: targetFolderId });
                });

            } else if (model.isMailAttachment()) {
                // lazy load mail API
                promise = require(['io.ox/mail/api']);

                // save attachment to Drive temp folder
                promise = promise.then(function (MailApi) {
                    return (self.disposed) ? $.Deferred().reject() : MailApi.saveAttachments(model.get('origData'), targetFolderId);
                });

                // get complete model data
                promise = promise.then(function (result) {
                    var file = (result && result[0] && result[0].data) || {};
                    return FilesAPI.get({ id: file.id, folder_id: file.folder_id });
                });

            } else {
                promise = $.Deferred().reject(model);
            }

            // get file model instance and store it
            promise = promise.then(function (file) {
                self.tempFileModel = FilesAPI.pool.get('detail').get(_.cid(file)) || null;
                return self.tempFileModel;
            });

            return promise;
        },

        /**
         * Delete the temp file if it exists.
         *
         * @returns {Deferred}
         */
        deleteTempFile: function () {
            if (!this.tempFileModel) { return $.when(); }
            return FilesAPI.remove([this.tempFileModel.toJSON()], true).then(function () { this.tempFileModel = null; }.bind(this));
        },

        /**
         * Displays an error notification
         *
         * @param {String} [message]
         *  The error message to show.
         */
        showLoadError: function (message) {
            if (this.disposed) { return; }

            this.displayDownloadNotification(message || gt('An error occurred loading the document so it cannot be displayed.'));
            this.documentContainer = null;
        },

        /**
         * Creates and renders the spreadsheet slide.
         *
         * @returns {SpreadsheetView}
         *  the SpreadsheetView instance.
         */
        render: function () {
            this.documentContainer = $('<div class="viewer-document-container viewer-displayer-spreadsheet marsupilami">');

            this.$el.empty().append(this.documentContainer);

            return this;
        },

        /**
         * "Prefetches" the spreadsheet slide.
         * In order to save memory and network bandwidth only documents with highest prefetch priority are prefetched.
         *
         * @param {Object} options
         *  Additional options
         *  @param {Number} options.priority
         *      The prefetch priority.
         *
         * @returns {SpreadsheetView}
         *  the SpreadsheetView instance.
         */
        prefetch: function (options) {
            // check for highest priority and Drive files only
            if (options && options.priority === 1 && !this.disposed && this.model.isFile()) {
                // the params for the prefetch call to the REST service
                var params = { action: 'getoperations', subaction: 'prefetch', session: ox.session, id: this.model.get('id'), folder_id: this.model.get('folder_id') };
                // the resulting URL
                var url = ox.apiRoot + '/' + FILTER_MODULE_NAME + '?' + _.map(params, function (value, name) { return name + '=' + encodeURIComponent(value); }).join('&');

                _.delay(function () {

                    $.ajax({
                        url: url,
                        dataType: 'text'
                    });

                }, PREFETCH_DELAY);

                this.isPrefetched = true;
            }
            return this;
        },

        /**
         * "Shows" the spreadsheet slide.
         *
         * @returns {SpreadsheetView}
         *  the SpreadsheetView instance.
         */
        show: function () {

            var self = this;

            // check if documentContainer has been replaced with an error node
            if (!this.documentContainer) { return; }

            // ignore already loaded documents
            if (this.documentContainer.children().length > 0) { return; }

            function getPromiseFromInvokeResult(invokeResult) {
                return (invokeResult && _.isArray(invokeResult._wrapped)) ? invokeResult._wrapped[0] : $.Deferred().reject();
            }

            function launchApplication(model) {
                // make sure mail and PIM attachments are saved into a Drive temp folder
                var promise = self.assureDriveFile(model);

                // launch Spreadsheet application
                promise = promise.then(function (model) {

                    var baton = new Ext.Baton({
                        data: model,
                        viewnode: self.documentContainer
                    });

                    if (self.disposed) { return $.Deferred().reject(); }

                    // Ext.point.invoke returns an array of promises
                    var invokeResult = Ext.point('spreadsheet/viewer-mode/load/drive').invoke('launchApplication', self, baton);
                    return getPromiseFromInvokeResult(invokeResult);
                });

                return promise;
            }

            function onLoadSuccess() {
                // call counter to avoid endless looping
                var callCounter = 0;
                // the Spreadsheet app instance is returned as context
                self.spreadsheetApp = this;
                // bind Spreadsheet app window hide handler
                self.spreadsheetApp.getWindow().on('hide', self.onSpreadsheetWindowHide.bind(self));
                // hide busy spinner
                if (!self.disposed) { self.$el.idle(); }

                // wait until the Documents part is added to the app
                function lazySetDocumentImportFailHandler() {
                    if (_.isFunction(self.spreadsheetApp.getImportFinishPromise)) {
                        self.spreadsheetApp.getImportFinishPromise().fail(function (error) {
                            self.showLoadError(error.message);
                        });

                    } else if (!_.isFunction(self.spreadsheetApp.getImportFinishPromise) && (callCounter < 100)) {
                        callCounter++;
                        _.delay(lazySetDocumentImportFailHandler, 100);

                    } else {
                        self.showLoadError();
                    }
                }

                lazySetDocumentImportFailHandler();
            }

            // show busy spinner
            this.$el.busy();
            // clear previous timeout
            if (this.appLaunchDelayId) { window.clearTimeout(this.appLaunchDelayId); }
            // init spreadsheet app launch delay timer
            this.appLaunchDelayId = window.setTimeout(function () {
                self.appLaunchDelayId = null;

                launchApplication(self.model).then(onLoadSuccess, self.showLoadError.bind(self));

            }, APP_LAUNCH_DELAY);

            return this;
        },

        /**
         * "Unloads" the spreadsheet slide.
         *
         * @returns {SpreadsheetView}
         *  the SpreadsheetView instance.
         */
        unload: function () {

            var self = this;

            // reset launch delay timer
            if (this.appLaunchDelayId) {
                window.clearTimeout(this.appLaunchDelayId);
                this.appLaunchDelayId = null;
            }

            // quit app if running
            if (this.spreadsheetApp && _.isFunction(this.spreadsheetApp.isInQuit) && !this.spreadsheetApp.isInQuit()) {

                this.spreadsheetApp.quit().then(function () {
                    self.spreadsheetApp = null;
                });

            }

            // delete temp file if one has been created
            this.deleteTempFile();

            this.isPrefetched = false;

            return this;
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            this.unload(true);
            this.$el.off();
            this.documentContainer = null;
        }

    });

    // returns an object which inherits BaseView
    return SpreadsheetView;
});
