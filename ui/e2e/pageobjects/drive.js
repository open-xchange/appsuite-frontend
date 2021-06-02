const { I, dialogs } = inject();

module.exports = {
    waitForApp() {
        // wait untill all importand nodes are drawn
        I.waitForElement('.file-list-view.complete');
        I.waitForVisible({ css: '.io-ox-files-window .folder-tree' }, 5);
        I.waitForVisible({ xpath: './/*[contains(@class, "io-ox-files-window")]//*[@class="classic-toolbar-container"]//*[@class="classic-toolbar" and not(ancestor::*[contains(@style, "display: none;")])]' });
        I.waitForVisible({ xpath: './/*[contains(@class, "secondary-toolbar")]//*[contains(@class, "breadcrumb-view") and not(ancestor::*[contains(@style, "display: none")])]' }, 5);
        // wait a bit because breadcrumb has some redraw issues atm (redraws 7 times)
        // TODO Fix the redraw issue
        I.wait(0.5);
    },
    waitForViewer() {
        I.waitForText('Details', 10, '.io-ox-viewer .sidebar-panel-title');
    },
    shareItem(file) {
        I.clickToolbar('Share');
        dialogs.waitForVisible();
        if (file) {
            I.waitForText('Who can access this file?');
        } else {
            I.waitForText('Who can access this folder?');
        }
    }
};
