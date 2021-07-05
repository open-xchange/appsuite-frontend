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

define('io.ox/switchboard/views/jitsi-call', [
    'io.ox/backbone/views/disposable',
    'io.ox/switchboard/api',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (DisposableView, api, settings, gt) {

    'use strict';

    var JitsiCallView = DisposableView.extend({

        className: 'conference-view jitsi',

        constructor: function () {
            var meeting = api.createJitsiMeeting();
            DisposableView.prototype.constructor.apply(this, arguments);
            // do not overwrite this.model if it was already passed as an argument
            (this.model || new Backbone.Model()).set({ type: 'jitsi', state: 'done', joinURL: meeting.joinURL });
        },

        getJoinURL: function () {
            return this.model.get('joinURL');
        },

        render: function () {
            this.renderDone();
            return this;
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
        }
    });

    return JitsiCallView;
});
