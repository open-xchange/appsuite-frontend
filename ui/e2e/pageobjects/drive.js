const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForElement('.file-list-view.complete');
        I.waitForNetworkTraffic();
    },
    waitForViewer() {
        I.waitForText('Details', 10, '.io-ox-viewer .sidebar-panel-title');
    }
};
