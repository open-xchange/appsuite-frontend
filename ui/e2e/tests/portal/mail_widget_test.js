/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail Portal widgets');

Scenario('adding a mail containing XSS code', async function (I) {
    await I.login('app=io.ox/mail', { prefix: 'io.ox/portal/xss_mail' });
    I.waitForElement({ css: '.io-ox-mail-window .classic-toolbar [data-action="more"]' });
    I.clickToolbar({ css: '.io-ox-mail-window .classic-toolbar [data-action="more"]' });
    I.click('Add to portal', '.dropdown.open .dropdown-menu');

    I.click('#io-ox-launcher button.launcher-btn');
    I.click('Portal', { css: '#io-ox-launcher' });
    I.waitForElement({ css: '[data-app-name="io.ox/portal"] .widgets' }, 20);
    I.waitForDetached({ css: '.widgets .widget.io-ox-busy' }, 20);

    let widgetId = await I.grabAttributeFrom('.io-ox-portal-window .widgets li.widget:first-child', 'data-widget-id');
    let type = await I.grabAttributeFrom('.io-ox-portal-window .widgets li.widget:first-child', 'data-widget-type');
    expect(type).to.equal('stickymail');
    let title = await I.grabTextFrom(`.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"] .title`);
    expect(title).to.equal('Test subject <img src="x" onerror="alert(666);">');

    I.click(`.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"] .disable-widget`);
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached(`.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"]`);
    await I.logout();
});
