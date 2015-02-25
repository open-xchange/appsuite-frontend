/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/types/typesregistry', [
    'io.ox/core/viewer/types/audiotype',
    'io.ox/core/viewer/types/documenttype',
    'io.ox/core/viewer/types/imagetype',
    'io.ox/core/viewer/types/videotype',
    'io.ox/core/viewer/types/defaulttype'
], function (AudioType, DocumentType, ImageType, VideoType, DefaultType) {

    /**
     * A central registry of file types which are supported by OX Viewer.
     * This registry Also offers file type related methods.
     */
    var TypesRegistry = (function () {
        // a map of supported file types to their implementations
        var typesMap = {
            IMAGE: ImageType,
            OFFICE: DocumentType,
            OFFICE_TEXT: DocumentType,
            OFFICE_SPREADSHEET: DocumentType,
            PDF: DocumentType
            //AUDIO: AudioType,
            //VIDEO: VideoType,
        };

        /**
         * Gets the corresponding file type object for the given model object.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Object} FileType
         *  a file type object.
         */
        function getModelType (model) {
            //console.warn('getModelType()', model.get('fileCategory'));
            if (!model) { return null; }
            var modelType = typesMap[model.get('fileCategory')];
            return modelType || DefaultType;
        }

        return {
            getModelType: getModelType
        };

    })();

    return TypesRegistry;

});
