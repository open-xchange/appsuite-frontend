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
    'io.ox/core/viewer/types/basetype'
], function (AudioType, DocumentType, ImageType, VideoType, BaseType) {

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
            //console.warn('getModelType()', model);
            if (!model.get('fileCategory')) {
                return new BaseType();
            }
            switch (model.get('fileCategory')) {
                case 'AUDIO':
                    return new AudioType();
                case 'VIDEO':
                    return new VideoType();
                case 'IMAGE':
                    return new ImageType();
                case 'OFFICE':
                    return new DocumentType();
                default:
                    return new BaseType();
            }
        }
    };

    return TypeFactory;

});
