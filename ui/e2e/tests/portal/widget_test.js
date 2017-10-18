Feature('Portal widgets');

Scenario('add and remove Inbox widget', function* (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('[data-app-name="io.ox/portal"] .header', 20);
    let [oldWidgetId] = yield I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    I.click('Add widget');
    I.click('Inbox', '.dropdown.open');
    I.click('Save', '.io-ox-dialog-popup');
    let [widgetId] = yield I.grabAttributeFrom('.io-ox-portal-window .widgets li:first-child', 'data-widget-id');
    oldWidgetId.should.not.equal(widgetId);
    let title = yield I.grabTextFrom(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .title`);
    title.should.contain('Inbox');
    I.click(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"] .disable-widget`);
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForStalenessOf(`.io-ox-portal-window .widgets li[data-widget-id="${widgetId}"]`);
    I.logout();
});
