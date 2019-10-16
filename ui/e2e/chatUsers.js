const axios = require('axios');

class ChatUser {

    constructor(user) {
        this.user = user;
    }

    async getHeaders() {
        const adminToken = await chatUsers.getAdminToken();

        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };
    }

    async create() {
        const headers = await this.getHeaders();
        const { userdata: { email1: email, name: username } } = this.user;

        await axios({
            method: 'POST',
            url: 'https://auth.chat.os.oxui.de/auth/admin/realms/chat/users',
            data: { username, email, enabled: true },
            headers
        });

        const { data: [{ id }] } = await axios({
            method: 'GET',
            url: `https://auth.chat.os.oxui.de/auth/admin/realms/chat/users?email=${email}`,
            headers
        });

        this.clientId = id;

        await axios({
            method: 'PUT',
            url: `https://auth.chat.os.oxui.de/auth/admin/realms/chat/users/${id}/reset-password`,
            data: { type: 'password', value: 'secret', temporary: false },
            headers
        });
    }

    async delete() {
        const headers = await this.getHeaders();

        await axios({
            method: 'DELETE',
            url: `https://auth.chat.os.oxui.de/auth/admin/realms/chat/users/${this.clientId}`,
            headers
        });
    }
}

const chatUsers = [];

chatUsers.getAdminToken = async function () {
    if (this.adminToken) return this.adminToken;

    const { data: { access_token } } = await axios({
        method: 'POST',
        url: 'https://auth.chat.os.oxui.de/auth/realms/master/protocol/openid-connect/token',
        data: require('querystring').stringify({ username: 'admin', password: 'secret', grant_type: 'password', client_id: 'admin-cli' }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.adminToken = access_token;
    return this.adminToken;
};

chatUsers.createFromUser = async function (user) {
    const chatUser = new ChatUser(user);
    this.push(chatUser);
    return chatUser.create();
};

chatUsers.deleteAll = function () {
    return Promise.all(this.map(chatUser => chatUser.delete()));
};

module.exports = chatUsers;
