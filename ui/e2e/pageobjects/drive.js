const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForElement('.file-list-view.complete');
        I.waitForNetworkTraffic();
    },
    waitForViewer() {
        I.waitForText('Details', 10, '.io-ox-viewer .sidebar-panel-title');
    },
    shareItem(type) {
        I.waitForVisible(locate({ css: '[data-dropdown="io.ox/files/toolbar/share"]' }).inside('.classic-toolbar-container'));
        I.wait(0.2);
        I.click(locate({ css: '[data-dropdown="io.ox/files/toolbar/share"]' }).inside('.classic-toolbar-container'));
        I.clickDropdown(type);
        I.waitForDetached('.dropdown.open');
        I.waitForVisible('.modal-dialog');
        I.waitForFocus('.modal-dialog input[type="text"][id^="form-control-label"]');
    }
};
