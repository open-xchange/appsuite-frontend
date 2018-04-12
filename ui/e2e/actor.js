
const actor = require('@open-xchange/codecept-helper').actor,
    _ = require('underscore'),
    util = require('./util');

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

    login: function (params, options) {
        params = [].concat(params);
        options = _.extend({
            prefix: ''
        }, options);

        const user = options.user || require('./users')[0],
            baseURL = util.getURLRoot(),
            prefix = options.prefix ? `${options.prefix}/` : '',
            url = `${baseURL}/${prefix}appsuite/`;

        this.amOnPage(url + '#' + params.join('&'));
        this.waitForFocus('input[name="username"]');
        this.fillField('username', user.name);
        this.fillField('password', user.password);
        this.waitToHide('.busy');
        this.click('Sign in');
        this.waitForElement('#io-ox-launcher', 20);
    }

});
