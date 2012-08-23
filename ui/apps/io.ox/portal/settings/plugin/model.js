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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */
define('io.ox/portal/settings/plugin/model',
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    var PluginModel = Backbone.Model.extend({

        defaults: {
            active: false
        },

        initialize: function (options) {

        },

        save: function () {
            console.log("save in model.js");
        },

        destroy: function () {
            console.log("destroy in model.js");
        }

    });

    return PluginModel;
});







