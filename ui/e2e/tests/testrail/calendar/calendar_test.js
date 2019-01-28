///**
// * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
// * LICENSE. This work is protected by copyright and/or other applicable
// * law. Any use of the work other than as authorized under this license
// * or copyright law is prohibited.
// *
// * http://creativecommons.org/licenses/by-nc-sa/2.5/
// * © 2017 OX Software GmbH, Germany. info@open-xchange.com
// *
// * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
// */
///// <reference path="../../../steps.d.ts" />
//
//Feature('testrail - calendar');
//
//Before(async function (users) {
//    await users.create();
//});
//
//After(async function (users) {
//    await users.removeAll();
//});
//
//Scenario('OXUI-623', function (I) {
//    //define testrail ID
//    I.haveIcal()
//    I.login('app=io.ox/calendar');
//    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
//    I.click('Add new calendar')
//    I.click('iCal')
//    I.fillField('.modal-open .modal-content [name="uri"]', 'http://192.168.32.2:3000/')
//    I.click('.modal-open .modal-content [data-action="subscribe"]')
//    pause();
//});