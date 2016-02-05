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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/contacts/settings/pane', [
    'settings!io.ox/contacts',
    'io.ox/contacts/settings/model',
    'io.ox/core/extensions',
    'gettext!io.ox/contacts',
    'io.ox/backbone/mini-views',
    'io.ox/core/notifications',
    'io.ox/core/capabilities'
], function (settings, contactsSettingsModel, ext, gt, mini, notifications, capabilities) {

    'use strict';

    var POINT = 'io.ox/contacts/settings/detail', pane,
        contactsModel =  settings.createModel(contactsSettingsModel),
        reloadMe = [];

    contactsModel.on('change', function (model) {
        var showNotice = _(reloadMe).any(function (attr) {
            return model.changed[attr];
        });

        contactsModel.saveAndYell(undefined, showNotice ? { force: true } : {}).then(

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

    ext.point(POINT).extend({
        index: 100,
        id: 'contactssettings',
        draw: function () {
            var holder = $('<div>').css('max-width', '800px');
            pane = $('<div class="io-ox-contacts-settings">');
            this.append(holder.append(pane));
            ext.point(POINT + '/pane').invoke('draw', pane);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt('Address Book'))
            );
        }
    });

    if (capabilities.has('gab !alone')) {
        ext.point(POINT + '/pane').extend({
            index: 150,
            id: 'startfolder',
            draw: function () {
                this.append(
                    $('<fieldset>').append(
                        $('<div>').addClass('form-group').append(
                            $('<div>').addClass('checkbox').append(
                                $('<label>').text(gt('Start in global address book')).prepend(
                                    new mini.CheckboxView({ name: 'startInGlobalAddressbook', model: contactsModel }).render().$el
                                )
                            )
                        )
                    )
                );
            }
        });
    }

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'displaynames',
        draw: function () {
            var preferences = [
                { label: gt('Language-specific default'), value: 'auto' },
                { label: gt('First name Last name'), value: 'firstname lastname' },
                { label: gt('Last name, First name'), value: 'lastname, firstname' }

            ];
            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Display of names'))
                    ),
                    new mini.RadioView({ list: preferences, name: 'fullNameFormat', model: contactsModel }).render().$el
                )
            );
        }
    });
});
