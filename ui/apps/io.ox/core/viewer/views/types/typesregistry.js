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
