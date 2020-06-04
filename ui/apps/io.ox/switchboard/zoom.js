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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/zoom', [
    'io.ox/switchboard/api',
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/switchboard'
], function (api, DisposableView, gt) {

    'use strict';

    api.socket.on('zoom:tokens:added', function () {
        ox.trigger('zoom:tokens:added');
    });

    var View = DisposableView.extend({

        constructor: function () {
            this.model = new Backbone.Model({ type: 'zoom', state: 'authorized', joinLink: '' });
            // the original constructor will call initialize()
            DisposableView.prototype.constructor.apply(this, arguments);
            // set initial state (now; otherwise we get into cyclic deps)
            this.model.set('state', this.getInitialState());
            this.listenTo(this.model, 'change:state', this.onStateChange);
            this.listenTo(ox, 'zoom:tokens:added', function () {
                if (this.model.get('state') !== 'unauthorized') return;
                this.setState('authorized');
            });
            this.$el.on('click', '[data-action="start-oauth"]', $.proxy(exports.startOAuthHandshake, exports));
        },

        render: function () {
            this.onStateChange();
            return this;
        },

        getInitialState: function () {
            if (!this.isDone()) return 'authorized';
            return 'done';
        },

        setState: function (state) {
            if (this.disposed) return;
            this.model.set('state', state);
        },

        isDone: function () {
            return !!this.getJoinLink();
        },

        getJoinLink: function () {
            return this.model && this.model.get('joinLink');
        },

        onStateChange: function () {
            this.$el.empty();
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
                case 'error':
                    this.renderError();
                    this.model.unset('error');
                    break;
                // no default
            }
        },

        // no OAuth token yet
        renderAuthRequired: function () {
            this.$el.append(
                $('<i class="fa fa-exclamation conference-logo">'),
                $('<p>').text(
                    gt('You first need to connect %1$s with Zoom. To do so, you need a Zoom Account. If you don\'t have an account yet, it is sufficient to create a free one.', ox.serverConfig.productName)
                ),
                $('<p>').append(
                    $('<button type="button" class="btn btn-default" data-action="start-oauth">').text('Connect with Zoom ...')
                )
            );
        },

        // shownn while takling to the API
        renderPending: function () {
            this.$el.append(
                $('<div class="pending">').append(
                    $('<i class="fa fa-video-camera conference-logo">'),
                    $.txt('Connecting to Zoom ...'),
                    $('<i class="fa fa-refresh fa-spin">')
                )
            );
        },

        renderError: function () {
            this.$el.append(
                $('<i class="fa fa-exclamation conference-logo">'),
                $('<div class="alert alert-danger">').text(
                    this.model.get('error') || gt('Oops! Something went wrong')
                )
            );
        },

        renderDone: function () {
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
                console.log('response', response);
                if (!response) return rejectWithUnexpectedError();
                if (/^2/.test(response.status)) return def.resolve(response.data);
                def.reject(response);
            });
            return def;
        },

        // data:
        // - <string> topic
        // - <int> startTime
        // - <string> timezone
        // - <int> duration (in minutes)
        // - <string> [agenda]
        createMeeting: function (data) {
            var tz = data.timezone || 'Europe/Berlin';
            return createMeeting({
                agenda: data.agenda || '',
                duration: data.duration || 60,
                password: getPassword(),
                start_time: moment.tz(data.startTime, tz).format('YYYY-MM-DDTHH:mm:ss'),
                timezone: tz,
                topic: data.topic || '',
                type: 2
            });
        },

        createInstantMeeting: function () {
            return createMeeting({ type: 1, password: getPassword() });
        }
    };

    function rejectWithUnexpectedError() {
        return { status: 500, internal: true, message: 'Ooops. That didn\'t work. Please try again.' };
    }

    function createMeeting(data) {
        data = _.extend({ settings: { join_before_host: true } }, data);
        return exports.api('POST', '/users/me/meetings', data);
    }

    function getPassword() {
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

