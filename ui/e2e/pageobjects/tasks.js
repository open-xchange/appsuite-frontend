const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForVisible('.io-ox-tasks-main');
    },
    newTask() {
        I.clickToolbar('New task');
        I.waitForElement('.io-ox-tasks-edit');
    },
    editTask() {
        I.clickToolbar('Edit');
        I.waitForElement('.io-ox-tasks-edit');
    },
    selectTask(id) {
        const item = locate('.vgrid-cell').withText(id);
        I.waitForElement(item)
        I.click(item);
        I.waitForFocus('.vgrid-cell.selected');
    },
    create() {
        I.click('Create');
        I.waitForDetached('.io-ox-tasks-edit-window');
        I.waitForElement('.vgrid-cell.selected.tasks');
        I.waitForElement('.tasks-detailview');
    },
    save() {
        I.click('Save');
        I.waitForDetached('.io-ox-tasks-edit-window');
        I.waitForElement('.vgrid-cell.selected.tasks');
        I.waitForElement('.tasks-detailview');
    }
};
