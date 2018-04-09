const users = [];

users.getRandom = function getRandom() {
    return {
        name: 'test.user-' + (Math.random() * 0xFFFFFF << 0).toString(16),
        password: 'secret',
        domain: 'ox-e2e-backend.novalocal'
    };
};
users.create = function createUser(user = users.getRandom(), ctx = { id: 10 }) {
    return {
        ctx,
        data: {
            primaryEmail: `${user.name}@${user.domain}`,
            display_name: user.name,
            sur_name: 'Test',
            given_name: 'User',
            name: user.name,
            email1: `${user.name}@${user.domain}`,
            password: user.password,
            imapLogin: user.name
        }
    };
};

module.exports = users;
