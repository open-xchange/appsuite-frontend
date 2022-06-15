/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tours/multifactor', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/tours',
    'io.ox/core/tk/wizard',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/tours'
], function (ext, capabilities, settings, Tour, ModalDialog, gt) {

    'use strict';

    var point = ext.point('io.ox/tours/multifactor');

    var index = 100;

    function cancel() {
        $('[data-action="cancel"]').click();
    }

    // Introduction point.  Show add button and choice box
    point.extend({
        id: 'multifactor',
        index: index += 100,
        steps: function (baton) {
            if (!baton.tour || !capabilities.has('multifactor')) return;

            baton.tour.step()
                .title(gt('Second Factor Authentication'))
                .waitFor('.multifactorStatusDiv.mfLoaded')
                .on('wait', function () {
                    ox.launch('io.ox/settings/main', { id: 'io.ox/multifactor' });
                })
                .content(gt('You can now add additional verification options to enhance the security of your account.'))
                .spotlight('.io-ox-multifactor-settings #addDevice')
            .end();
            baton.tour.step()
            .title(gt('Adding verification option'))
            .waitFor('.mfAddDevice')
            .on('wait', function () {
                $('#addDevice').click();
            })
            .content(gt('Various options for additional verification depends on your installation.'))
            .spotlight('.modal-content')
            .hotspot('.modal-body .fa-mobile', { top: 20, left: 20 })
            .referTo('.btn-primary[data-action="cancel"]')
            .on('show', function () {
                baton.hasSMS = ($('.fa-mobile').length > 0);
            })
            .end();
        }
    });

    // Show SMS setup as an example (if enabled)
    point.extend({
        id: 'multifactor_sms',
        index: index += 100,
        steps: function (baton) {
            if (!baton.tour || !capabilities.has('multifactor')) return;
            // These steps only shown if SMS is enabled
            baton.tour.step()
            .title(gt('Adding a code via text message'))
            .waitFor(function () {
                if (!baton.hasSMS) {  // Check SMS enabled.  Quick exit wait if not
                    return '#addDevice';
                }
                $('.modal-body .fa-mobile').click();
                return '.select.countryCodes';

            })
            .on('show', function () {
                if (!baton.hasSMS) { // Doesn't have SMS enabled for demo, bypass steps
                    cancel();
                    baton.tour.shift(2);
                    return;
                }
                $('#deviceNumber').val('123456789');
            })
            .content(gt('Selecting the option for a code via text message, for example, will then ask you for a phone number.'))
            .on('next', function () {
                cancel();
            })
            .spotlight('#deviceNumber', { padding: 5 })
            .end();

            baton.tour.step()
            .title(gt('Authentication Requests'))
            .waitFor('#verification')
            .on('wait', function () {
                require(['io.ox/multifactor/views/smsProvider'], function (viewer) {
                    var challengeData = {
                        phoneNumberTail: '56789'
                    };
                    var authInfo = { device: { id: 'test', provider: 'test' }, def: $.Deferred() };
                    viewer.open(challengeData, authInfo);
                });
            })
            .on('show', function () {
                $('.modal-backdrop.in').css('opacity', '0.9');
                $('.multifactorAuth').css('z-index', 10000); // Auth normally very top page.  Move below this dialog
            })
            .on('next', function () {
                cancel();
            })
            .content(gt('Then the next time you log in, you will have to verify your identitity by entering the number sent to your phone.'))
            .spotlight('.modal-content')
            .end();
        }
    });

    // Done tour.  Mention 2fa can be removed once setup
    point.extend({
        id: 'multifactor_done',
        index: index += 100,
        steps: function (baton) {
            if (!baton.tour || !capabilities.has('multifactor')) return;
            baton.tour.step()
            .title(gt('Removing'))
            .content(gt('Devices can be removed once added if you so choose.  See help for additional details.'))
            .end();

        }
    });

    Tour.registry.add({
        id: 'default/io.ox/multifactor',
        priority: 1
    }, function () {
        var tour = new Tour(),
            baton = new ext.Baton({ tour: tour });
        point.invoke('steps', this, baton);

        tour.steps[0].options.labelNext = gt('Next');

        new ModalDialog({ title: gt('Second Factor Authentication'), width: '600px' })
            .build(function () {
                // build splash screen
                this.$body.css('white-space', 'pre-line').append($('<div>').text(gt('As an additional security feature, you can now require a second method of authentication, such as a text message, before logging into your account.  Would you like to see some information on this now?')));
            })
            .addCancelButton()
            .addButton({ action: 'start', label: gt('Start tour') })
            .on('start', function () {
                tour.start();
            })
            .open();

    });

    return {
        run: function () {
            // Verify multifactor service running before starting tour
            if (!capabilities.has('multifactor') || !capabilities.has('multifactor_service')) return false;
            // We are always on going to autoshow this tour only once
            settings.set('multifactor/shownTour', true).save();
            // Start tour
            Tour.registry.run('default/io.ox/multifactor');
            return true;
        }
    };
});
