/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/tours/whats-new', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/tours',
    'io.ox/core/tk/wizard',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core'
], function (ext, capabilities, settings, Tour, ModalDialog, gt) {

    'use strict';

    var composeApp,
        point = ext.point('io.ox/tours/whats_new');

    ext.point('io.ox/tours/whats_new').extend({
        id: 'launcher-icon',
        index: 100,
        steps: function (baton) {
            if (!baton.tour) return;
            baton.tour.step()
                .title(gt('App Launcher'))
                //#. %1$s is the product name, e.g. OX App Suite
                .content(gt('To navigate between the %1$s applications, just click on the new App Launcher icon.', ox.serverConfig.productName))
                .spotlight('#io-ox-launcher')
            .end();
        }
    });

    ext.point('io.ox/tours/whats_new').extend({
        id: 'launcher',
        index: 200,
        steps: function (baton) {
            if (!baton.tour) return;
            baton.tour.step()
                .title(gt('App Launcher'))
                .waitFor('.launcher-dropdown:visible')
                .on('wait', function () {
                    if ($('.launcher-dropdown:visible').length === 0) $('.launcher-btn').click();
                    $('#io-ox-launcher').attr('forceOpen', true);
                })
                .on('hide', function () {
                    $('#io-ox-launcher').attr('forceOpen', false);
                    if ($('.launcher-dropdown:visible').length) $('.launcher-btn').click();
                })
                .content(gt('Click on the application that you would like to use.'))
                .spotlight('.launcher-dropdown')
            .end();
        }
    });

    ext.point('io.ox/tours/whats_new').extend({
        id: 'compose',
        index: 300,
        steps: function (baton) {
            if (!baton.tour) return;
            baton.tour.step()
                .title(gt('New Windows'))
                .waitFor('.io-ox-mail-compose-window:visible:last')
                .on('back', function () {
                    if (composeApp && !composeApp.getWindow().floating.model.get('minimized')) {
                        composeApp.getWindow().floating.onMinimize();
                    }
                })
                .on('wait', function () {
                    if (composeApp) {
                        if (composeApp.getWindow().floating.model.get('minimized')) composeApp.getWindow().floating.model.set('minimized', false);
                        return;
                    }
                    ox.launch('io.ox/mail/main').done(function () {
                        ox.registry.call('mail-compose', 'open').then(function (result) {
                            composeApp = result.app;
                        });
                    });
                })
                .content(gt('E-Mails will appear in a new window. These windows can be maximized, minimized and closed.'))
                .spotlight('.io-ox-mail-compose-window:visible:last')
            .end();
        }
    });

    ext.point('io.ox/tours/whats_new').extend({
        id: 'compose-minimized',
        index: 400,
        steps: function (baton) {
            if (!baton.tour) return;
            baton.tour.step()
                .title(gt('New Windows'))
                .waitFor('.taskbar-button:visible:last')
                .on('wait', function () {
                    if (composeApp && composeApp.getWindow().floating.model.get('minimized')) return;
                    $('.io-ox-mail-compose-window:last [data-action="minimize"]').click();
                })
                .content(gt('Windows you have minimized will appear in all applications for easy access. You can maximize a window again by clicking on it.'))
                .spotlight('.taskbar-button:visible:last')
            .end()
            .on('stop', function () {
                if (composeApp) {
                    //prevent app from asking about changed content
                    composeApp.view.dirty(false);
                    composeApp.quit();
                    composeApp = null;
                }
            });
        }
    });

    ext.point('io.ox/tours/whats_new').extend({
        id: 'multifactor',
        index: 500,
        steps: function (baton) {
            if (!baton.tour || !capabilities.has('multifactor')) return;
            baton.tour.step()
                //#. Title of tour step, demonstrating options available for 2-step verification
                .title(gt('2-step Verification Options'))
                .waitFor('.multifactorStatusDiv.mfLoaded')
                .on('wait', function () {
                    ox.launch('io.ox/settings/main', { id: 'io.ox/multifactor' });
                })
                .content(gt('You can now add additional verification options to enhance the security of your account.'))
                .spotlight('.io-ox-multifactor-settings #addDevice')
            .end();
        }
    });

    ext.point('io.ox/tours/whats_new').extend({
        id: 'help',
        index: 600,
        steps: function (baton) {
            if (!baton.tour) return;
            baton.tour.step()
                .title(gt('What\'s new'))
                //#. this is followed by a link to the help page
                .content([
                    gt('To learn more about the new and improved features you can visit '),
                    $('<a target="_blank" rel="noopener">').text(settings.get('whatsNew/helpUrl', 'https://www.open-xchange.com/whats-new-7-10')).attr('href', settings.get('whatsNew/helpUrl', 'https://www.open-xchange.com/whats-new-7-10'))
                ])
            .end();
        }
    });

    Tour.registry.add({
        id: 'default/io.ox/whats_new',
        priority: 1
    }, function () {
        var tour = new Tour(),
            baton = new ext.Baton({ tour: tour });
        point.invoke('steps', this, baton);

        tour.on('stop', function () {
            settings.set('whatsNew/autoShow', 0).save();
        });

        // splashscreen already has a button labeled with start tour
        tour.steps[0].options.labelNext = gt('Next');
        //#. %1$s is the product name, e.g. OX App Suite
        new ModalDialog({ title: gt('What\'s new'), width: '600px' })
            .build(function () {
                // build splash screen
                //#. %1$s is the product name, e.g. OX App Suite
                this.$body.css('white-space', 'pre-line').append($('<div>').text(gt('Welcome to %1$s.' +
                    '\nWe\'ve made some exciting changes to %1$s. This quick tour will guide you through some of the new and improved features.', ox.serverConfig.productName)));

                this.$footer.append($('<div class="checkbox pull-left">').css({ margin: '0', padding: '4px 0' }).append(
                    $('<label class="control-label">').text(gt('Never show again')).prepend('<input type="checkbox">')
                ));
            })
            .addCancelButton()
            .addButton({ action: 'start', label: gt('Start tour') })
            .on('start', function () {
                if (this.$footer.find('input').prop('checked')) {
                    settings.set('whatsNew/neverShowAgain', true).save();
                }
                tour.start();
            })
            .on('cancel', function () {
                if (this.$footer.find('input').prop('checked')) {
                    settings.set('whatsNew/neverShowAgain', true).save();
                }
            })
            .open();
        settings.set('whatsNew/autoShow', Math.max(settings.get('whatsNew/autoShow', 1) - 1, 0)).save();
    });

    if (settings.get('whatsNew/menuEntry', true)) {
        ext.point('io.ox/core/appcontrol/right/account').extend({
            id: 'whats-new',
            index: 260,
            extend: function () {
                if (capabilities.has('guest')) return;
                if (_.device('smartphone')) return;
                this.append(
                    $('<a href="#" data-action="whats-new" role="menuitem">')
                    .text(gt('What\'s new'))
                    .on('click', function (e) {
                        e.preventDefault();
                        Tour.registry.run('default/io.ox/whats_new');
                    })
                );
            }
        });
    }

    return {
        run: function () {
            Tour.registry.run('default/io.ox/whats_new');
        }
    };
});
