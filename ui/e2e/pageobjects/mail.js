const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForNetworkTraffic();
        I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
        I.waitForVisible({ css: '[data-ref="io.ox/mail/listview"]' });
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
        I.click('Compose', '.io-ox-mail-window .classic-toolbar-container');
        I.waitForFocus('.io-ox-mail-compose [placeholder="To"]');
    },
    send() {
        I.click('Send');
        I.waitForVisible('.generic-toolbar.mail-progress');
        I.waitToHide('.generic-toolbar.mail-progress');
    }
};
