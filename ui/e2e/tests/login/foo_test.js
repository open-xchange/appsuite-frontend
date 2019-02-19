/// <reference path="../../steps.d.ts" />

Feature('CS Autologin');

BeforeSuite(async (users) => {
    await users.create();
});

AfterSuite(async (users) => {
    await users.removeAll();
});

Scenario('First login', function (I, login) {
    login();
    I.seeElement('#io-ox-launcher');
});

Scenario('Second login', function (I, login) {
    login();
    I.seeElement('#io-ox-launcher');
});
