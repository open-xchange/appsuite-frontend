/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/settings/model',
      ['settings!io.ox/mail'], function (settings) {

    'use strict';

    var mailSettingsModel = Backbone.Model.extend({


        initialize: function (options) {

        },

        save: function () {
            settings.save(this.attributes);
        },

        destroy: function () {
            console.log("destroy in model.js");
        }

    });

    return mailSettingsModel;
});







