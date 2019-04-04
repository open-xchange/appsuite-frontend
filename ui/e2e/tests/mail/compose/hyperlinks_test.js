/// <reference path="../../../steps.d.ts" />

Feature('Multi search');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8821] Send mail with Hyperlink', function (I, users) {

    const [user1] = users;
    let hyperLink = 'https://appsuite.open-xchange.com/';
    let linkText = 'appsuite link';
    I.login('app=io.ox/mail', { user: user1 });
    I.clickToolbar('Compose');
    I.waitForVisible('input[type="email"].token-input.tt-input');
    I.fillField('input[type="email"].token-input.tt-input', 'foo@bar');
    I.wait(1);
    I.fillField('input[name="subject"]', 'test subject');
    I.click('i.mce-i-link');
    I.waitForVisible('.mce-reset');
    I.fillField('.mce-combobox input.mce-textbox', hyperLink);
    I.fillField('input.mce-last', linkText);
    I.click('Ok');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(linkText);
        I.click(linkText);
    });
    I.click('i.mce-i-link');
    I.waitForVisible('.mce-reset');
    I.seeInField('.mce-combobox input.mce-textbox', hyperLink);
    I.seeInField('input.mce-last', linkText);
    I.click('Ok');
    I.wait(2);
    I.click('Send');
    I.wait(1);
    I.selectFolder('Sent');
    I.waitForText('test subject');
    I.click('li[data-index="0"]');
    I.waitForText(linkText, '.rightside.mail-detail-pane .body.user-select-text');
});
