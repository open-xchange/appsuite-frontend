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
define('io.ox/core/viewer/views/types/typesregistry', function () {

    // a map of supported file types to their implementations
    var typesMap = {
            IMAGE: 'imageview',
            OFFICE: 'documentview',
            OFFICE_TEXT: 'documentview',
            OFFICE_SPREADSHEET: 'documentview',
            PDF: 'documentview',
//            AUDIO: 'audioview',
            VIDEO: 'videoview'
        };

    /**
     * A central registry of file types which are supported by OX Viewer.
     * This registry Also offers file type related methods.
     */
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
            console.warn('getModelType()', model.get('fileCategory'));
            if (!model) { return $.Deferred().reject(); }

            var modelType = typesMap[model.get('fileCategory')] || 'defaultview';

            return require(['io.ox/core/viewer/views/types/' + modelType]).then(
                function (Type) {
                    console.info('getModelType() loaded', modelType);
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
