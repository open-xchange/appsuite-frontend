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
    ['io.ox/core/extensions',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/app/officeapplication',
     'io.ox/office/preview/model',
     'io.ox/office/preview/view',
     'io.ox/office/preview/controller',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (ext, Utils, OfficeApplication, PreviewModel, PreviewView, PreviewController, gt) {

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
            jobId = null;

        // base constructor ---------------------------------------------------

        OfficeApplication.call(this, PreviewModel, PreviewView, PreviewController, importDocument, launchOptions);

        // private methods ----------------------------------------------------

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
            self.registerEventHandler(window, 'unload', function () { self.sendCloseNotification(); });

            // load the file
            return self.sendConverterRequest({
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
                self.getModel().setPageCount(data.PageCount);
                self.getView().restoreFromSavePoint(point);
            })
            .promise();
        }

        // methods ------------------------------------------------------------

        this.sendPreviewRequest = function (options) {
            return _.isNumber(jobId) ? this.sendConverterRequest(Utils.extendOptions({
                params: { action: 'convertdocument', job_id: jobId }
            }, options)) : $.Deferred().reject();
        };

        /**
         * Sends a close notification to the server, when the application has
         * been closed.
         */
        this.sendCloseNotification = function () {
            this.sendPreviewRequest({ params: { convert_action: 'endconvert' } });
        };

        // initialization -----------------------------------------------------

        // fail-save handler returns data needed to restore the application after browser refresh
        this.registerFailSaveHandler(function () { return self.getView().getSavePoint(); });

        // send notification to server on quit
        this.on('docs:quit', function () { self.sendCloseNotification(); });

    }}); // class PreviewApplication

    // global initialization ==================================================

    // listen to user logout and notify all running applications
    ext.point("io.ox/core/logout").extend({
        id: 'office-logout',
        logout: function () {
            _(ox.ui.App.get('io.ox/office/preview')).invoke('sendCloseNotification');
            return $.when();
        }
    });

    // exports ================================================================

    return OfficeApplication.createLauncher('io.ox/office/preview', PreviewApplication);

});
