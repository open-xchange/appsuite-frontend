const _ = require('underscore'),
    users = [];
let I = {};

class User {

    constructor(opt) {
        this.userdata = opt.user;
        this.context = opt.context;
        this.I = opt.I;
    }

    hasConfig(key, value) {
        // Config structure is the following { userAttributes: { entries: [{ key: 'config', value: { entries: [{ key: 'key', value: value }] }}]} }
        // Note that the soap lib will replace arrays with a single element by that element

        // check if config exists and create config path if it does not exist
        let userAttributes = this.userdata.userAttributes = this.userdata.userAttributes || {};
        let entries = userAttributes.entries = userAttributes.entries ? [].concat(userAttributes.entries) : [];
        let configEntry = _(entries).findWhere({ key: 'config' });
        if (!configEntry) {
            entries.push({ key: 'config', value: {} });
            configEntry = _(entries).last();
        }
        let config = configEntry.value;
        let configEntries = config.entries = config.entries ? [].concat(config.entries) : [];
        let targetConfig = _(configEntries).findWhere({ key: key });
        if (!targetConfig) {
            configEntries.push({ key: key });
            targetConfig = _(configEntries).last();
        }
        targetConfig.value = value;

        return this.I.executeSoapRequest('OXUserService', 'change', {
            ctx: this.context,
            usrdata: this.userdata
        });
    }

    get(key) {
        return this.userdata[key];
    }

    toJSON() {
        return _.clone(this.userdata);
    }

}

users._init = function initUsersHelper() {
    I = actor();
};

users.getRandom = function getRandom() {
    return {
        name: 'test.user-' + (Math.random() * 0xFFFFFF << 0).toString(16),
        password: 'secret',
        domain: 'ox-e2e-backend.novalocal'
    };
};
users.create = async function createUser(user = users.getRandom(), ctx = { id: 10 }) {
    const usrdata = {
        primaryEmail: `${user.name}@${user.domain}`,
        display_name: user.name,
        sur_name: 'Test',
        given_name: 'User',
        name: user.name,
        email1: `${user.name}@${user.domain}`,
        password: user.password,
        imapLogin: user.name
    };
    const data = await I.executeSoapRequest('OXUserService', 'create', {
        ctx: ctx,
        usrdata: usrdata
    });

    return users.push(new User({ user: data.return, context: ctx, I: I }));
};
users.removeAll = async function removeAllUsers() {
    for (let user of users) {
        await I.executeSoapRequest('OXUserService', 'delete', {
            ctx: user.context,
            user: user.toJSON()
        });
    }
    users.splice(0);
};

module.exports = users;
