/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/metrics/stopwatch/register', [
    'io.ox/core/metrics/metrics',
    'io.ox/core/metrics/bot/main',
    'settings!io.ox/core/metrics',
    'settings!io.ox/core'
], function (metrics, bot, settings, coreSettings) {

    'use strict';

    var STORE_FOLDER = settings.get('stopwatch/store-folder', 73407);

    // make sure we start without any app
    coreSettings.set('autoStart', 'none');
    _.url.hash({ app: null, folder: null, id: null });

    bot.ready(function () {

        var suite = this.suite(function () {

            //
            // Portal
            //

            this.test('Portal', function () {

                this.step('Launch portal', function (done) {
                    this.waitForApp('io.ox/portal', done);
                    ox.launch('io.ox/portal/main');
                });

                this.step('Wait for widgets', function (done) {
                    this.waitForEvent('portal:items:render', done);
                });
            });

            //
            // Address Book
            //

            this.test('Address Book', function () {

                this.step('Launch address book', function (done) {
                    this.waitForApp('io.ox/contacts', done);
                    ox.launch('io.ox/contacts/main');
                });

                this.step('Wait for vgrid', function (done) {
                    this.app.folder.set(6);
                    this.waitForEvent('grid:stop', done);
                });

                this.step('Load user data', function (done) {
                    var self = this;
                    require(['io.ox/core/api/user'], function (api) {
                        api.get({ id: ox.user_id }).done(function (data) {
                            self.user = data;
                            done();
                        });
                    });
                });

                this.step('Open contact edit dialog', function (done) {
                    this.waitForApp('io.ox/contacts/edit', done);
                    ox.launch('io.ox/contacts/edit/main', { folder_id: 6, id: this.user.contact_id });
                });

                this.step('Wait for form fields', function (done) {
                    this.waitForSelector('input[name="last_name"]', done);
                });

                this.step('Quit edit dialog', function (done) {
                    this.app.quit();
                    this.waitForApp('io.ox/contacts', done);
                    ox.launch('io.ox/contacts/main');
                });

                this.step('Switch back default contact folder', function (done) {
                    this.waitForFolder(coreSettings.get('folder/contacts'), done);
                });
            });

            //
            // Calendar
            //

            this.test('Calendar', function () {

                this.step('Launch calendar', function (done) {
                    this.waitForApp('io.ox/calendar', done);
                    // make sure we land in workweek view
                    ox.launch('io.ox/calendar/main', { perspective: 'week:workweek' });
                });

                this.step('Wait for week view', function (done) {
                    // already rendered?
                    if (this.$('.appointment').length) return done();
                    this.waitForEvent('calendar:items:render', done);
                });

                this.step('Open create appointment dialog', function (done) {
                    this.waitForApp('io.ox/calendar/edit', done);
                    ox.launch('io.ox/calendar/edit/main').done(function () {
                        this.create();
                    });
                });

                this.step('Wait for form fields', function (done) {
                    this.waitForSelector('div[data-extension-id="title"]', done);
                });

                this.step('Quit dialog', function (done) {
                    this.app.quit();
                    this.waitForApp('io.ox/calendar', done);
                    ox.launch('io.ox/calendar/main');
                });
            });

            //
            // Tasks
            //

            this.test('Tasks', function () {

                this.step('Launch tasks', function (done) {
                    this.waitForApp('io.ox/tasks', done);
                    ox.launch('io.ox/tasks/main');
                });

                this.step('Wait for vgrid', function (done) {
                    this.waitForEvent('grid:stop', done);
                });

                this.step('Open create task dialog', function (done) {
                    this.waitForApp('io.ox/tasks/edit', done);
                    ox.launch('io.ox/tasks/edit/main');
                });

                this.step('Wait for form fields', function (done) {
                    this.waitForSelector('div[data-extension-id="title"]', done);
                });

                this.step('Quit dialog', function (done) {
                    this.app.quit();
                    this.waitForApp('io.ox/tasks', done);
                    ox.launch('io.ox/tasks/main');
                });
            });
        });

        suite.done(function () {
            metrics.store.toFile(STORE_FOLDER, 'stopwatch', this.toCSV());
        });
    });
});
