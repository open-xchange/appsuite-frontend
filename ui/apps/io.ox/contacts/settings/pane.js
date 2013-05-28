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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/contacts/settings/pane',
       ['settings!io.ox/contacts',
        'io.ox/contacts/settings/model',
        'io.ox/core/extensions',
        'gettext!io.ox/contacts'], function (settings, contactsSettingsModel, ext, gt) {

    'use strict';

    var contactsSettings =  settings.createModel(contactsSettingsModel),
        contactsSettingsView;

    var ContactsSettingsView = Backbone.View.extend({
        tagName: "div",
        render: function () {
            this.$el.append(
                $('<div class="clear-title">').text(gt.pgettext('app', 'Address Book'))
            );
            return this;
        }
    });

    ext.point('io.ox/contacts/settings/detail').extend({
        index: 200,
        id: 'contactssettings',
        draw: function (data) {

            contactsSettingsView = new ContactsSettingsView({model: contactsSettings});
            var holder = $('<div>').css('max-width', '800px');
            this.append(holder.append(
                contactsSettingsView.render().el
            ));
        },

        save: function () {
            contactsSettings.save();
        }
    });

});
