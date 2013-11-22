/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/files/settings/model', ['settings!io.ox/files'], function (settings) {

    'use strict';

    var filesSettingsModel = Backbone.Model.extend({

        initialize: function () {

        },

        save: function () {
            settings.save(this.attributes);
        },

        saveAndYell: function () {
            settings.saveAndYell(this.attributes);
        },

        destroy: function () {
            console.log('destroy in model.js');
        }

    });

    return filesSettingsModel;
});
