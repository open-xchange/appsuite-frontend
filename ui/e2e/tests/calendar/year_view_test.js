/// <reference path="../../steps.d.ts" />

Feature('Calendar > Misc');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

