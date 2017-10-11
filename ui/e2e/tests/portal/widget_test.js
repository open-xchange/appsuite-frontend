Feature('Portal widgets');

Scenario('add and remove Inbox widget', function* (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('[data-app-name="io.ox/portal"] .header', 20);
    let [oldWidgetId] = yield I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    I.click('.io-ox-portal-window .header button.dropdown-toggle');
    I.click('.dropdown.open a[data-type="mail"]');
    I.click('.io-ox-dialog-popup .modal-footer button[data-action="save"]');
    let [widgetId] = yield I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    oldWidgetId.should.not.equal(widgetId);
    let title = yield I.grabTextFrom(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .title`);
    title.should.contain('Inbox');
    I.click(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .disable-widget`);
    I.click('.io-ox-dialog-popup .modal-footer button[data-action="delete"]');
    I.waitForStalenessOf(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"]`);
    I.logout();
});
