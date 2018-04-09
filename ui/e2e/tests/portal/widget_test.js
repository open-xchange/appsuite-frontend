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

Feature('Portal widgets');

BeforeSuite(async function (I, users) {
    users.push(await I.createUser(users.create()));
});

AfterSuite(async function (I, users) {
    await I.removeUsers(users);
});

Scenario('add and remove Inbox widget', async function (I, users) {
    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('[data-app-name="io.ox/portal"] .header', 20);
    let [oldWidgetId] = await I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    I.click('Add widget');
    I.click('Inbox', '.dropdown.open');
    I.click('Save', '.io-ox-dialog-popup');
    let [widgetId] = await I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    expect(oldWidgetId).not.equal(widgetId);
    let title = await I.grabTextFrom(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .title`);
    expect(title).to.contain('Inbox');
    I.click(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .disable-widget`);
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"]`);
    I.logout();
});
