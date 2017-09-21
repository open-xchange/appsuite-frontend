/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
var util = require('util');

describe('Calendar', function () {

    describe('Create', function () {

        it('a new private appointment', function (client) {

            var newAppointmentCID;

            client
                .login('app=io.ox/calendar')
                .waitForElementVisible('*[data-app-name="io.ox/calendar"]', 20000);

            client
                .selectFolder({ id: 'virtual/all-my-appointments' })
                .setSetting('io.ox/core', 'autoOpenNotification', false)
                .setSetting('io.ox/core', 'showDesktopNotifications', false)
                .clickWhenEventListener('.io-ox-calendar-window .classic-toolbar a[data-action="create"]', 'click', 5000)
                .waitForElementVisible('.io-ox-calendar-edit-window', 2500);

            client
                // enter location and field
                .setValue('.io-ox-calendar-edit-window *[data-extension-id="title"] input', 'test title')
                .setValue('.io-ox-calendar-edit-window *[data-extension-id="location"] input', 'test location')
                // set private
                .click('.io-ox-calendar-edit-window *[data-extension-id="private_flag"] input')
                .pause(500);

            // save
            client
                .timeoutsAsyncScript(10000)
                .executeAsync(function (done) {
                    require('io.ox/calendar/api').one('create', function (e, data) {
                        done(_.cid(data));
                    });
                    // click here to make sure, that the create-listener is bound before the model is saved
                    $('.io-ox-calendar-edit-window button[data-action="save"]').trigger('click');
                }, [], function (ret) {
                    newAppointmentCID = ret.value;
                })
                .waitForElementNotPresent('.io-ox-calendar-edit-window', 5000);

            // check appointment in all views
            // 1) day view
            client
                .pause(1000)
                .clickWhenVisible('.io-ox-calendar-window .classic-toolbar li[data-dropdown="view"] a', 2500)
                .clickWhenVisible('.dropdown.open a[data-name="layout"][data-value="week:day"]', 2500)
                .waitForElementVisible('.io-ox-calendar-window .week.dayview .appointment', 2500)
                .perform(function (api, done) {
                    api.assert.containsText(util.format('.io-ox-calendar-window .week.dayview .appointment[data-cid="%s"] .title', newAppointmentCID), 'test title');
                    api.assert.containsText(util.format('.io-ox-calendar-window .week.dayview .appointment[data-cid="%s"] .location', newAppointmentCID), 'test location');
                    api.assert.elementPresent(util.format('.io-ox-calendar-window .week.dayview .appointment[data-cid="%s"] .private-flag', newAppointmentCID));
                    done();
                });
            // 2) week view
            client
                .clickWhenVisible('.io-ox-calendar-window .classic-toolbar li[data-dropdown="view"] a', 2500)
                .clickWhenVisible('.dropdown.open a[data-name="layout"][data-value="week:week"]', 2500)
                .waitForElementVisible('.io-ox-calendar-window .week.weekview .appointment', 2500)
                .perform(function (api, done) {
                    api.assert.containsText(util.format('.io-ox-calendar-window .week.weekview .appointment[data-cid="%s"] .title', newAppointmentCID), 'test title');
                    api.assert.containsText(util.format('.io-ox-calendar-window .week.weekview .appointment[data-cid="%s"] .location', newAppointmentCID), 'test location');
                    api.assert.elementPresent(util.format('.io-ox-calendar-window .week.weekview .appointment[data-cid="%s"] .private-flag', newAppointmentCID));
                    done();
                });
            // 3) month view
            client
                .clickWhenVisible('.io-ox-calendar-window .classic-toolbar li[data-dropdown="view"] a', 2500)
                .clickWhenVisible('.dropdown.open a[data-name="layout"][data-value="month"]', 2500)
                .waitForElementVisible('.io-ox-calendar-window .month-view .appointment', 2500)
                .perform(function (api, done) {
                    api.assert.containsText(util.format('.io-ox-calendar-window .month-view .appointment[data-cid="%s"] .title', newAppointmentCID), 'test title');
                    api.assert.containsText(util.format('.io-ox-calendar-window .month-view .appointment[data-cid="%s"] .location', newAppointmentCID), 'test location');
                    api.assert.elementPresent(util.format('.io-ox-calendar-window .month-view .appointment[data-cid="%s"] .private-flag', newAppointmentCID));
                    done();
                });
            // 4) list view
            client
                .clickWhenVisible('.io-ox-calendar-window .classic-toolbar li[data-dropdown="view"] a', 2500)
                .clickWhenVisible('.dropdown.open a[data-name="layout"][data-value="list"]', 2500)
                .perform(function (api, done) {
                    api.waitForElementVisible(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"]', newAppointmentCID), 2500);
                    api.assert.containsText(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"] .title', newAppointmentCID), 'test title');
                    api.assert.containsText(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"] .location', newAppointmentCID), 'test location');
                    api.assert.elementPresent(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"] .private-flag', newAppointmentCID));
                    done();
                });

            // delete the appointment thus it does not create conflicts for upcoming appointments
            client
                .perform(function (api, done) {
                    api
                        .click(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"]', newAppointmentCID))
                        .clickWhenEventListener('.io-ox-calendar-window .classic-toolbar a[data-action="delete"]', 'click', 2500);
                    done();
                })
                .waitForElementVisible('.io-ox-dialog-popup .modal-body', 2500)
                .clickWhenVisible('.io-ox-dialog-popup .modal-footer button[data-action="ok"]')
                .perform(function (api, done) {
                    api
                        .waitForElementNotPresent(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"]', newAppointmentCID), 2500)
                        .assert.elementNotPresent(util.format('.io-ox-calendar-window .calendar-list-view .vgrid-cell[data-obj-id^="%s"]', newAppointmentCID));
                    done();
                });

            client.logout();

        });

    });

});
