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
    'gettext!io.ox/core'
], function (BaseView, Ext, gt) {

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

            // in popout mode the (plugged) documents app needs to be quit before the popout Viewer app
            this.listenTo(this.viewerEvents, 'viewer:beforeclose', this.onDispose);
        },

        /**
         * Invokes the passed callback immediately, if the wrapped spreadsheet
         * application is valid (exists, and is not shutting down).
         *
         * @param {(this: SpreadsheetView, app: SpreadsheetApplication) => void} callback
         *  The callback to be invoked with the valid spreadsheet application
         *  instance as first parameter.
         */
        withValidApp: function (callback) {
            if (!this.disposed && this.spreadsheetApp && this.spreadsheetApp.isInQuit && !this.spreadsheetApp.isInQuit()) {
                callback.call(this, this.spreadsheetApp);
            }
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
         * @param {Object} [options]
         *  Optional parameters:
         *  - {Number} [options.priority]
         *      The prefetch priority.
         *
         * @returns {SpreadsheetView}
         *  A reference to this instance.
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

            function launchApplication(model) {

                // fail safety: check for early exit of the viewer
                if (self.disposed) { return $.Deferred().reject(); }

                // invoke the extension point to launch the embedded spreadsheet application
                var point = Ext.point('io.ox/office/spreadsheet/viewer/load/drive');
                var baton = new Ext.Baton({ data: model, page: self.documentContainer });
                var result = point.invoke('launch', self, baton);

                // `point.invoke()` returns an array of promises
                return (result && _.isArray(result._wrapped)) ? result._wrapped[0] : $.Deferred().reject();
            }

            function onLaunchSuccess() {

                // the spreadsheet application instance is passed as calling context
                var docsApp = self.spreadsheetApp = this;
                // hide busy spinner
                if (!self.disposed) { self.$el.idle(); }

                // wait until the Documents part (class `BaseApplication` and beyond) is added to the app
                docsApp.onInit(function () {

                    function listenToWithValidApp(source, type, callback) {
                        docsApp.waitForImportSuccess(function () {
                            self.listenTo(source, type, self.withValidApp.bind(self, callback));
                        });
                    }

                    // register event handlers
                    listenToWithValidApp(self.viewerEvents, 'viewer:resize', function () { docsApp.getView().refreshPaneLayout(); });
                    listenToWithValidApp(self.viewerEvents, 'viewer:zoom:in', function () { docsApp.getController().executeItem('view/zoom/inc'); });
                    listenToWithValidApp(self.viewerEvents, 'viewer:zoom:out', function () { docsApp.getController().executeItem('view/zoom/dec'); });

                    // ensure that the wrapped spreadsheet application window is shown along with the Preview app window
                    if (self.app) {
                        listenToWithValidApp(self.app.getWindow(), 'show', function () {
                            docsApp.getWindow().show(null, true);
                        });
                    }

                    // ensure that the Preview app window is hidden along with the wrapped spreadsheet application window
                    docsApp.getWindow().on('hide', function () {
                        if (self.app && !self.disposed) { self.app.getWindow().hide(); }
                    });

                    // show error message if importing the document fails
                    docsApp.waitForImportFailure(function (_finished, error) {
                        self.showLoadError(error.message);
                    });
                });
            }

            // show busy spinner
            this.$el.busy();
            // clear previous timeout
            if (this.appLaunchDelayId) { window.clearTimeout(this.appLaunchDelayId); }
            // init spreadsheet app launch delay timer
            this.appLaunchDelayId = window.setTimeout(function () {
                self.appLaunchDelayId = null;

                launchApplication(self.model).then(onLaunchSuccess, self.showLoadError.bind(self));

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
            this.withValidApp(function (app) {
                app.quit().then(function () {
                    self.spreadsheetApp = null;
                });
            });

            this.isPrefetched = false;

            return this;
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            this.unload();
            this.off().stopListening();
            this.disposed = true;
            this.documentContainer = null;
        }

    });

    // returns an object which inherits BaseView
    return SpreadsheetView;
});
