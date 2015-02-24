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
define('io.ox/core/viewer/types/typefactory', [
    'io.ox/core/viewer/types/audiotype',
    'io.ox/core/viewer/types/documenttype',
    'io.ox/core/viewer/types/imagetype',
    'io.ox/core/viewer/types/videotype',
    'io.ox/core/viewer/types/defaulttype'
], function (AudioType, DocumentType, ImageType, VideoType, DefaultType) {

    /**
     * The factory for creating Viewer file type instances.
     *
     * This factory  also acts as a registry of file types that OX Viewer
     * is capable to handle.
     *
     */
    var TypeFactory = {
        /**
         * Gets the corresponding file type object for the given model object.
         *
         * @param {Object} model
         *  an OX Viewer model object.
         *
         * @returns {Object} FileType
         *  a file type object.
         */
        getModelType: function (model) {
            //console.warn('getModelType()', model.get('fileCategory'));
            var modelType = null;
            switch (model.get('fileCategory')) {
                case 'AUDIO':
                    modelType = new AudioType(model);
                    break;
                case 'VIDEO':
                    modelType = new VideoType(model);
                    break;
                case 'IMAGE':
                    modelType = new ImageType(model);
                    break;
                case 'OFFICE':
                    modelType = new DocumentType(model);
                    break;
                case 'OFFICE_TEXT':
                    modelType = new DocumentType(model);
                    break;
                case 'OFFICE_SPREADSHEET':
                    modelType = new DocumentType(model);
                    break;
                case 'OFFICE_PRESENTATION':
                    modelType = new DocumentType(model);
                    break;
                case 'PDF':
                    modelType = new DocumentType(model);
                    break;
                default:
                    modelType = new DefaultType(model);
                    break;
            }
            return modelType;
        }
    };

    return TypeFactory;

});
