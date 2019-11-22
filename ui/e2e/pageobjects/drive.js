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
        I.waitForElement(locate({ css: '[data-dropdown="io.ox/files/toolbar/share"]' }).inside('.classic-toolbar-container'));
        I.wait(0.2);
        I.click(locate({ css: '[data-dropdown="io.ox/files/toolbar/share"]' }).inside('.classic-toolbar-container'));
        I.clickDropdown(type);
        I.waitForDetached('.dropdown.open');
        I.waitForElement('.modal-dialog');
        within('.modal-dialog', () => {
            I.waitForFocus('.input-group input[type="text"]');
        });
    }
};
