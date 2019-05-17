/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/typesregistry', [
    'io.ox/core/capabilities',
    'io.ox/core/extensions'
], function (Capabilities, Ext) {

    'use strict';

    /**
     * A central registry of file types which are supported by OX Viewer.
     * This registry Also offers file type related methods.
     */

    // a map of supported file types to their implementations
    var typesMap = {
        image: 'imageview',
        doc: 'documentview',
        xls: 'spreadsheetview',
        ppt: 'documentview',
        pdf: 'documentview',
        audio: 'audioview',
        vcf: 'contactview',
        video: 'videoview',
        txt: 'textview'
    };

    var typesRegistry = {

        /**
         * Gets the corresponding file type string for the given model object.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {String}
         *  the file type string.
         */
        getTypeString: function (model) {
            if (!model) { return 'defaultview'; }

            var modelType = typesMap[(model.isEncrypted() ? model.getGuardType() : model.getFileType())] || 'defaultview';

            /**
             *  +++ ... temporary bugfix for assigning mail-compose spreadsheet-attachments
             *      to the viewers 'documentview' mode via "documentconverter" ... +++
             *
             *  - This temporarily (intended just for release 7.10.2 ) fixes Bug #63315
             *    ... "Due to new Mail Compose API: Preview for attached documents fails"
             *    [https://bugs.open-xchange.com/show_bug.cgi?id=63315]
             *
             *  - TODO: ... there has to be another follow-up fix for Bug #64002
             *          ... "Cannot fetch spreadsheet preview for mail compose attachments"
             *          ... [https://bugs.open-xchange.com/show_bug.cgi?id=64002]
             *
             *          - once the api can be used reliably, reactivate the commented line (2 lines beneath).
             */
            // if (modelType === 'spreadsheetview' && (!Capabilities.has('spreadsheet') || !this.isNativeDocumentType(model))) {
            if (modelType === 'spreadsheetview' && (!Capabilities.has('spreadsheet') || !this.isNativeDocumentType(model) || model.isComposeAttachment())) {
                modelType = 'documentview';
            }

            if (modelType === 'documentview' && !Capabilities.has('document_preview')) {
                modelType = 'defaultview';
            }

            // item without file?
            if (model.isEmptyFile()) {
                modelType = 'descriptionview';
            }

            // special check for nested messages
            if (model.isMailAttachment() && model.get('file_mimetype') === 'message/rfc822') {
                modelType = 'mailview';
            }

            //FIXME: special handling for contact details. Not possible in most contexts, but if all data is available.
            //if file_mimetype is set, we are dealing with a file, not an actual contact
            if (modelType === 'contactview' && (model.get('file_mimetype') || '').indexOf('text/vcard') >= 0) {
                modelType = 'defaultview';
            }

            return modelType;
        },

        /**
         * Gets the corresponding file type object for the given model object.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {jQuery.Promise}
         *  a Promise of a Deferred object that will be resolved with the
         *  file type object it could be required; or rejected, in case of an error.
         */
        getModelType: function (model) {
            return require(['io.ox/core/viewer/views/types/' + this.getTypeString(model)]);
        },

        /**
         * Returns true if the Viewer is able to display the data of the given model.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Boolean}
         *  Whether the Viewer is able to display the data of the given model.
         */
        canView: function (model) {
            return (this.getTypeString(model) !== 'defaultview');
        },

        /**
         * Returns true if the model represents a document file type.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Boolean}
         *  Whether the model represents a document file type.
         */
        isDocumentType: function (model) {
            return (this.getTypeString(model) === 'documentview');
        },

        /**
         * Returns true if the model represents a spreadsheet file type.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Boolean}
         *  Whether the model represents a spreadsheet file type.
         */
        isSpreadsheetType: function (model) {
            return (this.getTypeString(model) === 'spreadsheetview');
        },

        /**
         * Returns true when at least one of the OX Document application is avaiable.
         *
         * @returns {Boolean}
         *  Whether at least one OX Document application is avaiable.
         */
        isOfficeAvailable: function () {
            return (Capabilities.has('text') || Capabilities.has('presentation') || Capabilities.has('spreadsheet'));
        },

        /**
         * If at least one OX Documents application is available, returns whether
         * the model represents a native document that needs no further conversion.
         * Otherwise returns false.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Boolean}
         *  Whether the model represents a native OX Documents file.
         */
        isNativeDocumentType: function (model) {

            // Ext.point.invoke returns an array of results
            function getBooleanFromInvokeResult(invokeResult) {
                return (invokeResult && _.isArray(invokeResult._wrapped)) ? invokeResult._wrapped[0] : false;
            }

            if (!this.isOfficeAvailable()) { return false; }

            var baton = new Ext.Baton({ data: model });
            var invokeResult = Ext.point('io.ox/office/extensionregistry').invoke('isNative', null, baton);

            return getBooleanFromInvokeResult(invokeResult);
        }

    };

    return typesRegistry;

});
