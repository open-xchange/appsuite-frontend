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
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'io.ox/core/capabilities',
    'settings!io.ox/contacts',
    'settings!io.ox/core',
    'gettext!io.ox/contacts'
], function (ext, ExtensibleView, mini, util, capabilities, settings, coreSettings, gt) {

    'use strict';

    ext.point('io.ox/contacts/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/contacts/settings/detail/view', model: settings })
                .inject({
                    getNameOptions: function () {
                        return [
                            { label: gt('Language-specific default'), value: 'auto' },
                            { label: gt('First name Last name'), value: 'firstname lastname' },
                            { label: gt('Last name, First name'), value: 'lastname, firstname' }
                        ];
                    },
                    getMapOptions: function () {
                        var options = [
                            { label: gt('Google Maps'), value: 'google' },
                            { label: gt('Open Street Map'), value: 'osm' },
                            { label: gt('No link'), value: 'none' }
                        ];
                        if (_.device('ios || macos')) options.splice(2, 0, { label: gt('Apple Maps'), value: 'apple' });
                        return options;
                    },
                    openUserSettings: function () {
                        require(['io.ox/core/settings/user'], function (settingsUser) {
                            settingsUser.openModalDialog();
                        });
                    }
                })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell();
                    });
                })
                .render().$el
            );
        }
    });

    var INDEX = 0;

    ext.point('io.ox/contacts/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-contacts-settings').append(
                    util.header(gt('Address Book'))
                );
            }
        },
        //
        // Buttons
        //
        {
            index: INDEX += 100,
            id: 'buttons/top',
            render: function (baton) {
                this.$el.append(
                    baton.branch('buttons/top', this, $('<div class="form-group buttons">'))
                );
            }
        },
        //
        // Display name
        //
        {
            id: 'names',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Display of names'),
                        new mini.CustomRadioView({ name: 'fullNameFormat', model: settings, list: this.getNameOptions() }).render().$el
                    )
                );
            }
        },
        //
        // Initial folder
        //
        {
            id: 'startfolder',
            index: INDEX += 100,
            render: function () {

                if (!capabilities.has('gab !alone')) return;
                if (!settings.isConfigurable('startInGlobalAddressbook')) return;

                this.$el.append(
                    util.fieldset(
                        gt('Initial folder'),
                        $('<div class="form-group">').append(
                            util.checkbox('startInGlobalAddressbook', gt('Start in global address book'), settings)
                        )
                    )
                );
            }
        },
        //
        // Map service
        //
        {
            id: 'map-service',
            index: INDEX += 100,
            render: function () {
                if (!settings.isConfigurable('mapService')) return;
                this.$el.append(
                    util.fieldset(
                        gt('Link postal addresses with map service'),
                        new mini.CustomRadioView({ name: 'mapService', model: settings, list: this.getMapOptions() }).render().$el
                    )
                );
            }
        }
    );

    ext.point('io.ox/contacts/settings/detail/view/buttons/top').extend(
        //
        // Shared address books
        //
        {
            id: 'shared-address-books',
            index: 50,
            render: function (baton) {
                function openDialog() {
                    require(['io.ox/core/sub/sharedFolders'], function (subscribe) {
                        subscribe.open({
                            module: 'contacts',
                            help: 'ox.appsuite.user.sect.contacts.folder.subscribeshared.html',
                            title: gt('Subscribe to shared address books'),
                            point: 'io.ox/core/folder/subscribe-shared-address-books',
                            sections: {
                                public: gt('Public address books'),
                                shared: gt('Shared address books'),
                                private: gt('Private'),
                                hidden: gt('Hidden address books')
                            }
                        });
                    });
                }

                baton.$el.append(
                    $('<button type="button" class="btn btn-default" data-action="subscribe-shared-address-books">')
                    .append(
                        $.txt(gt('Subscribe to shared address books'))
                    )
                    .on('click', openDialog)
                );
            }
        }
    );

    ext.point('io.ox/contacts/settings/detail/view/buttons/top').extend(
        //
        // My contact data
        //
        {
            id: 'my-contact-data',
            index: 100,
            render: function (baton) {

                // check if users can edit their own data (see bug 34617)
                if (!coreSettings.get('user/internalUserEdit', true)) return;

                baton.$el.append(
                    $('<button type="button" class="btn btn-default">')
                        .text(gt('My contact data') + ' ...')
                        .on('click', this.openUserSettings)
                );
            }
        }
    );

});
