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
    'io.ox/core/viewer/views/types/typesutil',

    // preload types, please have a look at function 'getModelType'
    'io.ox/core/viewer/views/types/imageview',
    'io.ox/core/viewer/views/types/documentview',
    'io.ox/core/viewer/views/types/spreadsheetview',
    'io.ox/core/viewer/views/types/contactview',
    'io.ox/core/viewer/views/types/videoview',
    'io.ox/core/viewer/views/types/audioview',
    'io.ox/core/viewer/views/types/textview',
    'io.ox/core/viewer/views/types/defaultview',
    'io.ox/core/viewer/views/types/mailview'

], function (TypesUtil) {

    'use strict';

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
         *  file type object; or rejected, in case of an error.
         */
        getModelType: function (model) {
            // all types should be pre-loaded in this file, loading on demand for
            // large file count can cause problems #67073 and flood require with pending requests,
            // leave require here for now to be more robust e.g. in case of missed pre-load type
            return require(['io.ox/core/viewer/views/types/' + TypesUtil.getTypeString(model)]);
        }

    };

    return typesRegistry;

});
