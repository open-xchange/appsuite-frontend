const users = require('@open-xchange/codecept-helper').users;
const KcAdminClient = require('keycloak-admin').default;


class Client {

    async authenticate() {
        if (!this.ready) {
            this.ready = (async () => {
                const kcAdminClient = new KcAdminClient({
                    baseUrl: `${process.env.PROVISIONING_KEYCLOAK_URL}/auth`,
                    realmName: 'master'
                });
                await kcAdminClient.auth({
                    username: process.env.PROVISIONING_KEYCLOAK_USER,
                    password: process.env.PROVISIONING_KEYCLOAK_PASS,
                    grantType: 'password',
                    clientId: 'admin-cli',
                });
                kcAdminClient.setConfig({
                    realmName: process.env.PROVISIONING_KEYCLOAK_REALM,
                });
                return kcAdminClient;
            })();
        }
        return this.ready;
    }

    async execute(command, data) {
        let kcAdminClient = await this.authenticate(), err;
        for (let i = 0; i < 10; i++) {
            try {
                const res = await kcAdminClient.users[command](data);
                return res;
            } catch (e) {
                delete this.ready;
                kcAdminClient = await this.authenticate();
                err = e;
            }
        }
        throw err;
    }
}

const { createUser, deleteUser } = (() => {
    const client = new Client();

    return {
        createUser(userdata, context) {
            const username = `${userdata.name}@${context.id}`;
            const data = {
                email: userdata.email1,
                emailVerified: true,
                id: userdata.name,
                username,
                enabled: true,
                attributes: {
                    'user-at-context': username,
                    username: userdata.name,
                    automated: true
                },
                credentials: [{ type: 'password', value: userdata.password }],
            };
            return client.execute('create', data);
        },
        deleteUser(id) {
            return client.execute('del', { id });
        }
    }
})();

users.create = (function (create) {
    return async function () {
        const user = await create.apply(users, arguments);
        const { id } = await createUser(user.userdata, user.context);
        user.remove = ((remove) => {
            return function () {
                return Promise.all([
                    deleteUser(id),
                    remove.apply(user, arguments)
                ]);
            };
        })(user.remove);
        return user;
    };
}(users.create));

module.exports = users;
