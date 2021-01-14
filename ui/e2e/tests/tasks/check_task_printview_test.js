/// <reference path="../../steps.d.ts" />

Feature('Tasks > Edit');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7756] Check Task printview ', async ({ I, tasks, users }) => {
    // Create preconditions
    const folder = await I.grabDefaultFolder('tasks');
    const task1 = { folder_id: folder, title: 'C7756 - task 1', note: 'Do something', priority: 2, status: 1 };
    const task2 = { folder_id: folder, title: 'C7756 - task 2', note: 'Do something else', percent_completed: 50, status: 2 };
    await Promise.all([
        I.haveTask(task1),
        I.haveTask(task2)
    ]);

    // #1 - login and check that those tasks exist, select all available tasks
    I.login('app=io.ox/tasks', users[0]);
    tasks.waitForApp();
    I.waitForText(task1.title);
    I.waitForText(task2.title);
    I.click('.select-all');

    // #2 Chose print option
    I.click('~More actions');
    I.click('Print', '.dropdown.open .dropdown-menu');
    I.wait(5);
    I.retry(5).switchToNextTab();

    // #3 verify the content of the print dialog
    I.see(task1.title);
    I.see(task1.note);
    I.see('Not started');

    I.see(task2.title);
    I.see(task2.note);
    I.see('In progress, Progress: ' + task2.percent_completed + '%');


});
