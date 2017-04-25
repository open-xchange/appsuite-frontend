/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/contacts/settings/pane', [
    'settings!io.ox/contacts',
    'io.ox/core/extensions',
    'gettext!io.ox/contacts',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'io.ox/core/notifications',
    'io.ox/core/capabilities'
], function (settings, ext, gt, mini, util, notifications, capabilities) {

    'use strict';

    var POINT = 'io.ox/contacts/settings/detail',
        reloadMe = [];

    settings.on('change', function (setting) {
        var showNotice = _(reloadMe).some(function (attr) {
            return setting === attr;
        });

        settings.saveAndYell(undefined, showNotice ? { force: true } : {}).then(
            function success() {
                if (!showNotice) return;

                notifications.yell('success', gt('The setting has been saved and will become active when you enter the application the next time.'));
            }
        );
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'contactssettings',
        draw: function () {
            var holder = $('<div class="io-ox-contacts-settings">');
            this.append(holder);
            ext.point(POINT + '/pane').invoke('draw', holder);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(util.header(gt('Address Book')));
        }
    });

    if (capabilities.has('gab !alone')) {
        ext.point(POINT + '/pane').extend({
            index: 150,
            id: 'startfolder',
            draw: function () {
                if (!settings.isConfigurable('startInGlobalAddressbook')) return;

                this.append(
                    util.fieldset(gt('Initial folder'),
                        $('<div class="form-group">').append(
                            util.checkbox('startInGlobalAddressbook', gt('Start in global address book'), settings)
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
                util.fieldset(gt('Display of names'),
                    new mini.RadioView({ list: preferences, name: 'fullNameFormat', model: settings }).render().$el
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'map-service',
        draw: function () {

            var options = [
                { label: gt('Google Maps'), value: 'google' },
                { label: gt('Open Street Map'), value: 'osm' },
                { label: gt('No link'), value: 'none' }
            ];

            if (_.device('ios || macos')) options.splice(2, 0, { label: gt('Apple Maps'), value: 'apple' });

            this.append(
                util.fieldset(gt('Link postal addresses with map service'),
                    new mini.RadioView({ list: options, name: 'mapService', model: settings }).render().$el
                )
            );
        }
    });

});
