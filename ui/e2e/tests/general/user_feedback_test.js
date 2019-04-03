/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('General > User feedback');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C125002] Enable user feedback dialog', function (I) {
    I.login();
    I.click({ css: '[aria-label="Feedback"]' });
    I.see('Please rate the following application:');
    I.grabTitle('#star-rating');
});

Scenario('[C125004] App aware user feedback', function (I) {
    const feedBackBox = '.feedback-select-box';
    const feedBackText = 'Please rate the following application:';

    function testFeedback(appType = 'general') {
        I.click('~Feedback');
        I.waitForText(feedBackText);
        I.waitForValue(feedBackBox, appType);
        I.click('Cancel');
    }


    I.login('app=io.ox/mail');
    testFeedback('io.ox/mail');

    I.openApp('Drive');
    I.waitForVisible('.io-ox-files-window');
    testFeedback('io.ox/files');

    I.openApp('Address Book');
    I.waitForVisible('div[data-app-name="io.ox/contacts"]');
    testFeedback('io.ox/contacts');

    I.openApp('Calendar');
    I.waitForVisible('div[data-app-name="io.ox/calendar"]');
    testFeedback('io.ox/calendar');

    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal');
    testFeedback();

    I.openApp('Tasks');
    I.waitForVisible('div[data-app-name="io.ox/tasks"]');
    testFeedback();


});

Scenario('[C125005] Provide user feedback', function (I) {
    I.login();
    I.click('~Feedback');
    I.see('Please rate the following application:');
    I.see('Mail');
    I.selectOption('.feedback-select-box', 'General');
    I.click(locate('.star-rating label').at(5));
    I.fillField('.feedback-note', 'Its awsome');
    I.click('Send');
    I.waitForText('Thank you for your feedback');
    I.click('~Feedback');
    I.see('Please rate the following application:');
    I.selectOption('.feedback-select-box', 'Mail');
    I.click(locate('.star-rating label').at(3));
    I.fillField('.feedback-note', 'Its good');
    I.click('Send');
    I.waitForText('Thank you for your feedback');
    I.click('~Feedback');
    I.see('Please rate the following application:');
    I.selectOption('.feedback-select-box', 'Calendar');
    I.click(locate('.star-rating label').at(4));
    I.fillField('.feedback-note', 'Its very good');
    I.click('Send');
    I.waitForText('Thank you for your feedback');
    I.click('~Feedback');
    I.see('Please rate the following application:');
    I.selectOption('.feedback-select-box', 'Address Book');
    I.click(locate('.star-rating label').at(4));
    I.fillField('.feedback-note', 'Its excellent');
    I.click('Send');
    I.waitForText('Thank you for your feedback');
    I.click('~Feedback');
    I.see('Please rate the following application:');
    I.selectOption('.feedback-select-box', 'Drive');
    I.click(locate('.star-rating label').at(2));
    I.fillField('.feedback-note', 'Its ok');
    I.click('Send');
    I.waitForText('Thank you for your feedback');
});
