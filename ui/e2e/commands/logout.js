module.exports = function () {
    this.click('#io-ox-topbar-dropdown-icon > a.dropdown-toggle');
    this.click('Sign out');
    this.waitForElement('#io-ox-login-username');
};
