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

define('io.ox/calendar/subscribe-calendar', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'io.ox/core/a11y',
    'gettext!io.ox/calendar',
    'io.ox/oauth/backbone'
], function (ext, capabilities, ModalDialog, a11y, gt, OAuth) {

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
        render: function (baton) {
            if (!capabilities.has('calendar_google')) return;

            baton.collection.add({ id: 'google', displayName: gt('Google') });
            baton.view.on('select:google', function () {
                console.log('select google');
            });
        }
    });

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'ical',
        index: 300,
        render: function (baton) {
            if (!capabilities.has('calendar_ical')) return;

            baton.collection.add({ id: 'ical', displayName: gt('iCal') });
            baton.view.on('select:ical', function () {
                console.log('select ical');
            });
        }
    });

    ext.point('io.ox/calendar/subscribe/dialog/list').extend({
        id: 'import',
        index: 400,
        render: function (baton) {
            baton.collection.add({ id: 'import', displayName: gt('From file') });
            baton.view.on('select:import', function () {
                console.log('select import');
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
                    view: new OAuth.Views.ServicesListView({ collection: collection })
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
