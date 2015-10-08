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
define('io.ox/calendar/settings/model', [
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'io.ox/core/notifications'
], function (settings, gt, notifications) {

    'use strict';

    var calendarSettingsModel = Backbone.Model.extend({

        initialize: $.noop,

        save: function () {
            return settings.save(this.attributes);
        },

        saveAndYell: function (custom, options) {
            return settings.saveAndYell(custom, options);
        },

        destroy: function () {
            console.log('destroy in model.js');
        }

    });

    var model = settings.createModel(calendarSettingsModel),
        reloadMe = [];

    model.on('change', function (model) {
        var showNotice = _(reloadMe).any(function (attr) {
            return model.changed[attr];
        });
        model.saveAndYell(undefined, showNotice ? { force: true } : {}).then(
            function success() {

                if (showNotice) {
                    notifications.yell(
                        'success',
                        gt('The setting has been saved and will become active when you enter the application the next time.')
                    );
                }
            }
        );
    });

    return model;
});
