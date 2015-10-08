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
define('io.ox/contacts/settings/model', ['settings!io.ox/contacts'], function (settings) {

    'use strict';

    var contactsSettingsModel = Backbone.Model.extend({

        initialize: function () {
        },

        saveAndYell: function (custom, options) {
            return settings.saveAndYell(custom, options);
        },

        save: function () {
            return settings.save(this.attributes);
        },

        destroy: function () {
        }
    });

    return contactsSettingsModel;
});
