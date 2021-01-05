const { I } = inject();

module.exports = {
    openChat() {
        I.waitForVisible('~Chat');
        I.retry(3).click('~Chat');
        I.waitForVisible('.ox-chat', 15);
    },
    createPrivateChat(email) {
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Private chat');
        I.waitForText(email);
        I.click(locate('.address-picker li').withText(email));
        I.click('Start conversation');

        I.waitForElement('.ox-chat .controls');
        I.fillField('Message', 'Hello.');
        I.pressKey('Enter');
        I.waitForElement('.message.myself');
    },
    fillNewGroupForm(groupTitle, emails = []) {
        const emailLocator = '.addressbook-popup .modal-dialog div.email';

        I.waitForText('Create group chat', 3, '.ox-chat-popup');
        I.fillField('.ox-chat-popup input[name="title"]', groupTitle);
        I.click('~Select contacts', '.ox-chat-popup');

        I.waitForElement('.modal-dialog .search-field', 3, '.addressbook-popup');
        I.waitForNetworkTraffic();

        emails.forEach(function (email) {
            I.fillField('.addressbook-popup .modal-dialog .search-field', email);
            I.waitForElement(locate(emailLocator).withText(email));
            I.click(locate(emailLocator).withText(email));
        });

        I.waitForNetworkTraffic();
        I.click(locate('.addressbook-popup button').withText('Select'));

        I.waitForText(emails.pop());
    },
    fillNewChannelForm(channelTitle) {
        I.waitForText('Create channel', 3, '.ox-chat-popup');
        I.fillField('name', channelTitle);

        I.click('.contact-photo.empty', '.ox-chat-popup .modal-dialog');
        I.waitForElement('.contact-photo-upload form input[type="file"][name="file"]', '.edit-picture');
        I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
        I.click(locate('button').withText('Apply'), '.edit-picture');
        I.waitForDetached('.edit-picture');
    },
    sendMessage(content) {
        within('.ox-chat .chat-rightside', async () => {
            I.waitForElement('.controls');
            I.fillField('~Message', content);
            I.pressKey('Enter');
            I.waitForElement(locate('.message.myself .body').withText(content));
        });
    },
    sendFile(file) {
        I.attachFile('.ox-chat .controls input[type="file"]', file);
        I.waitForNetworkTraffic();
    }
};
