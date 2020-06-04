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

define('io.ox/switchboard/views/zoom-call', [
    'io.ox/switchboard/zoom',
    'gettext!io.ox/switchboard'
], function (zoom, gt) {

    'use strict';

    var ZoomCallView = zoom.View.extend({

        className: 'conference-view zoom',

        initialize: function () {
            window.zoomCall = this;
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
                    $.txt('Connecting to Zoom ...'),
                    $('<i class="fa fa-refresh fa-spin">')
                )
            );
        },

        renderDone: function () {
            var link = this.getJoinLink() || 'https://...';
            this.$el.addClass('compact').append(
                $('<div>').append(
                    $('<a target="_blank" rel="noopener">').attr('href', link).html(
                        _.escape(link).replace(/([-/.?&=])/g, '$1<wbr>')
                    )
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action">')
                        .text(gt('Copy to clipboard'))
                        .attr('data-clipboard-text', link)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        createMeeting: function () {
            return zoom.createInstantMeeting().then(
                this.createMeetingSuccess.bind(this),
                this.createMeetingFailed.bind(this)
            );
        },

        createMeetingSuccess: function (result) {
            console.log('createMeetingSuccess', result.join_url, result);
            this.model.set({ joinLink: result.join_url, state: 'done' });
        }
    });

    return ZoomCallView;
});
