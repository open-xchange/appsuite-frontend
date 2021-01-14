const { I } = inject();

module.exports = {

    locators: {
        compose: {
            close: locate({ css: '.io-ox-mail-compose-window button[aria-label="Save and close"]' }).as('Save and Close'),
            options: locate({ css: '[data-extension-id="composetoolbar-menu"] a[aria-label="Options"]' }).as('Options dropdown'),
            localfile: locate({ css: '.composetoolbar a[aria-label="Add local file"]' }).as('Add local file'),
            drivefile: locate({ css: '.composetoolbar a[aria-label="Add from Drive"]' }).as('Add from Drive')
        }
    },

    waitForApp() {
        // wait for listview, detailview, toolbar and foldertree to be visible
        I.waitForVisible({ css: '[data-ref="io.ox/mail/listview"]' }, 5);
        I.waitForVisible({ css: '.rightside.mail-detail-pane' }, 5);
        I.waitForVisible({ css: '.io-ox-mail-window .classic-toolbar-container .classic-toolbar' }, 5);
        I.waitForVisible({ css: '[data-id="virtual/standard"]' }, 5);
        //wait for all busy classes to disappear
        I.waitForInvisible('[data-ref="io.ox/mail/listview"] .busy-indicator', 5);
    },
    selectMail(text) {
        const item = locate('.list-view li.list-item').withText(text);
        I.waitForElement(item, 30);
        I.wait(0.5);
        I.click(item);
        I.waitForFocus('.list-view li.list-item.selected');
    },
    selectMailByIndex(index) {
        const item = locate('.list-view li.list-item').withAttr({ 'data-index': index.toString() });
        I.waitForElement(item);
        I.wait(0.5);
        I.click(item);
        I.waitForFocus('.list-view li.list-item.selected');
    },
    newMail() {
        I.waitForText('Compose', 5, '.io-ox-mail-window .classic-toolbar-container');
        I.clickToolbar('Compose');
        I.waitForVisible('.io-ox-mail-compose [placeholder="To"]', 30);
        I.waitForFocus('.io-ox-mail-compose [placeholder="To"]');
    },
    addAttachment(path) {
        var ext = path.match(/\.(.{3,4})$/)[1];
        I.attachFile({ css: 'input[type=file]' }, path);
        I.waitForText(ext.toUpperCase(), 5, '.inline-items.preview');
    },
    send() {
        I.click('Send');
        I.wait(0.5);
        I.waitToHide('.io-ox-mail-compose-window');
        I.waitToHide('.generic-toolbar.mail-progress', 45);
    }
};
