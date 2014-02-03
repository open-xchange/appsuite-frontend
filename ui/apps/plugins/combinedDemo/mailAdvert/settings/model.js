define('plugins/combinedDemo/mailAdvert/settings/model',
      ['settings!plugins/mail/AdvertOxMail'], function (settings) {

    'use strict';

    // Very simple default model
    var advertModel = Backbone.Model.extend({


        initialize: function () {

        },

        save: function () {
            settings.save(this.attributes);
        },

        destroy: function () {

        }

    });

    return advertModel;
});