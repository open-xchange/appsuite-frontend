/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/switchboard/zoom', [
    'io.ox/switchboard/api',
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (api, DisposableView, ext, settings, gt) {

    'use strict';

    api.socket.on('zoom:tokens:added', function () {
        ox.trigger('zoom:tokens:added');
    });

    var View = DisposableView.extend({

        POINT: 'io.ox/switchboard/views/zoom-meeting',

        constructor: function () {
            this.model = new Backbone.Model({ type: 'zoom', state: 'authorized', joinURL: '' });
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            // set initial state (now; otherwise we get into cyclic deps)
            this.model.set('state', this.getInitialState());
            this.listenTo(this.model, 'change:state', this.onStateChange);
            this.listenTo(ox, 'zoom:tokens:added', function () {
                if (this.model.get('state') !== 'unauthorized') return;
                this.setState('authorized');
            });
            this.listenTo(ox, 'switchboard:disconnect', function () { this.setState('offline'); });
            this.listenTo(ox, 'switchboard:reconnect', function () { this.setState(this.getInitialState()); });
            this.$el.on('click', '[data-action="start-oauth"]', $.proxy(exports.startOAuthHandshake, exports));
        },

        render: function () {
            this.onStateChange();
            return this;
        },

        getInitialState: function () {
            if (!api.isOnline()) return 'offline';
            if (!this.isDone()) return 'authorized';
            return 'done';
        },

        setState: function (state) {
            if (this.disposed) return;
            this.model.set('state', state);
        },

        isDone: function () {
            return !!this.getJoinURL();
        },

        getJoinURL: function () {
            return this.model && this.model.get('joinURL');
        },

        onStateChange: function () {
            this.$el.empty().removeClass('error');
            switch (this.model.get('state')) {
                case 'unauthorized':
                    this.renderAuthRequired();
                    break;
                case 'authorized':
                    this.renderPending();
                    this.createMeeting();
                    break;
                case 'done':
                    this.renderDone();
                    break;
                case 'offline':
                    this.renderOffline();
                    break;
                case 'error':
                    this.renderError();
                    this.model.unset('error');
                    break;
                // no default
            }
        },

        renderPoint: function (suffix) {
            ext.point(this.POINT + '/' + suffix).invoke('render', this, new ext.Baton());
        },

        // no OAuth token yet
        renderAuthRequired: function () {
            this.renderPoint('auth');
        },

        // shown while talking to the API
        renderPending: function () {
            this.renderPoint('pending');
        },

        renderError: function () {
            this.renderPoint('error');
        },

        renderOffline: function () {
            this.renderPoint('offline');
        },

        renderDone: function () {
            this.renderPoint('done');
        },

        createMeeting: function () {
            return $.when();
        },

        createMeetingFailed: function (error) {
            if (this.disposed) return;
            if (error.status === 401) {
                // 401 equals no or invalid tokens
                this.model.set('state', 'unauthorized');
            } else {
                this.model.set('error', error.message);
                this.model.set('state', 'error');
            }
        }
    });

    var exports = {

        View: View,

        getCallbackURL: function () {
            return api.host + '/zoom/oauth-callback?state=' + encodeURIComponent(api.userId);
        },

        startOAuthHandshake: function () {
            var top = (screen.availHeight - 768) / 2 >> 0;
            var left = (screen.availWidth - 1024) / 2 >> 0;
            return window.open(this.getCallbackURL(), 'zoom', 'width=1024,height=768,left=' + left + ',top=' + top + ',scrollbars=yes');
        },

        getAccount: function () {
            return this.api('GET', '/users/me');
        },

        removeAccount: function () {
            var def = $.Deferred();
            api.socket.emit('zoom:tokens:remove', function () { def.resolve(); });
            return def;
        },

        api: function (method, url, data) {
            var def = $.Deferred();
            api.socket.emit('zoom', { method: method, url: url, data: data || {} }, function (response) {
                if (!response) return rejectWithUnexpectedError();
                if (/^2/.test(response.status)) return def.resolve(response.data);
                def.reject(response);
            });
            return def;
        },

        getMeeting: function (id) {
            return exports.api('GET', '/meetings/' + id);
        },

        // data:
        // - <string> topic
        // - <int> startTime
        // - <string> timezone
        // - <int> duration (in minutes)
        // - <string> [agenda]
        createMeeting: function (data) {
            data = _.extend({ settings: { join_before_host: true } }, data);
            if (!data.password && settings.get('zoom/addMeetingPassword', true)) data.password = createPassword();
            return exports.api('POST', '/users/me/meetings', data);
        },

        createInstantMeeting: function () {
            return this.createMeeting({ type: 1 });
        },

        changeMeeting: function (id, changes) {
            return exports.api('PATCH', '/meetings/' + id, changes);
        },

        deleteMeeting: function (id) {
            return exports.api('DELETE', '/meetings/' + id + '?schedule_for_reminder=false');
        }
    };

    function rejectWithUnexpectedError() {
        return { status: 500, internal: true, message: gt('Something went wrong. Please try again.') };
    }

    function createPassword() {
        // [API documentation]
        // Password may only contain the following characters:
        // [a-z A-Z 0-9 @ - _ *] and can have a maximum of 10 characters.
        //
        // The admin might set minimum password requirement settings:
        //   * Have a minimum password length
        //   * Have at least 1 letter (a,b,c...)
        //   * Have at least 1 number (1,2,3...)
        //   * Have at least 1 special character (!,@,#...)
        //   * Only allow numeric password
        //
        // Lets always generate 10 characters with letters, numbers, and special characters
        // to be on the safe side also configuration wise. users are expected to copy and send
        // links instead of manually typing passwords.
        //
        // Taking the verbose but short way:
        var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890@-_*';
        return _.range(10).map(function () { return chars[Math.random() * chars.length >> 0]; }).join('');
    }

    return exports;
});

