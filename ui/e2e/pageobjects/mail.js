const { I } = inject();

module.exports = {
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
        I.waitForElement(item);
        I.wait(0.5);
        I.click(item);
        I.waitForFocus('.list-view li.list-item.selected');
    },
    newMail() {
        I.waitForText('Compose', 5, '.io-ox-mail-window .classic-toolbar-container');
        I.clickToolbar('Compose');
        I.waitForFocus('.io-ox-mail-compose [placeholder="To"]');
    },
    send() {
        I.click('Send');
        I.wait(0.5);
        I.waitToHide('.io-ox-mail-compose-window');
        I.waitToHide('.generic-toolbar.mail-progress');
    }
};
