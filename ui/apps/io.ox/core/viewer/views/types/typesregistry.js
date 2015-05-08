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
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/typesregistry', [
'io.ox/core/capabilities'
], function (Capabilities) {

    'use strict';

    /**
     * A central registry of file types which are supported by OX Viewer.
     * This registry Also offers file type related methods.
     */

    // a map of supported file types to their implementations
    var typesMap = {
        image: 'imageview',
        doc: 'documentview',
        xls: 'documentview',
        ppt: 'documentview',
        pdf: 'documentview',
        audio: 'audioview',
        video: 'videoview',
        txt: 'textview'
    };

    var typesRegistry = {

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
            if (!model) {
                return $.Deferred().reject();
            }

            var modelType = typesMap[model.getFileType()] || 'defaultview';

            if ((model.isOffice() || model.isPDF()) && !Capabilities.has('document_preview')) {
                modelType = 'defaultview';
            }

            // special check for nested messages
            if (model.isMailAttachment() && model.get('file_mimetype') === 'message/rfc822') modelType = 'mailview';

            return require(['io.ox/core/viewer/views/types/' + modelType]).then(
                function (Type) {
                    return $.Deferred().resolve(Type);
                },
                function () {
                    return $.Deferred().reject('could not require ' + modelType);
                }
            );
        }

    };

    return typesRegistry;

});
