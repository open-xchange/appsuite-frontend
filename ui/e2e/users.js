const users = [];
let I = {};

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
    const data = await I.executeSOAPRequest('OXUserService', 'create', {
        ctx: ctx,
        usrdata: usrdata
    });

    return users.push(data.return);
};
users.removeAll = async function removeAllUsers() {
    for (let user of users) {
        await I.executeSOAPRequest('OXUserService', 'delete', {
            ctx: { id: 10 },
            user
        });
    }
    users.splice(0);
};

module.exports = users;
