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
/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Calendar: Create new appointment');

Scenario('Create appointment with all fields', function* (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.setSetting('io.ox/core', 'autoOpenNotification', false);
    I.setSetting('io.ox/core', 'showDesktopNotifications', false);

    I.selectFolder('All my appointments');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test title');
    I.fillField('Location', 'test location');
    I.checkOption('Private');

    // // save
    var newAppointmentCID = yield I.executeAsyncScript(function (done) {
        require('io.ox/calendar/api').one('create', function (e, data) {
            done(_.cid(data));
        });
        // click here to make sure, that the create-listener is bound before the model is saved
        $('.io-ox-calendar-edit-window button[data-action="save"]').trigger('click');
    });
    I.waitForStalenessOf('.io-ox-calendar-edit-window');

    // // check appointment in all views
    // // 1) day view
    I.clickToolbar('View');
    I.click('Day');
    I.waitForVisible('.week.dayview .appointment');
    expect(yield I.grabTextFrom(`.week.dayview .appointment[data-cid="${newAppointmentCID}"] .title`)).to.equal('test title');
    expect(yield I.grabTextFrom(`.week.dayview .appointment[data-cid="${newAppointmentCID}"] .location`)).to.equal('test location');
    I.seeElement(`.week.dayview .appointment[data-cid="${newAppointmentCID}"] .private-flag`);
    // // 2) week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.week.weekview .appointment');
    expect(yield I.grabTextFrom(`.week.weekview .appointment[data-cid="${newAppointmentCID}"] .title`)).to.equal('test title');
    expect(yield I.grabTextFrom(`.week.weekview .appointment[data-cid="${newAppointmentCID}"] .location`)).to.equal('test location');
    I.seeElement(`.week.weekview .appointment[data-cid="${newAppointmentCID}"] .private-flag`);
    // // 3) month view
    I.clickToolbar('View');
    I.click('Month');
    I.waitForVisible('.month-view .appointment');
    expect(yield I.grabTextFrom(`.month-view .appointment[data-cid="${newAppointmentCID}"] .title`)).to.equal('test title');
    expect(yield I.grabTextFrom(`.month-view .appointment[data-cid="${newAppointmentCID}"] .location`)).to.equal('test location');
    I.seeElement(`.month-view .appointment[data-cid="${newAppointmentCID}"] .private-flag`);
    // // 4) list view
    I.clickToolbar('View');
    I.click('List');
    I.waitForVisible(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"]`);
    expect(yield I.grabTextFrom(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"] .title`)).to.equal('test title');
    expect(yield I.grabTextFrom(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"] .location`)).to.equal('test location');
    I.seeElement(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"] .private-flag`);

    // // delete the appointment thus it does not create conflicts for upcoming appointments
    I.click(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"]`);
    I.waitForVisible('[data-action="delete"]');
    I.click('Delete');
    I.waitForVisible('.io-ox-dialog-popup .modal-body');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForStalenessOf(`.calendar-list-view .vgrid-cell[data-obj-id^="${newAppointmentCID}"]`);

    I.logout();

});
