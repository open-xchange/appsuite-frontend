const users = require('@open-xchange/codecept-helper').users;
const oldCreate = users.create;
function wrappedCreate() {
    const args = arguments;
    return oldCreate.apply(this, args).catch((e) => {
        if (!/FLD-0038/.test(e.faultstring)) throw e;
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                wrappedCreate.apply(this, args).then(resolve, reject);
            }, 1000);
        });
    });
}

users.create = wrappedCreate;
module.exports = users;
