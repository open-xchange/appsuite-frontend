
const actor = require('@open-xchange/codecept-helper').actor,
    codecept = require('codeceptjs'),
    _ = require('underscore');

module.exports = actor({
    //remove previously created appointments by appointment title
    removeAllAppointments: async function (title) {
        const { skipRefresh } = await this.executeAsyncScript(function (title, done) {
            const appointments = $('.appointment')
                .toArray()
                .filter((e) => !title || $(e).text() === title)
                .map(function (e) {
                    const folder = $(e).data('folder');
                    return { folder, id: $(e).data('cid').replace(folder + '.', '') };
                });
            if (appointments.length === 0) return done({ skipRefresh: true });
            require(['io.ox/calendar/api']).then(function (api) {
                return api.remove(appointments, {});
            }).then(done);
        }, title);
        if (skipRefresh === true) return;
        this.click('#io-ox-refresh-icon');
        this.waitForDetached('#io-ox-refresh-icon .fa-spin');
    },
    // TODO move login and logout to external library when we have some experience with it
    login: async function (params, options) {
        params = [].concat(params);
        options = _.extend({
            prefix: ''
        }, options);

        const config = codecept.config.get(),
            webDriver = config.helpers['WebDriverIO'],
            user = {
                name: 'test.user-' + (Math.random() * 0xFFFFFF << 0).toString(16),
                password: 'secret'
            };

        await this.have('user', 'create', {
            ctx: { id: 10 },
            usrdata: {
                primaryEmail: user.name + '@ox-e2e-backend.novalocal',
                display_name: user.name,
                sur_name: 'Test',
                given_name: 'User',
                name: user.name,
                email1: user.name + '@ox-e2e-backend.novalocal',
                password: 'secret',
                imapLogin: user.name
            },
            auth: { login: 'oxadmin', password: 'secret' }
        });

        var launchURL = webDriver.url;
        if (launchURL.search('appsuite\\/?$') >= 0) launchURL = launchURL.substring(0, launchURL.search('appsuite\\/?$'));
        if (!/\/$/.test(launchURL)) launchURL += '/';
        launchURL += options.prefix;
        if (!/\/$/.test(launchURL)) launchURL += '/';
        launchURL += 'appsuite/';

        this.amOnPage(launchURL + '#' + params.join('&'));
        this.waitForFocus('input[name="username"]');
        this.fillField('username', user.name);
        this.fillField('password', user.password);
        this.waitToHide('.busy');
        this.click('Sign in');
        this.waitForElement('#io-ox-launcher', 20);

        // TODO store this in a clever way :)
        global.user = user;
    },
    logout: async function () {
        this.click('#io-ox-topbar-dropdown-icon > a.dropdown-toggle');
        this.click('Sign out', { css: '.smart-dropdown-container' });
        this.waitForElement('#io-ox-login-username');

        await this.have('user', 'delete', {
            ctx: { id: 10 },
            user: {
                name: global.user.name
            },
            auth: { login: 'oxadmin', password: 'secret' }
        });
    }
});
