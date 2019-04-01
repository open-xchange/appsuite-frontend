/// <reference path="../../steps.d.ts" />

Feature('Login');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

