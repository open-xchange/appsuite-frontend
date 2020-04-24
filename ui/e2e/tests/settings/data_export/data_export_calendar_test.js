/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Olena Stute <olena.stute@open-xchange.com>
 *
 */
/// <reference path="../../../steps.d.ts" />

Feature('Settings > Drive');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C288515] Export data from calendar module', async (I, settings, mail) =>{

    const moment = require('moment');
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'test appointment',
        description: 'test appointment',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss') },
        endDate: { tzid: 'Europe/Berlin', value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss') }
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    within('.io-ox-personal-data-settings', () => {
        // uncheck options
        I.uncheckOption('Email');
        I.uncheckOption('Address book');
        I.uncheckOption('Drive');
        I.uncheckOption('Tasks');
    });

    I.click('Request download');
    I.waitForText('Download requested');
    I.pressKey('Escape');
    I.waitForText('Cancel download request');
    within('.personal-data-view .disabled', () => {
        I.dontSeeElement('button:disabled'); //check "Request download" disabled
    });

    const start_tag = moment().format('MM/DD/YYYY');
    const end_tag = moment().add(14, 'day').format('MM/DD/YYYY');
    I.waitForText('Your data archive from ' + start_tag + ' is ready for download. The download is available until ' + end_tag +'.', 600);

    //Receive notification mail
    I.openApp('Mail');
    mail.waitForApp();
    mail.selectMail('Your personal data archive is ready for download');

    I.see('Your personal data archive is ready for download');
    I.see('The data archive that you have requested on ' + moment().format('MMM D, YYYY') + ' is now ready for download.');
    I.see('You can download the archive until ' + moment().add(14, 'day').format('MMM D, YYYY'));
    I.see('Download archives');

    within({ frame: '.mail-detail-frame' }, async () => {
        I.click('a.deep-link-gdpr');
    });

    //Settings > Export data opened
    I.waitForText('Your archive');
    I.see('archive-' + moment().format('YYYY-MM-DD') + '.zip');
    I.seeElement('.btn[title="Download archive-' + moment().format('YYYY-MM-DD') + '.zip."]');

});

