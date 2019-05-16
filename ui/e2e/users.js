const users = require('@open-xchange/codecept-helper').users,
    contexts = require('@open-xchange/codecept-helper/src/contexts'),
    helper = new (require('@open-xchange/codecept-helper').helper)(),
    wrappedCreate = users.create;

users.create = function createUsers(user, ctxt) {
    return wrappedCreate.apply(this, [user, ctxt || { id: contexts[0].id }])
        .then(user => {
            user.setAccessCombinationByName = function (access_combination_name) {
                return helper.executeSoapRequest('OXUserService', 'changeByModuleAccessName', {
                    ctx: { id: user.context.id },
                    access_combination_name,
                    user: { id: user.get('id') },
                    auth: user.auth
                });
            };
            return user.setAccessCombinationByName('all').then(()=> user);
        });
};

module.exports = users;
