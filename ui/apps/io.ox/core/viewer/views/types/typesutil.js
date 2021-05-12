/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/viewer/views/types/typesutil', [
    'io.ox/core/capabilities',
    'io.ox/core/extensions'

], function (Capabilities, Ext) {

    'use strict';

    /**
     * OX Viewer types utilities.
     * Determines which file types are supported by the OX Viewer,
     * and offers file type related utility methods.
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
        txt: 'textview',
        otf: 'documentview'
    };

    var typesUtil = {

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

            if (modelType === 'spreadsheetview' && (!Capabilities.has('spreadsheet') || !this.isNativeDocumentType(model))) {
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

    return typesUtil;

});
