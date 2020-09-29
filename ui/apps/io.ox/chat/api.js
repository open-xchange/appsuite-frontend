/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */


define('io.ox/chat/api', [
    'io.ox/switchboard/api',
    'settings!io.ox/chat'
], function (switchboardApi, settings) {

    'use strict';

    var host = _.url.hash('chatHost') || ox.serverConfig.chatHost || settings.get('host');
    var url = new URL('https://' + host.replace(/^https?:\/\//, ''));

    var api = {
        host: host,
        urlRoot: url.href,
        url: url.href + 'api',
        origin: url.origin
    };

    function blobToDataUri(blob) {
        var def = $.Deferred();
        var reader = new FileReader();
        reader.onloadend = function () {
            def.resolve(reader.result);
        };
        reader.readAsDataURL(blob);
        return def;
    }

    function failHandler(response) {
        if (response.status === 401) console.error('Chat authentication error: JWT invalid');
    }

    function getJwtFromSwitchboard() {
        var def = $.Deferred();
        var jwt = ox.switchboardJwt;
        if (jwt) {
            var currentTime = Math.floor(Date.now() / 1000);
            if (window.jwt_decode(jwt).exp > currentTime - 120) return def.resolve(ox.switchboardJwt);
        }
        switchboardApi.socket.emit('jwt-sign', {}, function (jwt) {
            ox.switchboardJwt = jwt;
            def.resolve(jwt);
        });
        return def;
    }

    function request(opt) {
        return getJwtFromSwitchboard().then(function (jwt) {
            opt = Object.assign({ headers: { 'Authorization': 'Bearer ' + jwt } }, opt);
            return $.ajax(opt).fail(failHandler);
        });
    }

    function requestDataUrl(opt) {
        opt.xhrFields = { responseType: 'blob' };
        return request(opt).then(function (blob) {
            return blobToDataUri(blob);
        });
    }

    api.request = request;
    api.requestDataUrl = requestDataUrl;
    api.getJwtFromSwitchboard = getJwtFromSwitchboard;

    api.updateDelivery = function (roomId, messageId, state) {
        var url = api.url + '/rooms/' + roomId + '/delivery/' + messageId;
        return request({ method: 'POST', url: url, data: { state: state } });
    };

    api.joinChannel = function (roomId) {
        return request({ method: 'POST', url: api.url + '/rooms/' + roomId + '/members' });
    };

    api.getChannelByType = function (type, roomId) {
        return request({ url: api.url + '/' + type + '/' + roomId });
    };

    api.leaveChannelByType = function (type, roomId) {
        var url = api.url + '/' + type + '/' + roomId + '/members';
        return request({ method: 'DELETE', url: url, processData: false, contentType: false });
    };

    api.setRoomState = function (roomId, state) {
        var url = api.url + '/rooms/' + roomId + '/active/' + state;
        return request({ method: 'PUT', url: url, processData: false, contentType: false });
    };

    api.getUserId = function () { return request({ url: api.url + '/user' }); };

    api.elasticSearch = function (query) {
        return request({ url: api.url + '/search/messages?' + $.param({ query: query }) })
            .then(function (data) { return data; });
    };

    return api;
});
