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
