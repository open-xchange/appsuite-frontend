/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */
define('plugins/portal/upsellads/settings/model', ['settings!io.ox/contacts'], function (settings) {

    'use strict';

    return Backbone.Model.extend({

        initialize: function () {
        },

        save: function () {
            settings.save(this.attributes);
        },

        destroy: function () {
        }
    });
});
