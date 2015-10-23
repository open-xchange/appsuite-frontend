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
define('io.ox/mail/settings/model', [
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (settings, gt) {

    'use strict';

    var mailSettingsModel = Backbone.Model.extend({

        initialize: $.noop,

        validate: function (attrs) {
            if (!/^[0-9]*$/.test(attrs.lineWrapAfter)) {
                this.trigger('invalid:lineWrapAfter', gt('the line length must be a number'));
                return gt('the line length must be a number');
            }
            this.trigger('valid:lineWrapAfter');
        },

        save: function () {
            return settings.save(this.attributes);
        },

        saveAndYell: function () {
            return settings.saveAndYell(this.attributes);
        },

        destroy: function () {
            console.log('destroy in model.js');
        }

    });

    var model = settings.createModel(mailSettingsModel);

    return model;
});
