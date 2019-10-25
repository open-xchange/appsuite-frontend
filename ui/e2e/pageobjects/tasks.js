const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForVisible('.io-ox-tasks-main');
    },
    newTask() {
        I.clickToolbar('New task');
        I.waitForVisible({ css: '[data-app-name="io.ox/tasks/edit"]' });
    }
};
