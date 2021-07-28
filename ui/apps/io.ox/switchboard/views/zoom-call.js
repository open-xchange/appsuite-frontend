/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/switchboard/views/zoom-call', [
    'io.ox/switchboard/zoom',
    'gettext!io.ox/switchboard'
], function (zoom, gt) {

    'use strict';

    var ZoomCallView = zoom.View.extend({

        className: 'conference-view zoom',

        initialize: function () {
            window.zoomCall = this;
            this.listenTo(this, 'connect', function () {
                zoom.startOAuthHandshake();
            });
        },

        renderAuthRequired: function () {
            this.$el.append(
                $('<div class="alert alert-info">').text(
                    gt('You first need to connect %1$s with Zoom. To do so, you need a Zoom Account. If you don\'t have an account yet, it is sufficient to create a free one.', ox.serverConfig.productName)
                )
            );
        },

        renderPending: function () {
            this.$el.append(
                $('<div class="pending">').append(
                    $.txt(gt('Connecting to Zoom ...')),
                    $('<i class="fa fa-refresh fa-spin" aria-hidden="true">')
                )
            );
        },

        renderDone: function () {
            var url = this.getJoinURL() || 'https://...';
            this.$el.addClass('compact').append(
                $('<div>').append(
                    $('<a target="_blank" rel="noopener">').attr('href', url).html(
                        _.escape(url).replace(/([-/.?&=])/g, '$1<wbr>')
                    )
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action">')
                        .text(gt('Copy to clipboard'))
                        .attr('data-clipboard-text', url)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        createConnectButtons: function () {
            return $('<div class="action-button-rounded">').append(
                this.createButton('default', 'cancel', 'times', gt('Cancel')),
                this.createButton('primary', 'connect', 'plug', gt('Connect with Zoom'))
            );
        },

        createMeeting: function () {
            return zoom.createInstantMeeting().then(
                this.createMeetingSuccess.bind(this),
                this.createMeetingFailed.bind(this)
            );
        },

        createMeetingSuccess: function (result) {
            //console.log('createMeetingSuccess', result.join_url, result);
            this.model.set({ joinURL: result.join_url, state: 'done' });
        }
    });

    return ZoomCallView;
});
