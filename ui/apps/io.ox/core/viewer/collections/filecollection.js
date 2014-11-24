/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */

define('io.ox/core/viewer/collections/filecollection', [
    'io.ox/core/viewer/models/filemodel'
], function (FileModel) {

    'use strict';

    /**
     *  The FileCollection consists of an array of viewer file models.
     */
    var FileCollection = Backbone.Collection.extend({

        model: FileModel,

        // TODO: filter file models without a real file
        parse: function (model) {
            //console.info('FileCollection.parse()');
            return model;
        },

        initialize: function () {
            //console.info('FileCollection.initialize()');
        }

    });

    return FileCollection;
});
