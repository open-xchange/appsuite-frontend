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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/main',
    ['io.ox/office/tk/utils',
     'io.ox/office/framework/app/baseapplication',
     'io.ox/office/framework/app/toolbaractions',
     'io.ox/office/framework/app/extensionregistry',
     'io.ox/office/preview/model/model',
     'io.ox/office/preview/view/view',
     'io.ox/office/preview/app/controller',
     'gettext!io.ox/office/main'
    ], function (Utils, BaseApplication, ToolBarActions, ExtensionRegistry, PreviewModel, PreviewView, PreviewController, gt) {

    'use strict';

    var // the module name of this application
        MODULE_NAME = 'io.ox/office/preview';

    // class PreviewApplication ===============================================

    /**
     * The OX Preview application used to view a wide range of document types.
     *
     * @constructor
     *
     * @extends BaseApplication
     *
     * @param {Object} [appOptions]
     *  A map of static application options, that have been passed to the
     *  static method BaseApplication.createLauncher().
     *
     * @param {Object} [launchOptions]
     *  A map of options to control the properties of the application. Supports
     *  all options supported by the base class BaseApplication.
     */
    var PreviewApplication = BaseApplication.extend({ constructor: function (appOptions, launchOptions) {

        var // self reference
            self = this,

            // the unique job identifier to be used for page requests
            jobId = null;

        // base constructor ---------------------------------------------------

        BaseApplication.call(this, PreviewModel, PreviewView, PreviewController, importDocument, appOptions, launchOptions);

        // private methods ----------------------------------------------------

        /**
         * Loads the first page of the document described in the current file
         * descriptor.
         *
         * @param {Object} [point]
         *  The save point, if called from fail-restore.
         *
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved when the
         *  initial data of the preview document has been loaded; or rejected
         *  when an error has occurred.
         */
        function importDocument(point) {

            // disable drop events
            self.getWindowNode().on('drop dragstart dragover', false);

            // insert own content into the busy blocker element
            self.getView().enterBusy(function (header, footer) {

                // add file name to header area
                header.append($('<div>').addClass('filename clear-title').text(self.getFullFileName()));

                // show Cancel button after a short delay
                self.executeDelayed(function () {
                    footer.append($('<div>').append(
                        $.button({ label: gt('Cancel') })
                            .addClass('btn-warning')
                            .on('click', function () { self.quit(); })
                    ));
                }, { delay: 3000 });
            });

            // load the file
            return self.sendConverterRequest({
                params: {
                    action: 'convertdocument',
                    convert_format: 'html',
                    convert_action: 'beginconvert'
                }
            })
            .then(function (data) {
                var def = $.Deferred(),
                    loadError = !_.isNumber(data.JobID) || (data.JobID <= 0) || !_.isNumber(data.PageCount) || (data.PageCount <= 0);

                if (loadError) {
                    var cause = Utils.getStringOption(data, 'cause', '');

                    if (cause === 'passwordProtected') {
                        _.extend(data, {message: gt('The document is password protected.')});
                    }
                }

                return (loadError ? def.reject(data) : def.resolve(data));
            })
            .done(function (data) {
                jobId = data.JobID;
                self.getModel().setPageCount(data.PageCount);
            })
            .promise();
        }

        /**
         * Sends a close notification to the server, before the application
         * will be really closed.
         */
        function quitHandler() {
            self.sendPreviewRequest({ params: { convert_action: 'endconvert' } });
        }

        // methods ------------------------------------------------------------

        this.sendPreviewRequest = function (options) {
            return _.isNumber(jobId) ? this.sendConverterRequest(Utils.extendOptions({
                params: { action: 'convertdocument', job_id: jobId }
            }, options)) : $.Deferred().reject();
        };

        this.getPreviewModuleUrl = function (options) {
            return _.isNumber(jobId) ? this.getConverterModuleUrl(Utils.extendOptions({
                action: 'convertdocument',
                job_id: jobId
            }, options)) : undefined;
        };

        /**
         * Returns whether the current document can be edited with one of the
         * OX Document edit applications.
         */
        this.isDocumentEditable = function () {
            // TODO: edit mail attachments and task attachments
            return _.isNumber(jobId) && (!('source' in this.getFileDescriptor())) && ExtensionRegistry.isEditable(this.getFullFileName());
        };

        /**
         * Launches the appropriate OX Document edit applications for the
         * current document.
         */
        this.editDocument = function () {

            var // the file descriptor of the current document
                file = this.getFileDescriptor(),
                // the configuration of the file extension of the current document
                extensionSettings = this.isDocumentEditable() ? ExtensionRegistry.getExtensionSettings(this.getFullFileName()) : null,
                // the edit application module identifier
                editModule = Utils.getStringOption(extensionSettings, 'module', '');

            // TODO: edit mail attachments and task attachments
            if (editModule.length > 0) {

                // launch the correct edit application
                if (ExtensionRegistry.isNative(this.getFullFileName())) {
                    ox.launch(editModule + '/main', { action: 'load', file: file });
                } else if (ExtensionRegistry.isConvertible(this.getFullFileName())) {
                    ox.launch(editModule + '/main', { action: 'convert', folderId: file.folder_id, templateFile: file, preserveFileName: true });
                } else {
                    Utils.error('PreviewApplication.editDocument(): unknown document type');
                    return;
                }

                // close this application
                _.defer(function () { self.quit(); });
            }
        };

        // initialization -----------------------------------------------------

        // fail-save handler returns data needed to restore the application after browser refresh
        this.registerQuitHandler(quitHandler)
            .registerFailSaveHandler(function () { return self.getView().getSavePoint(); });

    }}); // class PreviewApplication

    // static initialization ==================================================

    ToolBarActions.createDownloadIcon(MODULE_NAME);
    ToolBarActions.createPrintIcon(MODULE_NAME);
    ToolBarActions.createMailIcon(MODULE_NAME);

    // exports ================================================================

    return BaseApplication.createLauncher(MODULE_NAME, PreviewApplication);

});
