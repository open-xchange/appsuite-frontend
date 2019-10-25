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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('General > User feedback');

Before(async (users) => {
    await users.create();
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
    I.waitForVisible({ css: 'div[data-app-name="io.ox/contacts"]' });
    testFeedback('io.ox/contacts');

    I.openApp('Calendar');
    I.waitForVisible({ css: 'div[data-app-name="io.ox/calendar"]' });
    testFeedback('io.ox/calendar');

    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal');
    testFeedback();

    I.openApp('Tasks');
    I.waitForVisible({ css: 'div[data-app-name="io.ox/tasks"]' });
    testFeedback();


});

Scenario('[C125005] Provide user feedback', function (I) {

    const appArr = ['Mail', 'General', 'Calendar', 'Address Book', 'Drive'];
    const giveFeedback = (app) => {
        I.click('~Feedback');
        I.waitForVisible({ css: 'select.feedback-select-box' });
        I.waitForText('Please rate the following application:');
        I.see(app);
        I.selectOption('.feedback-select-box', app);
        I.click(locate('.star-rating label').at(getRandom()));
        I.fillField('.feedback-note', 'It is awesome');
        I.click('Send');
        I.waitForText('Thank you for your feedback');
        I.waitForDetached('.modal-dialog');
    };
    const getRandom = () => {
        return Math.floor(Math.random() * (5)) + 1;
    };

    I.login();
    I.waitForVisible('~Feedback');
    //Open Feedback dialog and rate each app in turn
    appArr.forEach(giveFeedback);

});

Scenario('[C125003] Disable user feedback dialog', async function (I) {

    // var userA = users[0], userB = users[1];
    // await I.haveCapability('feedback', userA);
    // await I.dontHaveCapability('feedback', userB);

    I.login('app=io.ox/mail');
    I.openApp('Mail');
    I.waitForText('No message selected');
    I.waitForText('Feedback');
    I.logout();

    I.amOnPage('/');
    // dirty hack until dontHaveCapability works
    I.executeScript(function () { document.cookie = 'cap=-feedback; path=/'; });
    I.login('app=io.ox/mail');
    I.waitForText('No message selected');
    I.wait(1);
    I.dontSee('Feedback');
});
