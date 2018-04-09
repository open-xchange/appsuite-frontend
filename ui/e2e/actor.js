
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

    createRandomUser: function () {
        const user = {
            username: 'test.user-' + (Math.random() * 0xFFFFFF << 0).toString(16),
            password: 'secret'
        };

        return this.executeSOAPRequest('OXUserService', 'create', {
            ctx: { id: 10 },
            usrdata: {
                primaryEmail: user.username + '@ox-e2e-backend.novalocal',
                display_name: user.username,
                sur_name: 'Test',
                given_name: 'User',
                name: user.username,
                email1: user.username + '@ox-e2e-backend.novalocal',
                password: 'secret',
                imapLogin: user.username
            },
            auth: { login: 'oxadmin', password: 'secret' }
        }).then(function () {
            global.users = (global.users || []);
            global.users.push(user);
            return user;
        });
    },

    removeAllRandomUsers: async function () {
        if (!global.users) return;
        for (let user of global.users) {
            await this.executeSOAPRequest('OXUserService', 'delete', {
                ctx: { id: 10 },
                user: {
                    name: user.username
                },
                auth: { login: 'oxadmin', password: 'secret' }
            });
        }
    },

    login: function (params, options) {
        params = [].concat(params);
        options = _.extend({
            userIndex: 0,
            prefix: ''
        }, options);

        const config = codecept.config.get(),
            webDriver = config.helpers['WebDriverIO'],
            users = global.users || config.helpers['OpenXchange'].users,
            user = users[options.userIndex];

        var launchURL = webDriver.url;
        if (launchURL.search('appsuite\\/?$') >= 0) launchURL = launchURL.substring(0, launchURL.search('appsuite\\/?$'));
        if (!/\/$/.test(launchURL)) launchURL += '/';
        launchURL += options.prefix;
        if (!/\/$/.test(launchURL)) launchURL += '/';
        launchURL += 'appsuite/';

        this.amOnPage(launchURL + '#' + params.join('&'));
        this.waitForFocus('input[name="username"]');
        this.fillField('username', user.username);
        this.fillField('password', user.password);
        this.waitToHide('.busy');
        this.click('Sign in');
        this.waitForElement('#io-ox-launcher', 20);
    }

});
