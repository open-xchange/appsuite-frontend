/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/actions/subscribe-calendar', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'io.ox/core/a11y',
    'gettext!io.ox/calendar',
    'io.ox/oauth/backbone',
    'io.ox/oauth/keychain',
    'io.ox/core/yell',
    'io.ox/core/folder/api'
], function (ext, capabilities, ModalDialog, a11y, gt, OAuth, oauthAPI, yell, folderAPI) {

    'use strict';

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'schedjoules',
        index: 100,
        render: function (baton) {
            if (!capabilities.has('calendar_schedjoules')) return;

            baton.collection.add({ id: 'schedjoules', displayName: gt('Schedjoules') });
            baton.view.on('select:schedjoules', function () {
                require(['io.ox/calendar/settings/schedjoules/schedjoules'], function (schedjoules) {
                    schedjoules.open();
                });
            });
        }
    });

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'google',
        index: 200,
        render: (function () {
            function createAccount(service) {
                var account = oauthAPI.accounts.forService(service.id).filter(function (account) {
                    return !account.hasScopes('calendar');
                })[0] ||
                new OAuth.Account.Model({
                    serviceId: service.id,
                    displayName: oauthAPI.chooseDisplayName(service)
                });

                return account.enableScopes('calendar').save().then(function () {
                    return folderAPI.create('1', {
                        'module': 'event',
                        'title': gt('My Google Calendar'),
                        'com.openexchange.calendar.provider': 'google',
                        'com.openexchange.calendar.config': {
                            'oauthId': account.id
                        }
                    });
                }).then(function () {
                    yell('success', gt('Account added successfully'));
                });
            }
            return function (baton) {
                if (!capabilities.has('calendar_google')) return;
                var googleService = oauthAPI.services.find(function (model) {
                    return model.get('id').indexOf('google') >= 0;
                });
                if (!googleService) return;
                if (googleService.get('availableScopes').indexOf('calendar') < 0) return;

                baton.collection.add({ id: 'google', displayName: gt('Google') });
                baton.view.on('select:google', function () {
                    createAccount(googleService);
                });
            };
        }())
    });

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'ical',
        index: 300,
        render: function (baton) {
            if (!capabilities.has('calendar_ical')) return;

            baton.collection.add({ id: 'ical', displayName: gt('iCal feeds') });
            baton.view.on('select:ical', function () {
                require(['io.ox/calendar/actions/ical'], function (importICal) {
                    baton.dialog.close();
                    importICal();
                });
            });
        }
    });

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'import',
        index: 400,
        render: function (baton) {
            if (_.device('ios || android')) return;

            baton.collection.add({ id: 'import', displayName: gt('From file') });
            baton.view.on('select:import', function () {
                require(['io.ox/core/import/import'], function (importer) {
                    baton.dialog.close();
                    importer.show('calendar');
                });
            });
        }
    });

    ext.point('io.ox/calendar/subscribe/dialog').extend({
        id: 'account-list',
        index: 100,
        render: function () {
            var collection = new Backbone.Collection(),
                baton = new ext.Baton({
                    collection: collection,
                    view: new OAuth.Views.ServicesListView({ collection: collection }),
                    dialog: this
                });

            ext.point('io.ox/calendar/subscribe/dialog/list').invoke('render', this.$body, baton);
            this.$body.append(baton.view.render().$el);
        }
    });

    return function () {
        return new ModalDialog({ width: 570, title: gt('Subscribe calendar'), point: 'io.ox/calendar/subscribe/dialog' })
            .addCloseButton()
            .open();
    };
});
