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

Feature('Portal');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('add and remove Inbox widget', async function ({ I, portal, dialogs }) {
    I.login('app=io.ox/portal');
    portal.waitForApp();
    I.waitForDetached('#io-ox-refresh-icon .fa-refresh.fa-spin', 20);

    let [oldWidgetId] = await I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    portal.addWidget('Inbox');
    let [widgetId] = await I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');

    expect(oldWidgetId).not.equal(widgetId);
    let title = await I.grabTextFrom(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .title`);
    expect(title).to.contain('Inbox');
    I.click(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .disable-widget`);

    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    I.waitForDetached(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"]`);
});
