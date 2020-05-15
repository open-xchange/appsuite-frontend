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

define('io.ox/switchboard/views/zoom-meeting', [
    'io.ox/switchboard/api',
    'io.ox/backbone/views/disposable',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard'
], function (api, DisposableView, settings, gt) {

    'use strict';

    var host = settings.get('switchboard/host');
    var accessToken = settings.get('switchboard/zoom/accessToken');
    var refreshToken = settings.get('switchboard/zoom/refreshToken');

    var ZoomMeetingView = DisposableView.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="start-oauth"]': 'startOAuthHandshake',
            'click [data-action="copy-to-location"]': 'copyToLocation'
        },

        initialize: function (options) {
            this.appointment = options.appointment;
            this.model = new Backbone.Model({ type: 'zoom', state: this.getInitialState() });
            this.listenTo(this.model, 'change:state', this.onStateChange);
            this.listenTo(ox, 'zoom:authorized', function () {
                this.model.set('state', 'authorized');
            });
            window.zoomMeeting = this;
        },

        render: function () {
            this.onStateChange();
            return this;
        },

        getInitialState: function () {
            if (!accessToken) return 'unauthorized';
            if (!this.getJoinLink()) return 'authorized';
            return 'meeting';
        },

        getJoinLink: function () {
            // we use categories (which expects array of string) to store the URL
            var array = this.appointment.get('categories');
            if (!_.isArray(array) || !array.length) return '';
            return array[0];
        },

        onStateChange: function () {
            this.$el.empty();
            switch (this.model.get('state')) {
                case 'unauthorized':
                    this.renderAuthRequired();
                    break;
                case 'authorized':
                    this.renderMeetingRequest();
                    this.createMeeting();
                    break;
                case 'meeting':
                    this.renderMeeting();
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
        renderMeetingRequest: function () {
            this.$el.append(
                $('<div class="pending">').append(
                    $('<i class="fa fa-video-camera conference-logo">'),
                    $.txt('Creating new Zoom Meeting ...'),
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

        renderMeeting: function () {
            // show meeting
            var link = this.getJoinLink() || 'https://...';
            this.$el.append(
                $('<i class="fa fa-video-camera conference-logo">'),
                $('<div class="ellipsis">').append(
                    $('<b>').text('Link: '),
                    $('<a target="_blank" rel="noopener">').attr('href', link).text(link)
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        .text('Copy to location field'),
                    $('<a href="#" class="secondary-action">')
                        .text('Copy to clipboard')
                        .attr('data-clipboard-text', link)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        startOAuthHandshake: function () {
            var url = host + '/zoom/oauth-callback?state=' + encodeURIComponent(api.userId);
            var top = (screen.availHeight - 768) / 2 >> 0;
            var left = (screen.availWidth - 1024) / 2 >> 0;
            window.open(url, 'zoom', 'width=1024,height=768,left=' + left + ',top=' + top + ',scrollbars=yes');
        },

        copyToLocation: function (e) {
            e.preventDefault();
            this.appointment.set('location', 'Zoom Meeting: ' + this.getJoinLink());
        },

        createMeeting: function () {
            var data = this.appointment.toJSON();
            var tz = data.startDate.timezone;
            // var attendees = _(this.appointment.get('attendees')).pluck('email').join(' ');
            return $.post({
                url: host + '/zoom/api/users/me/meetings',
                headers: { authorization: 'Bearer ' + accessToken },
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({
                    agenda: data.note || '',
                    duration: 60,
                    // schedule_for: attendees,
                    start_time: moment.tz(data.startDate.value, tz).format('YYYY-MM-DDTHH:mm:ss'),
                    timezone: tz,
                    topic: data.summary || gt('New appointment'),
                    settings: {
                        join_before_host: true
                    }
                })
            })
            .then(
                function success(result) {
                    console.log('Yay', result);
                    this.appointment.set('categories', [result.join_url]);
                    this.model.set('meeting', result);
                    this.model.set('state', 'meeting');
                }.bind(this),
                function fail(xhr, textStatus, errorThrown) {
                    var error = xhr.responseJSON;
                    if (error && error.code === 124) {
                        // 124 means "Invalid token"
                        settings.set('switchboard/zoom/accessToken', (accessToken = '')).save();
                        return this.reauthorize().then(this.createMeeting.bind(this));
                    }
                    this.model.set('error', error || errorThrown);
                    this.model.set('state', 'error');
                }.bind(this)
            );
        },

        reauthorize: function () {
            // fail early if we don't get a refresh token
            if (!refreshToken) return $.Deferred().reject();
            // use refresh token to get a new access token
            return $.post({
                url: host + '/zoom/reauthorize?user=hurz',
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({ refresh_token: refreshToken })
            })
            .then(function (data) {
                console.log('reauthorize', data);
                // fail if we don't get an access token
                if (!data.access_token) return $.Deferred().reject();
                settings
                    .set('switchboard/zoom/accessToken', (accessToken = data.access_token))
                    .set('switchboard/zoom/refreshToken', (refreshToken = data.refresh_token))
                    .save();
            });
        }
    });

    api.socket.on('newToken', function (data) {
        settings
            .set('switchboard/zoom/accessToken', (accessToken = data.accessToken))
            .set('switchboard/zoom/refreshToken', (refreshToken = data.refreshToken))
            .save();
        ox.trigger('zoom:authorized');
    });

    return ZoomMeetingView;
});
