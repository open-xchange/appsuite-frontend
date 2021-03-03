/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/api', [
    'io.ox/switchboard/api',
    'settings!io.ox/chat'
], function (switchboardApi, settings) {

    'use strict';

    // use '' as fallback so one missing chathost doesn't block the whole UI
    var host = ox.serverConfig.chatHost || settings.get('host') || '';
    var url = (_.device('!IE') && host !== '') ? new URL('https://' + host.replace(/^https?:\/\//, '')) :
        // simple fallback, might not work for every host url
        {
            href: 'https://' + host.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/',
            origin: 'https://' + host.replace(/^https?:\/\//, '').replace(/\/$/, '')
        };

    var api = {
        host: host,
        urlRoot: url.href,
        url: url.href + 'api',
        origin: url.origin,
        userId: switchboardApi.userId,
        isMyself: function (id) {
            return switchboardApi.isMyself(id);
        }
    };

    function refreshJWT(payload) {
        var def = new $.Deferred(),
            timeout = setTimeout(def.reject, 5000);
        switchboardApi.socket.emit('jwt-sign', payload || {}, function (jwt) {
            if (def.state() !== 'pending') return;
            clearTimeout(timeout);
            ox.switchboardJwt = jwt;
            def.resolve(jwt);
        });
        return def;
    }

    function getJwtFromSwitchboard() {
        var jwt = ox.switchboardJwt;
        if (jwt) {
            try {
                var currentTime = Math.floor(Date.now() / 1000);
                if (window.jwt_decode(jwt).exp > currentTime - 120) return $.when(ox.switchboardJwt);
            } catch (err) {
                console.error(err);
            }
        }
        return refreshJWT();
    }

    function request(opt) {
        return getJwtFromSwitchboard().then(function (jwt) {
            // fallback to _.extend for backwards compatibility, hello IE11
            var ObjectAssign = Object.assign || _.extend;
            opt = ObjectAssign({ headers: { 'Authorization': 'Bearer ' + jwt } }, opt);
            return $.ajax(opt);
        }).catch(function (res) {
            if (res.status !== 401) throw res;
            console.error('Chat authentication error: JWT invalid');
            // try to refresh the jwt once
            return refreshJWT({ error: { status: res.status, responseText: res.responseText } }).then($.ajax.bind($, opt));
        });
    }

    api.roomToEndpointMapping = {
        private: '/rooms/private',
        group: '/rooms/groups',
        channel: '/rooms/channels',
        all: '/rooms/all'
    };

    api.request = request;
    api.getJwtFromSwitchboard = getJwtFromSwitchboard;

    api.updateDelivery = function (roomId, messageId, state) {
        var url = api.url + '/rooms/' + roomId + '/delivery/' + messageId;
        return request({ method: 'POST', url: url, data: { state: state } });
    };

    api.joinChannel = function (roomId) {
        return request({ method: 'POST', url: api.url + '/rooms/channels/' + roomId + '/members' });
    };

    api.getChannelByType = function (type, roomId) {
        var endpoint = api.roomToEndpointMapping[type];
        return request({ url: api.url + endpoint + '/' + roomId });
    };

    api.leaveRoom = function (room) {
        var endpoint = api.roomToEndpointMapping[room.get('type')],
            url = api.url + endpoint + '/' + room.get('roomId') + '/members';
        return request({ method: 'DELETE', url: url, processData: false, contentType: false });
    };

    api.setRoomState = function (roomId, state) {
        var url = api.url + '/rooms/' + roomId + '/active/' + state;
        return request({ method: 'PUT', url: url, processData: false, contentType: false });
    };

    api.setFavorite = function (roomId, state) {
        var url = api.url + '/rooms/' + roomId + '/favorite/' + state;
        return request({ method: 'PUT', url: url, processData: false, contentType: false });
    };

    api.uploadIcon = function (room, icon) {
        var formData = new FormData(),
            endpoint = api.roomToEndpointMapping[room.get('type')];

        formData.append('icon', icon);

        var url = api.url + endpoint + '/' + room.get('roomId') + '/icon/';
        return api.request({ contentType: false, processData: false, method: 'POST', url: url, data: formData });
    };

    api.deleteIcon = function (room) {
        var endpoint = api.roomToEndpointMapping[room.get('type')],
            url = api.url + endpoint + '/' + room.get('roomId') + '/icon/';
        return request({ method: 'DELETE', url: url });
    };

    api.deleteGroup = function (roomId) {
        var url = api.url + '/rooms/groups/' + roomId;
        return request({ method: 'DELETE', url: url });
    };

    api.getUserId = function () { return request({ url: api.url + '/user' }); };

    api.elasticSearch = function (query) {
        return request({ url: api.url + '/search/messages?' + $.param({ query: query }) })
            .then(function (data) { return data; }, function () { return []; });
    };

    api.deleteMessage = function (message) {
        var url = api.url + '/rooms/' + message.get('roomId') + '/messages/' + message.get('messageId');
        return api.request({ method: 'DELETE', url: url });
    };

    api.editMessage = function (content, message) {
        var url = api.url + '/rooms/' + message.get('roomId') + '/messages/' + message.get('messageId');
        return api.request({ contentType: 'application/json', method: 'PATCH', url: url, data:  JSON.stringify({ content: content }) });
    };

    function formDownloadWithJwtAuth(url, token) {
        $('<form method="post" target="_blank">')
            .attr('action', url)
            .append($('<input type="hidden" name="jwt">').val(token))
            .appendTo('body').submit().remove();
    }

    api.downloadFile = function (url) {
        api.getJwtFromSwitchboard().then(function (token) {
            formDownloadWithJwtAuth(url, token);
        });
    };

    api.typing = function (roomId, state) {
        var url = api.url + '/rooms/' + roomId + '/typing';
        return request({ method: 'POST', url: url, data: { state: state } });
    };

    return api;
});
