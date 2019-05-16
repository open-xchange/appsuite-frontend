const users = require('@open-xchange/codecept-helper').users,
    contexts = require('@open-xchange/codecept-helper/src/contexts'),
    wrappedCreate = users.create;

users.create = function createUsers(user, ctxt) {
    return wrappedCreate.apply(this, [user, ctxt || contexts[0]]);
};

module.exports = users;
