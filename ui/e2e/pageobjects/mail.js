const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForNetworkTraffic();
        I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
        I.waitForVisible({ css: '[data-ref="io.ox/mail/listview"]' });
    },
    selectMail(text) {
        I.waitForElement(locate('li.list-item').withText(text));
        I.click(locate('li.list-item').withText(text));
        I.waitForFocus('.list-item.selected');
    }
};
