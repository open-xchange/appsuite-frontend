const { I } = inject();

module.exports = {
    selectMail(text) {
        I.waitForElement(locate('li.list-item').withText(text));
        I.click(locate('li.list-item').withText(text));
    }
};
